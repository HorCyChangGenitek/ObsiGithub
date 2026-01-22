# Change: Initialize Core System

## Why
建立 ObsiGithub 外掛的核心架構，實現從 Obsidian 到 GitHub 的容器化發佈流程。
此變更將建立基礎設定、GitHub API 連接、筆記處理邏輯以及狀態管理機制。

## What Changes
- **核心功能**:
    - 實作 Obsidian 設定偵測 (Wikilinks/Relative Path)。
    - 實作 GitHub API 客戶端 (Octokit) 與 Token 驗證。
    - 實作「容器化」發佈邏輯 (UUID 生成、目錄結構建立)。
    - 實作 Markdown 處理 (標題注入、連結轉換)。
    - 實作 `data.json` 狀態管理。
- **UI**:
    - 新增設定頁面 (GitHub Token, Repo, Branch 設定)。

## Impact
- **Affected Specs**: `publishing`, `state`, `settings`
- **Dependencies**: 需要安裝 `@octokit/rest` (或其他 GitHub SDK)。
