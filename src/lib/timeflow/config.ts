/**
 * TimeFlow 全局配置
 */

export const config = {
    /**
     * 工作时段最短时长（毫秒）
     * 如果时段时长小于此值，暂停时会被自动丢弃（防误触）
     */
    MIN_SESSION_DURATION_MS: 10 * 1000, // 10秒
};
