<!-- checkpoint_item.svelte - Checkpoint 条目组件 -->
<script lang="ts">
    import type { Checkpoint } from "../../types/task";
    import { formatTime } from "../../utils/time";

    interface Props {
        checkpoint: Checkpoint;
        onDelete?: (id: string) => void;
    }

    let { checkpoint, onDelete }: Props = $props();
</script>

<div class="tf-checkpoint-item">
    <!-- 子div 1: 专门存放小圆点 -->
    <div class="checkpoint-dot-cell">
        <div class="sub-dot"></div>
    </div>

    <!-- 子div 2: 存放时间、内容及删除按钮 -->
    <div class="checkpoint-content-cell">
        <span class="checkpoint-time">
            {formatTime(checkpoint.time)}
        </span>
        <div class="checkpoint-note">
            {checkpoint.note}
        </div>

        {#if onDelete}
            <button
                class="checkpoint-delete"
                onclick={(e) => {
                    e.stopPropagation();
                    onDelete(checkpoint.id);
                }}
                aria-label="删除记录点"
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
</div>

<style>
    .tf-checkpoint-item {
        display: flex;
        align-items: flex-start; /* 对齐内容的顶部 */
        margin: 6px 0;
        border-radius: var(--tf-radius-md);
        transition: all var(--tf-transition-fast);
        border: 1px solid transparent;
        /* margin-left 已经移除，依赖父容器的伪元素对齐 */
    }

    .checkpoint-dot-cell {
        flex-shrink: 0;
        width: 24px;
        height: 1.65rem; /* 匹配文字 1.1rem * 1.5 行高，确保垂直居中于第一行 */
        display: flex;
        justify-content: center;
        align-items: center; /* 这里的 center 使小圆点在格子内绝对居中 */
        z-index: 1;
    }

    .sub-dot {
        width: 6px;
        height: 6px;
        background: var(--tf-primary-light);
        border-radius: 50%;
        border: 1px solid white;
        opacity: 0.6;
    }

    .checkpoint-content-cell {
        flex: 1;
        display: flex;
        align-items: flex-start; /* 顶部对齐 */
        gap: 12px;
        padding-top: 0.1rem; /* 极微调，使文字与圆点重心完美匹配 */
    }

    .tf-checkpoint-item:hover {
        background: var(--tf-bg-secondary);
        border: 1px solid rgba(126, 200, 227, 0.15);
    }

    .checkpoint-time {
        padding-left: 0; /* 在新布局下不再需要 */
        flex-shrink: 0;
        width: 80px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--tf-text-secondary);
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
    }

    .checkpoint-note {
        flex: 1;
        font-size: 1.1rem;
        color: var(--tf-text);
        line-height: 1.5;
    }

    .checkpoint-delete {
        opacity: 0;
        background: none;
        border: none;
        color: var(--tf-accent-pink);
        cursor: pointer;
        padding: 4px;
        border-radius: var(--tf-radius-sm);
        transition: all var(--tf-transition-fast);
        margin-top: -2px;
    }

    .tf-checkpoint-item:hover .checkpoint-delete {
        opacity: 1;
    }

    .checkpoint-delete:hover {
        color: #e53e3e;
        transform: scale(1.2);
    }
</style>
