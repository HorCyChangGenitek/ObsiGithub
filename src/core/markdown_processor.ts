import { TFile, App } from "obsidian";

export class MarkdownProcessor {
    app: App;

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Process the markdown content before publishing.
     * 1. Inject H1 Title
     * 2. Extract and rewrite image links
     */
    async process(content: string, file: TFile, assetsFolderName: string): Promise<{ content: string; assets: TFile[] }> {
        let processed = content;
        const assets: TFile[] = [];

        // 1. Inject H1 Title
        const titleLine = `# ${file.basename}\n\n`;
        processed = titleLine + processed;

        // 2. Extract and Rewrite Image Links
        // Regex for ![alt](url)
        const checkRegex = /!\[(.*?)\]\((.*?)\)/g;

        // We replace with callback to handle logic
        processed = processed.replace(checkRegex, (match, alt, url) => {
            // Decode URL (handle %20 etc)
            const decodedUrl = decodeURI(url);

            // Resolve the link
            // For relative paths, Obsidian's resolve logic:
            const target = this.app.metadataCache.getFirstLinkpathDest(decodedUrl, file.path);

            if (target && target instanceof TFile) {
                // It's a valid local file
                assets.push(target);

                // Rewrite the path to: assetsFolder/filename
                // Encode URI for the new path
                const newPath = `${assetsFolderName}/${encodeURI(target.name)}`;
                return `![${alt}](${newPath})`; // Corrected syntax here
            }

            // If not found or external link, leave it as is
            return match;
        });

        return { content: processed, assets };
    }

    // Future: replaceLinks for other file types if needed
}
