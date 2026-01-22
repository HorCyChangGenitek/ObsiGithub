import { App, PluginSettingTab, Setting } from 'obsidian';
import type ObsiGithubPlugin from './main';

export interface ObsiGithubSettings {
    // Configuration
    githubToken: string;
    owner: string;
    repo: string;
    branch: string;
    assetsFolderName: string;

    // State Management (Local Path -> UUID)
    fileMap: Record<string, string>;

    // Status Persistence (Local Path -> Status)
    fileStatus: Record<string, 'published' | 'unshared' | 'unknown'>;
}

export const DEFAULT_SETTINGS: ObsiGithubSettings = {
    githubToken: '',
    owner: '',
    repo: '',
    branch: 'main',
    assetsFolderName: 'assets',
    fileMap: {},
    fileStatus: {}
}

export class ObsiGithubSettingTab extends PluginSettingTab {
    plugin: ObsiGithubPlugin;

    constructor(app: App, plugin: ObsiGithubPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'ObsiGithub Settings' });

        new Setting(containerEl)
            .setName('GitHub Token')
            .setDesc('Personal Access Token (requires repo scope)')
            .addText(text => text
                .setPlaceholder('ghp_...')
                .setValue(this.plugin.settings.githubToken)
                .onChange(async (value) => {
                    this.plugin.settings.githubToken = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Repository Owner')
            .setDesc('GitHub Username or Organization')
            .addText(text => text
                .setPlaceholder('username')
                .setValue(this.plugin.settings.owner)
                .onChange(async (value) => {
                    this.plugin.settings.owner = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Repository Name')
            .setDesc('Name of the repository')
            .addText(text => text
                .setPlaceholder('my-notes')
                .setValue(this.plugin.settings.repo)
                .onChange(async (value) => {
                    this.plugin.settings.repo = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Branch')
            .setDesc('Branch to publish to (e.g., main or master)')
            .addText(text => text
                .setPlaceholder('main')
                .setValue(this.plugin.settings.branch)
                .onChange(async (value) => {
                    this.plugin.settings.branch = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Assets Folder Name')
            .setDesc('Name of the folder inside the container to store attachments')
            .addText(text => text
                .setPlaceholder('assets')
                .setValue(this.plugin.settings.assetsFolderName)
                .onChange(async (value) => {
                    this.plugin.settings.assetsFolderName = value;
                    await this.plugin.saveSettings();
                }));
    }
}
