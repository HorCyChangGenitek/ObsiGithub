# ObsiGithub

**ObsiGithub** is a powerful Obsidian plugin designed to publish your local notes and attachments to a GitHub Repository with a "containerized structure". Its core design focuses on **privacy protection** and **link integrity**, allowing you to easily build a web-viewable version of your personal knowledge Share-Base.

**ObsiGithub** 是一個強大的 Obsidian 插件，旨在將您的本地筆記與附件以「容器化結構」發佈至 GitHub Repository。它的設計核心是**隱私保護**與**連結完整性**，讓您輕鬆打造個人知識庫的分享版本。

## ✨ Key Features (主要功能)

*   **Containerized Publishing (容器化發布)**
    *   Generates a unique **NanoID** (e.g., `V1StGXR8a2`) for each published note as a remote directory. This ensures URL privacy and prevents exposing your local file structure.
    *   每篇筆記上傳時會自動生成一個唯一的 **NanoID** (如 `V1StGXR8a2`) 作為遠端目錄，確保 URL 隱私且不暴露您本地的檔案結構。

*   **Asset Handling (附件自動處理)**
    *   Automatically detects images and attachments within the note, uploads them to the corresponding container directory, and rewrites path in Markdown to ensure perfect display on GitHub. Supports converting WikiLinks `[[...]]` to standard Markdown links.
    *   自動偵測筆記內的圖片與附件，將其上傳至對應的容器目錄，並自動改寫 Markdown 內的路徑，確保在 GitHub 上能完美顯示。支援 WikiLinks `[[...]]` 自動轉換為標準 Markdown 連結。

*   **Status Tracking (雙向狀態同步)**
    *   **Persistence**: Locally tracks "Published" / "Unshared" status to reduce redundant API calls.
    *   **Management View**: A dedicated panel to list all published notes, view UUIDs/status, and quickly copy links, open in browser, or unshare.
    *   **持久化狀態**：本地記錄發佈狀態 (Published / Unshared)，減少重複 API 請求。
    *   **管理介面 (Management View)**：提供專屬面板，一覽所有已發佈的筆記 UUID、狀態，並支援快速複製連結、開啟網頁或移除分享。

*   **Context Menu Integration (右鍵選單整合)**
    *   Right-click on files to directly **Publish**, **Update**, or **Unshare**.
    *   Includes **Check Remote Status** and **Copy GitHub Link** actions.
    *   在檔案列表直接 **Publish (發佈)**、**Update (更新)** 或 **Unshare (移除)**。支援 **Check Remote Status** (檢查遠端狀態) 與 **Copy GitHub Link**。

## ⚙️ Installation (安裝方式)

### Method 1: Using BRAT (Recommended)
If you want automatic updates, we recommend using **BRAT (Beta Reviewers Auto-update Tool)**.
如果您希望獲得自動更新，建議使用 **BRAT (Beta Reviewers Auto-update Tool)**。

1. Search for and install **BRAT** in the Obsidian Community Plugins. (在 Obsidian 社群插件中安搜尋並裝 **BRAT**。)
2. Open BRAT settings and click `Add Beta plugin`. (開啟 BRAT 設定，點選 `Add Beta plugin`。)
3. Enter the GitHub URL of this repository: `https://github.com/YourUsername/ObsiGithub` (Replace with actual URL). (輸入本專案的 GitHub URL。)
4. Click "Add Plugin". (點選 "Add Plugin"。)

### Method 2: Manual Installation (手動安裝)
1. Download the latest `main.js`, `manifest.json`, and `styles.css` (if available) from the [Releases](https://github.com/YourUsername/ObsiGithub/releases) page.
2. Create a directory in your Obsidian vault: `.obsidian/plugins/obsigithub/`.
3. Place the downloaded files into this directory.
4. Restart Obsidian and enable the plugin.

1. 至 [Releases](https://github.com/YourUsername/ObsiGithub/releases) 頁面下載最新版本的 `main.js`, `manifest.json`, `styles.css` (若有)。
2. 在您的 Obsidian 保存庫中建立目錄：`.obsidian/plugins/obsigithub/`。
3. 將下載的檔案放入該目錄。
4. 重啟 Obsidian 並啟用插件。

## 🚀 Usage Guide (使用指南)

### 1. Prepare GitHub Repository (準備 GitHub Repository)
Create a **Public** or **Private** repository on GitHub (e.g., `obsidian-notes`). Obtain a **Personal Access Token (Classic)** with `repo` scope permissions.

首先，您需要在 GitHub 建立一個**公開 (Public)** 或 **私有 (Private)** 的 Repository (例如 `obsidian-notes`)。取得您的 **Personal Access Token (Classic)**，需勾選 `repo` 權限。

### 2. Plugin Settings (設定插件)
Go to **ObsiGithub** settings:
*   **GitHub Token**: Paste your Personal Access Token.
*   **Owner**: Your GitHub username (e.g., `HorCy`).
*   **Repository**: The repo name you created (e.g., `obsidian-notes`).
*   **Branch**: Usually `main` or `master`.

進入 **ObsiGithub** 設定頁面：
*   **GitHub Token**: 貼上您的 Personal Access Token。
*   **Owner**: 您的 GitHub 帳號名稱 (例如 `HorCy`).
*   **Repository**: 剛才建立的 Repo 名稱 (例如 `obsidian-notes`).
*   **Branch**: 通常為 `main` 或 `master`.

### 3. Publishing (開始發佈)
*   **Publish Single Note**: Right-click on a note -> `Publish to GitHub`.
*   **Manage**: Click the GitHub icon in the left ribbon to open the Management View, where you can check UUIDs or remove old shares.

*   **單檔發佈**：在筆記上按右鍵 -> `Publish to GitHub`。
*   **管理**：點選左側 Ribbon 的 GitHub 圖示，開啟管理面板，可查詢 UUID 或移除舊的分享。

## ⚠️ Notes (注意事項)
*   Please ensure local setting **"Use WikiLinks"** is **OFF**, and **"New link format"** is set to **"Relative path to file"** for best compatibility.
*   請確保本地設定 **"Use WikiLinks"** 為 **OFF**，且 **"New link format"** 設定為 **"Relative path to file"** 以獲得最佳相容性。

## Development (開發)

```bash
npm install
npm run dev
npm run build
```

## License
MIT
