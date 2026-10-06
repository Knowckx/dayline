<!-- session_item.svelte - 单个工作时段行组件 -->
<script lang="ts">
    import type { WorkSession } from "../types/task";
    import { formatTime } from "../utils/time";

    interface Props {
        session: WorkSession;
        index: number;
        now: number; // 进行中时段的用时计算截止时间
        onDelete?: (sessionId: string) => void;
    }

    let { session, index, now, onDelete }: Props = $props();

    /** 格式化时段用时 */
    function formatSessionDuration(session: WorkSession, now: number): string {
        const endTime = session.endTime?.getTime() ?? now;
        const durationMs = endTime - session.startTime.getTime();
        const minutes = Math.floor(durationMs / (1000 * 60));
        if (minutes < 1) return "不到1分钟";
        if (minutes < 60) return `${minutes}分钟`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0
            ? `${hours}小时${remainingMinutes}分钟`
            : `${hours}小时`;
    }
</script>

<div class="session-item">
    <span class="session-label">时段 {index + 1}</span>
    <span class="session-time">
        {formatTime(session.startTime)}
        {#if session.endTime}
            → {formatTime(session.endTime)}
        {/if}
    </span>
    <span class="session-duration">{formatSessionDuration(session, now)}</span>
    {#if onDelete}
        <button
            class="session-delete"
            onclick={(e) => {
                e.stopPropagation();
                onDelete?.(session.id);
            }}
            aria-label="删除时段"
        >
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                />
            </svg>
        </button>
    {/if}
</div>

<style>
    .session-item {
        display: flex;
        align-items: center;
        gap: var(--tf-spacing-xs);
        font-size: 1rem;
        color: var(--tf-text);
        padding: 4px 0;
        transition: all var(--tf-transition-fast);
        border-radius: var(--tf-radius-sm);
    }

    .session-item:hover {
        background: var(--tf-bg-secondary);
    }

    .session-label {
        flex-shrink: 0;
        padding-left: var(--tf-spacing-xs);
        width: 60px; /* 统一对齐宽度 */
        text-align: left;
        font-size: 1rem;
        color: var(--tf-text-secondary);
    }

    .session-time {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        font-size: 1rem;
        color: var(--tf-text);
        background: rgba(0, 0, 0, 0.02);
        padding: 2px 6px;
        border-radius: var(--tf-radius-sm);
    }

    .session-duration {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        color: var(--tf-primary);
        font-weight: 600;
        font-size: 1rem;
        margin-left: 4px;
        background: rgba(126, 200, 227, 0.1);
        padding: 2px 6px;
        border-radius: var(--tf-radius-sm);
    }

    .session-delete {
        opacity: 0;
        background: none;
        border: none;
        color: var(--tf-accent-pink);
        cursor: pointer;
        padding: 4px;
        border-radius: var(--tf-radius-sm);
        transition: all var(--tf-transition-fast);
        margin-left: auto;
    }

    .session-item:hover .session-delete {
        opacity: 1;
    }

    .session-delete:hover {
        color: #e53e3e;
        transform: scale(1.2);
    }
</style>
