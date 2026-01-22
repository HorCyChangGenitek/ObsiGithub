import type ObsiGithubPlugin from '../main';

export class StateManager {
    plugin: ObsiGithubPlugin;

    constructor(plugin: ObsiGithubPlugin) {
        this.plugin = plugin;
    }

    /**
     * Get the UUID for a given local file path.
     * If no UUID exists, one will NOT be created here (separation of concerns).
     */
    getUUID(localPath: string): string | undefined {
        return this.plugin.settings.fileMap[localPath];
    }

    /**
     * Set a UUID for a local file path and save settings.
     * Also sets initial status to 'published'.
     */
    async setUUID(localPath: string, uuid: string): Promise<void> {
        this.plugin.settings.fileMap[localPath] = uuid;
        this.plugin.settings.fileStatus[localPath] = 'published';
        await this.plugin.saveSettings();
    }

    async updateStatus(localPath: string, status: 'published' | 'unshared' | 'unknown'): Promise<void> {
        this.plugin.settings.fileStatus[localPath] = status;
        await this.plugin.saveSettings();
    }

    getStatus(localPath: string): 'published' | 'unshared' | 'unknown' {
        const s = this.plugin.settings.fileStatus[localPath];
        return s ? s : 'unknown';
    }

    /**
     * Generate a new NanoID (10 chars, a-z A-Z 0-9).
     * 10 chars = ~8.39e17 combinations.
     */
    generateUUID(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const array = new Uint8Array(10);
        crypto.getRandomValues(array);
        let id = '';
        for (let i = 0; i < 10; i++) {
            id += chars[array[i] % chars.length];
        }
        return id;
    }

    /**
     * Get or create a UUID for a local file path.
     * Includes collision detection (Local + Optional Remote).
     * @param localPath Path of the local file
     * @param remoteCheck Callback to check remote existence (Collision Fallback)
     */
    async getOrCreateUUID(localPath: string, remoteCheck?: (id: string) => Promise<boolean>): Promise<string> {
        // 1. Return existing if present
        let uuid = this.getUUID(localPath);
        if (uuid) return uuid;

        // 2. Generate new with Retry logic
        let retries = 0;
        const MAX_RETRIES = 5;

        while (retries < MAX_RETRIES) {
            uuid = this.generateUUID();

            // 2a. Local Collision Check (Fast)
            const allUUIDs = Object.values(this.plugin.settings.fileMap);
            if (allUUIDs.includes(uuid)) {
                console.log(`ObsiGithub: Local collision for ${uuid}, retrying...`);
                retries++;
                continue;
            }

            // 2b. Remote Collision Check (Slow, Backup Plan)
            if (remoteCheck) {
                console.log(`ObsiGithub: Verifying remote availability for ${uuid}...`);
                const remoteExists = await remoteCheck(uuid);
                if (remoteExists) {
                    console.log(`ObsiGithub: Remote collision for ${uuid}, retrying...`);
                    retries++;
                    continue;
                }
            }

            // If we're here, ID is safe
            await this.setUUID(localPath, uuid);
            return uuid;
        }

        throw new Error('ObsiGithub: Failed to generate unique ID after max retries.');
    }

    /**
     * Remove the UUID mapping for a given local file path.
     * Used when "Forget" or "Unshare" is called.
     */
    async removeUUID(localPath: string): Promise<void> {
        if (this.plugin.settings.fileMap[localPath]) {
            delete this.plugin.settings.fileMap[localPath];
            await this.plugin.saveSettings();
        }
    }
}
