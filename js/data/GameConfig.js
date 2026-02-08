/**
 * 遊戲設定檔
 * 預設值定義於此，可被 config.json 覆蓋
 */
export const GameConfig = {
    /**
     * 敵人密度
     * 0.5 = 少（約一半敵人）
     * 1.0 = 正常（預設）
     * 1.5 = 多
     * 2.0 = 非常多
     */
    enemyDensity: 1.0,

    /**
     * 從 config.json 載入設定，覆蓋預設值
     * 失敗時保留預設值
     */
    async load() {
        try {
            const resp = await fetch('config.json?' + Date.now());
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            for (const key of Object.keys(data)) {
                if (key in GameConfig && key !== 'load') {
                    GameConfig[key] = data[key];
                }
            }
            console.log('GameConfig loaded from config.json:', data);
        } catch (e) {
            console.warn('Failed to load config.json, using defaults:', e.message);
        }
    },
};
