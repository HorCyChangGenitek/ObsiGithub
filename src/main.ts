import { Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { ObsiGithubSettings, ObsiGithubSettingTab, DEFAULT_SETTINGS } from './settings';
import { StateManager } from './core/state_manager';
import { GitHubService } from './core/github_service';
import { MarkdownProcessor } from './core/markdown_processor';

import { MANAGEMENT_VIEW_TYPE, ManagementView } from './ui/management_view';

export default class ObsiGithubPlugin extends Plugin {
    settings: ObsiGithubSettings;
    stateManager: StateManager;
    githubService: GitHubService;
    markdownProcessor: MarkdownProcessor;

    async onload() {
        await this.loadSettings();

        // DEBUG: Confirm plugin reload
        new Notice("ObsiGithub: Loaded v1.1.5 (UI Sync Fix)");

        // Initialize Core Services
        this.stateManager = new StateManager(this);
        this.githubService = new GitHubService(this.settings);
        this.markdownProcessor = new MarkdownProcessor(this.app);

        // Add Settings Tab
        this.addSettingTab(new ObsiGithubSettingTab(this.app, this));

        // Register Management View
        this.registerView(
            MANAGEMENT_VIEW_TYPE,
            (leaf) => new ManagementView(leaf, this)
        );

        // Add Ribbon Icon - Activate View
        this.addRibbonIcon('github', 'Open ObsiGithub Management', async () => {
            await this.activateView();
        });

        // Add Command
        this.addCommand({
            id: 'publish-current-note',
            name: 'Publish Current Note',
            callback: async () => {
                // @ts-ignore
                await this.publishCurrentNote();
            }
        });

        // Add Context Menu Items
        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    const uuid = this.settings.fileMap[file.path];
                    const status = this.stateManager.getStatus(file.path);
                    // FIXED: If status is 'unshared', treat as NOT published (allow re-publish)
                    const isPublished = !!uuid && status !== 'unshared';

                    // 1. Publish / Update Share
                    menu.addItem((item) => {
                        item
                            .setTitle(isPublished ? "Update Share on GitHub" : "Publish to GitHub")
                            .setIcon(isPublished ? "refresh-cw" : "upload")
                            .onClick(async () => {
                                await this.publishNote(file);
                            });
                    });

                    // Additional Actions (Only if UUID exists)
                    if (isPublished) {
                        // 2. Check Status
                        menu.addItem((item) => {
                            item
                                .setTitle("Check Remote Status")
                                .setIcon("help-circle")
                                .onClick(async () => {
                                    new Notice(`Checking status for ${file.basename}...`);
                                    try {
                                        const exists = await this.githubService.checkPathExists(uuid);
                                        const newStatus = exists ? 'published' : 'unshared';
                                        await this.stateManager.updateStatus(file.path, newStatus);
                                        new Notice(`Status: ${newStatus.toUpperCase()}`);
                                    } catch (e) {
                                        console.error(e);
                                        new Notice("Check failed. See console.");
                                    }
                                });
                        });

                        // 3. Copy GitHub Link
                        menu.addItem((item) => {
                            item
                                .setTitle("Copy GitHub Link")
                                .setIcon("link")
                                .onClick(async () => {
                                    const { owner, repo, branch } = this.settings;
                                    const remotePath = `${uuid}/note.md`;
                                    const url = `https://github.com/${owner}/${repo}/blob/${branch}/${remotePath}`;
                                    await navigator.clipboard.writeText(url);
                                    new Notice("Link copied to clipboard");
                                });
                        });

                        // 4. Remove Share (Only if status is not 'unshared')
                        // Note: isPublished already checks (status !== 'unshared'), so this block is safe.
                        menu.addItem((item) => {
                            item
                                .setTitle("Remove Share from GitHub")
                                .setIcon("trash")
                                .onClick(async () => {
                                    if (!confirm(`Are you sure you want to unshare "${file.basename}"?`)) return;

                                    new Notice(`Deleting remote files...`);
                                    const success = await this.githubService.deletePath(uuid);
                                    if (success) {
                                        new Notice("Unshare complete.");
                                        await this.stateManager.updateStatus(file.path, 'unshared');

                                        // Refresh View
                                        await this.refreshManagementView();
                                    } else {
                                        new Notice("Unshare failed.");
                                    }
                                });
                        });
                    }
                }
            })
        );
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(MANAGEMENT_VIEW_TYPE);

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            leaf = leaves[0];
        } else {
            // Our view could not be found in the workspace, create a new leaf
            // in the right sidebar for it
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                await rightLeaf.setViewState({ type: MANAGEMENT_VIEW_TYPE, active: true });
                leaf = rightLeaf;
            }
        }

        // "Reveal" the leaf in case it is in a collapsed sidebar
        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    /**
     * Main publishing logic for a specific file
     */
    async publishNote(file: TFile) {
        if (!this.checkRequirements()) return;

        new Notice(`ObsiGithub: Publishing ${file.basename}...`);

        try {
            // 1. Get or Generate UUID with Remote Collision Check
            const uuid = await this.stateManager.getOrCreateUUID(
                file.path,
                async (id) => await this.githubService.checkPathExists(id)
            );

            // 2. Read content
            const content = await this.app.vault.read(file);

            // 3. Process content (inject title, rewrite links)
            const { content: processedContent, assets } = await this.markdownProcessor.process(
                content,
                file,
                this.settings.assetsFolderName
            );

            // 4. Upload Note
            // Structure: {UUID}/note.md
            const remotePath = `${uuid}/note.md`;

            const noteSuccess = await this.githubService.uploadFile(
                remotePath,
                processedContent,
                `Update note: ${file.basename}`
            );

            // 5. Upload Assets
            if (noteSuccess && assets.length > 0) {
                new Notice(`ObsiGithub: Uploading ${assets.length} assets...`);

                let uploadedCount = 0;
                for (const asset of assets) {
                    try {
                        const assetData = await this.app.vault.readBinary(asset);
                        const assetPath = `${uuid}/${this.settings.assetsFolderName}/${asset.name}`;

                        await this.githubService.uploadFile(
                            assetPath,
                            assetData,
                            `Upload asset: ${asset.name}`
                        );
                        uploadedCount++;
                    } catch (error) {
                        console.error(`Failed to upload asset ${asset.name}`, error);
                        new Notice(`Failed to upload: ${asset.name}`);
                    }
                }
                new Notice(`ObsiGithub: Published note with ${uploadedCount}/${assets.length} assets.`);
            } else if (noteSuccess) {
                new Notice(`ObsiGithub: Successfully published to ${uuid}`);
            } else {
                new Notice("ObsiGithub: Upload failed. Check console for details.");
            }

            // 6. Copy to Clipboard (UX Improvement)
            if (noteSuccess) {
                const { owner, repo, branch } = this.settings;
                const url = `https://github.com/${owner}/${repo}/blob/${branch}/${remotePath}`;

                try {
                    await navigator.clipboard.writeText(url);
                    new Notice("GitHub URL copied to clipboard!");
                } catch (err) {
                    new Notice("Published, but failed to copy URL.");
                    console.error("Clipboard error:", err);
                }

                // Refresh View
                await this.refreshManagementView();
            }

        } catch (e: any) {
            console.error(e);
            new Notice(`ObsiGithub: Error ${e.message}`);
        }
    }

    /**
     * Helper to refresh all active Management Views
     */
    async refreshManagementView() {
        const leaves = this.app.workspace.getLeavesOfType(MANAGEMENT_VIEW_TYPE);
        for (const leaf of leaves) {
            // @ts-ignore
            const view = leaf.view as ManagementView;
            if (view && view.drawList) {
                const listContainer = view.containerEl.querySelector(".obsigithub-list-container") as HTMLElement;
                if (listContainer) {
                    await view.drawList(listContainer, false);
                } else {
                    await view.draw();
                }
            }
        }
    }

    // Wrapper for command
    async publishCurrentNote() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice("ObsiGithub: No active file.");
            return;
        }
        await this.publishNote(activeFile);
    }

    checkRequirements(): boolean {
        // @ts-ignore
        const useMarkdownLinks = this.app.vault.getConfig("useMarkdownLinks");
        // @ts-ignore
        const newLinkFormat = this.app.vault.getConfig("newLinkFormat");

        if (!useMarkdownLinks) {
            new Notice("ObsiGithub: Please turn OFF 'Use WikiLinks' in settings.");
            return false;
        }

        // newLinkFormat: 'relative', 'absolute', 'shortest'
        if (newLinkFormat !== "relative") {
            new Notice("ObsiGithub: 'New link format' must be 'Relative path to file'.");
            return false;
        }
        return true;
    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        if (this.githubService) {
            this.githubService.updateSettings(this.settings);
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
        if (this.githubService) {
            this.githubService.updateSettings(this.settings);
        }
    }
}
