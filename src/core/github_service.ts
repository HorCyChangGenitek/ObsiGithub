import { Octokit } from "@octokit/rest";
import { ObsiGithubSettings } from "../settings";
import { Notice } from "obsidian";
import { Buffer } from "buffer";

export class GitHubService {
    octokit: Octokit | null = null;
    settings: ObsiGithubSettings;

    constructor(settings: ObsiGithubSettings) {
        this.updateSettings(settings);
    }

    updateSettings(settings: ObsiGithubSettings) {
        this.settings = settings;
        if (settings.githubToken) {
            this.octokit = new Octokit({
                auth: settings.githubToken
            });
        }
    }

    /**
     * Upload a file to GitHub.
     * @param path The remote path in the repository (e.g., "uuid/note.md").
     * @param content The content of the file (string for text, ArrayBuffer for binary).
     * @param message Commit message.
     */
    async uploadFile(path: string, content: string | ArrayBuffer, message: string = "Update via ObsiGithub"): Promise<boolean> {
        if (!this.octokit) {
            new Notice("ObsiGithub: No Token provided.");
            return false;
        }

        const { owner, repo, branch } = this.settings;

        if (!owner || !repo) {
            new Notice("ObsiGithub: Owner or Repo not configured.");
            return false;
        }

        try {
            // Check if file exists to get sha
            let sha: string | undefined;
            try {
                // @ts-ignore
                const { data } = await this.octokit.repos.getContent({
                    owner,
                    repo,
                    path,
                    ref: branch,
                });

                if (data && !Array.isArray(data) && 'sha' in data) {
                    sha = data.sha;
                }
            } catch (e) {
                // File likely doesn't exist, which is fine
                console.log(`File ${path} not found, creating new.`);
            }

            const contentEncoded = this.toBase64(content);

            await this.octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path,
                message,
                content: contentEncoded,
                sha,
                branch
            });

            return true;
        } catch (e: any) {
            console.error("GitHub Upload Error:", e);
            new Notice(`GitHub Upload Error: ${e.message}`);
            return false;
        }
    }

    toBase64(data: string | ArrayBuffer): string {
        if (typeof data === 'string') {
            return Buffer.from(data).toString('base64');
        } else {
            return Buffer.from(data).toString('base64');
        }
    }

    /**
     * Check if a path (file or folder) exists in the repository.
     */
    async checkPathExists(path: string): Promise<boolean> {
        if (!this.octokit) return false;
        const { owner, repo, branch } = this.settings;

        try {
            await this.octokit.repos.getContent({
                owner,
                repo,
                path,
                ref: branch,
            });
            return true;
        } catch (e: any) {
            if (e.status === 404) {
                return false;
            }
            throw e;
        }
    }
    /**
     * Delete a path (file or folder) from the repository.
     * Note: GitHub API does not support deleting non-empty folders directly.
     * We must list contents and delete them recursively.
     */
    async deletePath(path: string, message: string = "Delete via ObsiGithub"): Promise<boolean> {
        if (!this.octokit) return false;
        const { owner, repo, branch } = this.settings;

        try {
            // 1. Get stats to check if file or directory
            // @ts-ignore
            const { data } = await this.octokit.repos.getContent({
                owner, repo, path, ref: branch
            });

            if (Array.isArray(data)) {
                // It's a directory, delete contents recursively
                for (const item of data) {
                    await this.deletePath(item.path, message);
                }
                return true;
            } else {
                // It's a file, delete it
                await this.octokit.repos.deleteFile({
                    owner,
                    repo,
                    path: data.path, // Use full path from data
                    message,
                    sha: data.sha,
                    branch
                });
                return true;
            }

        } catch (e: any) {
            if (e.status === 404) {
                // Already gone, consider success
                return true;
            }
            console.error(`GitHub Delete Error for ${path}:`, e);
            new Notice(`Failed to delete ${path}: ${e.message}`);
            return false;
        }
    }
}
