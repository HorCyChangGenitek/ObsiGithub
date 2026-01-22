# Project Context

## Purpose
開發一個 Obsidian 插件 (ObsiGithub)，將本地筆記及其關聯附件以「容器化資料夾」形式發佈至使用者的 GitHub Repository。
目標是實現零成本、具隱私性（亂數路徑）且易於維護的網頁發佈流程。

## Tech Stack
- **Core**: TypeScript, Obsidian API
- **UI**: React (Obsidian Settings Tab)
- **Network**: GitHub REST API (via Octokit)
- **Data**: JSON (local state management)

## Project Conventions

### Architecture Patterns
- **Containerized Structure**: 
    - Root: `/`
    - Container: `/{UUID}/`
    - Note: `/{UUID}/note.md`
    - Assets: `/{UUID}/[Assets_Folder]/`
- **Non-intrusive State**: 
    - 使用 `data.json` 維護 `Local Path` <-> `GitHub UUID` 對應，不修改原始 Markdown 檔案。
- **Environment Strictness**:
    - Requires `Wikilinks` = OFF
    - Requires `New link format` = Relative path

### Naming Conventions
- **UUID**: 用於 GitHub 資料夾名稱，確保隱私與唯一性。
- **Assets Folder**: 依照使用者本地設定（如 `attachments` 或 `files`）。

## Important Constraints
- **Privacy**: 路徑必須隨機化，不可暴露本地檔案結構。
- **Validity**: 發佈後必須確保所有相對路徑連結在 GitHub 上可直接點擊瀏覽。
- **Rate Limiting**: 清理機制需考量 GitHub API 限制。

## Reference Projects
- **Upload Logic**: `obsidian-image-upload-toolkit` (Base64, API handling)
- **State Management**: `obsius-obsidian-plugin` (data.json architecture)