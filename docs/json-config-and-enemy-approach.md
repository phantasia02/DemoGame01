# 教學文件：JSON 設定檔 + 小地圖敵人移動增援

## 功能概述

本次更新包含兩個主要功能：

### 功能 1：外部 JSON 設定檔

敵人密度等遊戲參數現在可以透過修改 `config.json` 來調整，不需要修改 JavaScript 程式碼。

### 功能 2：小地圖敵人移動增援

戰鬥開始後，附近的敵人會在小地圖上**實際移動**到玩家位置，到達後才加入戰鬥（取代原本的 ATB 累積瞬間加入機制）。

---

## 功能 1 詳解：config.json

### 設定檔位置

專案根目錄下的 `config.json`：

```json
{
    "enemyDensity": 1.0
}
```

### 參數說明

| 參數 | 型別 | 預設值 | 說明 |
|------|------|--------|------|
| `enemyDensity` | number | 1.0 | 敵人密度。0.5=少, 1.0=正常, 1.5=多, 2.0=非常多 |

### 運作原理

1. `GameConfig.js` 中定義了 `load()` 非同步方法
2. `main.js` 在初始化遊戲前呼叫 `await GameConfig.load()`
3. `load()` 使用 `fetch()` 讀取 `config.json`，將值合併到 `GameConfig` 物件
4. 若讀取失敗（檔案不存在或格式錯誤），會保留程式碼中的預設值

### 如何使用

1. 修改 `config.json` 中的數值
2. 按 R 鍵重置遊戲（重置時會重新讀取 config.json）
3. 新的設定立即生效

### 關鍵程式碼

**GameConfig.js - load() 方法：**
```javascript
async load() {
    try {
        const resp = await fetch('config.json?' + Date.now()); // 加時間戳避免快取
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        for (const key of Object.keys(data)) {
            if (key in GameConfig && key !== 'load') {
                GameConfig[key] = data[key];
            }
        }
    } catch (e) {
        console.warn('Failed to load config.json, using defaults:', e.message);
    }
}
```

**main.js - async 初始化：**
```javascript
async function initGame() {
    await GameConfig.load(); // 先載入設定
    const game = new Game(canvas);
    // ...
}
```

---

## 功能 2 詳解：敵人移動增援

### 新機制說明

| 項目 | 舊機制 | 新機制 |
|------|--------|--------|
| 觸發條件 | ATB 條累積滿 | 敵人實際走到玩家位置 |
| 移動表現 | 無（瞬間出現） | 小地圖上可見橙色點移動 |
| 偵測範圍 | 無限制（所有敵人） | 曼哈頓距離 12 格以內 |
| 移動速度 | N/A | 每 500ms 移動一格 |

### 敵人狀態流程

```
[patrol/chase] → startApproaching() → [APPROACHING_BATTLE]
                                          ↓ (每500ms移一格)
                                       到達玩家位置
                                          ↓
                                    readyToJoinBattle = true
                                          ↓
                                    enterBattle() → [IN_BATTLE]
```

### 小地圖顏色說明

| 顏色 | 狀態 |
|------|------|
| 藍色 | 玩家位置 |
| 紅色 | 一般存活敵人（未接近） |
| 橙色 | 正在移動中的接近敵人 |
| 黃色閃爍 | 即將到達（距離 ≤ 2 格） |
| 灰色 | 已在戰鬥中 / 已死亡 |

### 關鍵程式碼

**MapEnemy.js - 新增方法：**

- `startApproaching()`: 切換到 `APPROACHING_BATTLE` 狀態
- `moveTowardBattle(dt, targetTileX, targetTileY, tileMap)`: 每 500ms 向目標移動一格
- `distanceTo(tx, ty)`: 計算曼哈頓距離

**BattleManager.js - 修改邏輯：**

- `_initApproachingEnemies()`: 戰鬥開始時，偵測 12 格內的敵人並啟動接近
- `_checkReinforcements(dt)`: 每幀呼叫敵人的 `moveTowardBattle()`，到達後觸發增援

**MapScene.js - getReadyReinforcements()：**

改為檢查 `readyToJoinBattle` 標記，而非舊的 `atbReady`。

---

## 修改的檔案列表

| 檔案 | 修改內容 |
|------|----------|
| `config.json` | **新建** - 外部 JSON 設定檔 |
| `js/data/GameConfig.js` | 新增 `load()` 非同步方法 |
| `js/main.js` | `initGame()` 改為 async，載入設定後才初始化 |
| `js/map/MapEnemy.js` | 新增 `APPROACHING_BATTLE` 狀態、`startApproaching()`、`moveTowardBattle()` |
| `js/battle/BattleManager.js` | `_checkReinforcements()` 改用移動邏輯、新增 `_initApproachingEnemies()` |
| `js/map/MapScene.js` | `getReadyReinforcements()` 改檢查 `readyToJoinBattle` |
| `js/ui/MiniMap.js` | 新增橙色（接近中）和黃色閃爍（即將到達）顯示 |

---

## 驗證步驟

1. **JSON 設定檔測試**：修改 `config.json` 中 `enemyDensity` 為 0.5 → 按 R 重置 → 敵人數量應減少
2. **敵人移動測試**：進入戰鬥 → 觀察小地圖，附近的紅色敵人應變為橙色並開始移動
3. **增援加入測試**：橙色敵人到達玩家位置 → 變灰色 + 觸發增援加入戰鬥
4. **範圍限制測試**：遠處敵人（>12 格）不會移動
