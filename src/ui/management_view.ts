import { ItemView, WorkspaceLeaf, Notice, setIcon, Setting, ButtonComponent } from "obsidian";
import type ObsiGithubPlugin from "../main";

export const MANAGEMENT_VIEW_TYPE = "obsigithub-management-view";

export class ManagementView extends ItemView {
    plugin: ObsiGithubPlugin;
    lastCheckTime: number = 0;
    CHECK_COOLDOWN = 30000; // 30 seconds

    constructor(leaf: WorkspaceLeaf, plugin: ObsiGithubPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return MANAGEMENT_VIEW_TYPE;
    }

    getDisplayText() {
        return "ObsiGithub Management";
    }

    getIcon() {
        return "github";
    }

    async onOpen() {
        await this.draw();
    }

    /**
     * Draw the management interface.
     * Separates the Toolbar and the List to allow independent updates.
     */
    async draw() {
        // Container cleanup
        const contentEl = this.containerEl.children[1] as HTMLElement;
        contentEl.empty();
        contentEl.createEl("h2", { text: "Published Notes" });

        // 1. Check ToolBar
        const toolbarDiv = contentEl.createDiv({ cls: "obsigithub-toolbar" });
        toolbarDiv.style.marginBottom = "10px";

        new Setting(toolbarDiv)
            .setName("Status Check")
            .setDesc("Verify remote existence (Cooldown: 30s)")
            .addButton(btn => {
                btn.setButtonText("Check Now")
                    .setCta()
                    .onClick(async () => {
                        await this.handleCheck(btn);
                    });
            });

        // 2. List Container
        const listDiv = contentEl.createDiv({ cls: "obsigithub-list-container" });
        await this.drawList(listDiv);
    }

    /**
     * Handle Check logic with Debounce/Cooldown
     */
    async handleCheck(btn: ButtonComponent) {
        const now = Date.now();
        if (now - this.lastCheckTime < this.CHECK_COOLDOWN) {
            const remaining = Math.ceil((this.CHECK_COOLDOWN - (now - this.lastCheckTime)) / 1000);
            new Notice(`Please wait ${remaining}s before checking again.`);
            return;
        }

        this.lastCheckTime = now;
        btn.setButtonText("Checking...");
        btn.setDisabled(true);

        try {
            const listDiv = this.containerEl.querySelector(".obsigithub-list-container");
            if (listDiv) {
                await this.drawList(listDiv as HTMLElement, true);
            }
            new Notice("Status check complete.");
        } finally {
            btn.setButtonText("Check Now");
            btn.setDisabled(false);
        }
    }

    /**
     * Draw the list of files
     * @param container The container for the list (not the main contentEl)
     * @param doCheck Whether to perform a LIVE remote check
     */
    async drawList(container: HTMLElement, doCheck: boolean = false) {
        container.empty();
        const fileMap = this.plugin.settings.fileMap;
        const entries = Object.entries(fileMap);

        if (entries.length === 0) {
            container.createEl("p", { text: "No published notes found." });
            return;
        }

        const table = container.createEl("table", { cls: "obsigithub-table" });
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";

        const header = table.createEl("thead");
        const headerRow = header.createEl("tr");
        headerRow.createEl("th", { text: "File" }).style.textAlign = "left";
        headerRow.createEl("th", { text: "UUID" }).style.textAlign = "left"; // [NEW] UUID Column
        headerRow.createEl("th", { text: "Status" }).style.textAlign = "center";
        headerRow.createEl("th", { text: "Actions" }).style.textAlign = "right";

        const body = table.createEl("tbody");

        for (const [path, uuid] of entries) {
            const row = body.createEl("tr");

            // --- 1. File Name Column ---
            const fileCell = row.createEl("td");
            // Try to find the file instance to link it or just show path
            const file = this.plugin.app.vault.getAbstractFileByPath(path);
            if (file) {
                const link = fileCell.createEl("a", { text: file.name });
                link.onclick = () => {
                    this.plugin.app.workspace.getLeaf(false).openFile(file as any);
                };
            } else {
                fileCell.createEl("span", { text: path, cls: "nav-file-title-content is-missing" });
            }

            // --- 1.5. UUID Column [NEW] ---
            const uuidCell = row.createEl("td");
            uuidCell.createEl("code", { text: uuid });
            uuidCell.style.fontSize = "0.8em";

            // --- 2. Status Column ---
            const statusCell = row.createEl("td");
            statusCell.style.textAlign = "center";

            // Determine Status
            let status = this.plugin.stateManager.getStatus(path);

            if (doCheck) {
                // LIVE CHECK
                try {
                    const exists = await this.plugin.githubService.checkPathExists(uuid);
                    status = exists ? 'published' : 'unshared';
                    // Update persistence
                    await this.plugin.stateManager.updateStatus(path, status);
                } catch (e) {
                    console.error("Check Error", e);
                    // On error, keep old status or unknown
                }
            }

            // Render Icon
            let statusIcon = "help-circle";
            let statusColor = "var(--text-muted)";
            let statusTitle = "Unknown";

            if (status === 'published') {
                statusIcon = "check-circle";
                statusColor = "var(--text-success)";
                statusTitle = "Published";
            } else if (status === 'unshared') {
                statusIcon = "alert-triangle";
                statusColor = "var(--text-error)";
                statusTitle = "Unshared / Remote Missing";
            }

            const iconSpan = statusCell.createSpan();
            setIcon(iconSpan, statusIcon);
            iconSpan.style.color = statusColor;
            iconSpan.title = statusTitle;

            // --- 3. Actions Column ---
            const actionCell = row.createEl("td");
            actionCell.style.textAlign = "right";
            actionCell.style.display = "flex";
            actionCell.style.justifyContent = "flex-end";
            actionCell.style.gap = "5px";

            // [Helpers] Generate URL
            const { owner, repo, branch } = this.plugin.settings;
            const remoteUrl = `https://github.com/${owner}/${repo}/blob/${branch}/${uuid}/note.md`;

            // [Copy Link] Button
            const copyBtn = actionCell.createEl("button");
            setIcon(copyBtn, "link");
            copyBtn.title = "Copy GitHub Link";
            copyBtn.onclick = async () => {
                await navigator.clipboard.writeText(remoteUrl);
                new Notice("Link copied to clipboard");
            };

            // [Open Link] Button
            const openBtn = actionCell.createEl("button");
            setIcon(openBtn, "external-link");
            openBtn.title = "Open on GitHub";
            openBtn.onclick = () => {
                window.open(remoteUrl, "_blank");
            };

            // Disable copy/open if unshared or settings missing
            if (status === 'unshared' || !owner || !repo) {
                copyBtn.setAttr('disabled', 'true');
                copyBtn.style.opacity = "0.5";
                openBtn.setAttr('disabled', 'true');
                openBtn.style.opacity = "0.5";
            }

            // [Unshare] Button
            // Enabled ONLY if status is NOT 'unshared' (meaning we think it's published or unknown)
            const canUnshare = status !== 'unshared';

            const unshareBtn = actionCell.createEl("button");
            setIcon(unshareBtn, "trash-2"); // Change to icon for space
            unshareBtn.title = "Unshare (Remote Delete)";
            if (!canUnshare) {
                unshareBtn.setAttr('disabled', 'true');
                unshareBtn.style.opacity = "0.5";
                unshareBtn.title = "Already unshared";
            }

            unshareBtn.onclick = async () => {
                if (!confirm(`Are you sure you want to unshare "${path}"?\nThis will DELETE the remote folder.`)) return;

                new Notice(`Deleting remote files for ${path}...`);
                const success = await this.plugin.githubService.deletePath(uuid);
                if (success) {
                    new Notice("Unshare complete.");
                    // Update Status to unshared
                    await this.plugin.stateManager.updateStatus(path, 'unshared');
                    // Refresh ONLY list
                    await this.drawList(container, false);
                } else {
                    new Notice("Unshare failed. See console.");
                }
            };

            // [Forget] Button
            const forgetBtn = actionCell.createEl("button");
            setIcon(forgetBtn, "x-circle"); // Change to icon
            forgetBtn.title = "Forget (Local)";
            forgetBtn.onclick = async () => {
                // Warn if trying to forget a PUBLISHED file (might leave orphan remote files)
                const orphanWarning = (status === 'published') ? "\nWARNING: Remote files still exist! This only removes the LOCAL record." : "";

                if (!confirm(`Forget "${path}"?${orphanWarning}`)) return;

                await this.plugin.stateManager.removeUUID(path);
                new Notice("Record removed.");
                // Refresh list (item will disappear)
                await this.drawList(container, false);
            };

            // Layout tweak
            // unshareBtn.style.padding = "2px 5px";
            // forgetBtn.style.padding = "2px 5px";
        }
    }

    async onClose() {
        // cleanup
    }
}
