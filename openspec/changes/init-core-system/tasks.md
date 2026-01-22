## 1. 環境與設定 (Environment & Setup)
- [x] 1.1 建立 Obsidian 外掛專案結構 (Scaffold project: main.ts, manifest.json, package.json)。
- [x] 1.2 設定 `esbuild` 與開發環境。
- [x] 1.3 實作設定頁面 (Token, Owner, Repo, Branch, Assets Folder Name)。

## 2. 核心邏輯 - 狀態管理 (Core Logic - State Management)
- [x] 2.1 定義 `PluginData` 介面 (映射: LocalPath -> UUID)。
- [x] 2.2 實作 `loadData` 與 `saveData` 包裝器。

## 3. 核心邏輯 - 發佈流程 (Core Logic - Publishing)
- [x] 3.1 實作「前置檢查 (Pre-flight Check)」: 驗證 `Wikilinks` 為 OFF 且 `Link Format` 為 Relative。
- [x] 3.2 實作 `UUID` 生成服務 (含 NanoID 與碰撞檢測)。
- [x] 3.3 實作 `MarkdownProcessor`:
    - 注入 H1 標題 (使用檔名)。 [x]
    - 提取附件連結。 [x]
    - 轉換附件路徑為 GitHub 結構。 [x]
- [x] 3.4 實作 `GitHubClient`:
    - 檔案上傳方法 (Base64 用於圖片, Text 用於 md)。
    - 目錄檢查方法 (碰撞檢測用)。

## 4. 互動設計 (基礎) (Interaction - Basic)
- [x] 4.1 新增 Ribbon Icon 與指令: "Publish Current Note"。
- [x] 4.2 實作進度通知 (Obsidian Notice)。

## 5. 附件處理 (Phase 3: Asset Handling)
- [x] 5.1 實作圖片連結提取 (MarkdownProcessor)。
- [x] 5.2 實作路徑重寫邏輯 (MarkdownProcessor)。
- [x] 5.3 實作附件上傳邏輯 (Main)。

## 6. 使用者體驗優化 (Phase 4: UX Improvements)
- [x] 6.1 上傳成功後自動複製 GitHub 網址到剪貼簿。
- [x] 6.2 新增「右鍵選單 (Context Menu)」: "Publish to GitHub"。

## 7. 管理介面 (Phase 5: Management View)
- [x] 7.1 擴充核心服務:
  - 實作 `GitHubService.deletePath` (刪除 GitHub 對應資料夾)。
  - 實作 `StateManager.removeUUID` (移除本地映射)。
- [x] Create Management View UI (List, Status, Actions) <!-- id: 10 -->
- [x] Implement "Check Status" with 30s cooldown & persistence <!-- id: 11 -->
- [x] Implement "Unshare" (Remote delete) & "Forget" (Local delete) <!-- id: 12 -->
- [x] Integrate with Ribbon & Context Menu <!-- id: 13 -->
- [x] **Context Menu Enhancements**: <!-- id: 14 -->
    - [x] Dynamic "Update Share" text (Excludes unshared items)
    - [x] Single file "Check Status"
    - [x] "Copy Link" option
- [x] **Management View Enhancements**: <!-- id: 15 -->
    - [x] Show UUID Column
    - [x] "Open Link" & "Copy Link" Buttons
- [x] **Bug Fixes**:
    - [x] Context Menu visibility for unshared items.
    - [x] GitHub Delete error logging.
    - [x] UI State Sync (Refresh view after Publish/Unshare).
