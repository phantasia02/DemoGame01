# 小地圖 & 敵人密度設定 教學文件

## 功能概述

本次更新新增了兩個功能：
1. **戰鬥小地圖** - 在戰鬥畫面左上角顯示地圖全覽，可看到所有敵人位置
2. **敵人密度設定檔** - 可調整地圖上敵人的數量多寡

---

## 功能 1：戰鬥小地圖

### 說明
進入戰鬥後，畫面左上角會顯示一個 150x100px 的半透明小地圖。

### 顏色標示
| 顏色 | 含義 |
|------|------|
| 藍色圓點 | 玩家位置 |
| 紅色圓點 | 存活的地圖敵人 |
| 黃色閃爍圓點 | ATB 即將充滿的敵人（增援威脅） |
| 灰色圓點 | 已在戰鬥中 / 已死亡的敵人 |

### 技術實現
- 檔案：`js/ui/MiniMap.js`
- 在 `BattleScene` 中實例化並在每幀 `update()` 和 `render()` 中呼叫
- 數據來源：`BattleManager.mapScene.enemies[]` 和 `BattleManager.playerTileX/Y`
- 地圖磁磚使用 `MapData.js` 中的 `MAP_TILES` 和 `TILE_COLORS` 繪製縮小版

---

## 功能 2：敵人密度設定

### 使用方式

#### 方法 1：修改設定檔
編輯 `js/data/GameConfig.js`：
```javascript
export const GameConfig = {
    enemyDensity: 1.0,  // 改為你想要的數值
};
```

#### 方法 2：瀏覽器控制台即時調整
開啟瀏覽器開發者工具（F12），在 Console 中輸入：
```javascript
GameConfig.enemyDensity = 1.5;  // 設定密度
```
然後按 **R 鍵** 重置遊戲使設定生效。

### 密度數值說明
| 數值 | 效果 |
|------|------|
| 0.5 | 少（約一半敵人） |
| 1.0 | 正常（預設值） |
| 1.5 | 多 |
| 2.0 | 非常多 |

### 密度控制邏輯
- **密度 < 1**：從預設的 `ENEMY_SPAWNS` 中隨機跳過部分敵人（機率 = 1 - density）
- **密度 = 1**：使用所有預設生成點，與原版行為一致
- **密度 > 1**：保留所有預設敵人，並在可行走空地上隨機生成額外敵人
  - 額外敵人數量 = `ENEMY_SPAWNS.length * (density - 1)`
  - 不會生成在玩家起點附近 3 格內
  - 敵人類型隨機（哥布林 / 骷髏兵 / 史萊姆）

### 技術實現
- 設定檔：`js/data/GameConfig.js`
- 生成邏輯：`js/map/MapScene.js` 的 `_spawnEnemies()` 方法
- `main.js` 中將 `GameConfig` 暴露到 `window` 供控制台使用

---

## 修改的檔案清單

| 檔案 | 變更類型 | 說明 |
|------|---------|------|
| `js/data/GameConfig.js` | 新建 | 遊戲設定檔 |
| `js/ui/MiniMap.js` | 新建 | 小地圖 UI 組件 |
| `js/map/MapScene.js` | 修改 | 敵人生成邏輯加入密度控制 |
| `js/battle/BattleScene.js` | 修改 | 整合小地圖到戰鬥場景 |
| `js/main.js` | 修改 | 引入 GameConfig 並暴露到 window |

---

## 驗證步驟

1. 開啟遊戲，走向敵人觸發戰鬥 → 左上角應出現小地圖
2. 小地圖上應可見藍色（玩家）、紅色（敵人）圓點
3. 戰鬥持續時，觀察小地圖 → ATB 快滿的敵人會以黃色閃爍
4. 按 F12 開啟控制台，輸入 `GameConfig.enemyDensity = 2.0`
5. 按 R 鍵重置遊戲 → 地圖上應出現更多敵人
6. 再設定 `GameConfig.enemyDensity = 0.5` 並按 R → 敵人應減少
