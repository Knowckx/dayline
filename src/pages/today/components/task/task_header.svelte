<script lang="ts">
    import type { Task } from "../../types/task";
    import { formatTime } from "../../utils/time";
    import TaskStatusBadge from "./task_status_badge.svelte";
    import infa from "@knowckx/infa-s5";

    interface Props {
        isActive: boolean; // 今日页签激活状态，限制标题输入框聚焦。
        task: Task;
        statusText: string;
        statusClass: string;
        formattedDuration: string | null;
        isEditingTitle: boolean;
        editedTitle: string;
        onStart: () => void;
        onPause: () => void;
        onResume: () => void;
        onComplete: () => void;
        onAddCheckpoint: () => void;
        onDeleteTask: () => void;
        onRevert: () => void;
        onStartTitleEdit: (e: MouseEvent) => void;
        onSaveTitle: () => void;
        onKeyDownTitle: (e: KeyboardEvent) => void;
    }

    let {
        isActive,
        task,
        statusText,
        statusClass,
        formattedDuration,
        isEditingTitle,
        editedTitle = $bindable(),
        onStart,
        onPause,
        onResume,
        onComplete,
        onAddCheckpoint,
        onDeleteTask,
        onRevert,
        onStartTitleEdit,
        onSaveTitle,
        onKeyDownTitle,
    }: Props = $props();

    function selectOnMount(node: HTMLInputElement) {
        node.focus();
        node.select();
    }
</script>

<div class="task-header">
    <!-- 第一行：基础信息 -->
    <div class="task-info-row">
        <span class="tf-time">{formatTime(task.createdAt)}</span>
        {#if isEditingTitle}
            <infa.Input
                bind:value={editedTitle}
                onEscape={() => {
                    // 逻辑由 Props 透传
                }}
                onkeydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                    }
                    onKeyDownTitle(e);
                }}
                autoFocus={isActive}
                class="task-title-input"
            />
        {:else}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="task-title"
                class:completed={task.status === "completed"}
                onclick={onStartTitleEdit}
                title="点击修改标题"
            >
                {task.title}
            </div>
        {/if}

        {#if formattedDuration}
            <span class="duration-badge">用时 {formattedDuration}</span>
        {/if}

        <TaskStatusBadge status={task.status} {statusText} {statusClass} />
    </div>

    <!-- 第二行：操作按钮 -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="task-actions-row">
        {#if task.status === "pending"}
            <button
                class="tf-btn tf-btn-success"
                onclick={(e) => {
                    e.stopPropagation();
                    onStart();
                }}
                title="开始任务"
            >
                ▶ 开始
            </button>
        {:else if task.status === "active"}
            <button
                class="tf-btn tf-btn-warning"
                onclick={(e) => {
                    e.stopPropagation();
                    onPause();
                }}
                title="暂停任务"
            >
                ⏸ 暂停
            </button>
            <button
                class="tf-btn tf-btn-info"
                onclick={(e) => {
                    e.stopPropagation();
                    onAddCheckpoint();
                }}
                title="添加记录点"
            >
                📝 记录
            </button>
        {:else if task.status === "paused"}
            <button
                class="tf-btn tf-btn-success"
                onclick={(e) => {
                    e.stopPropagation();
                    onResume();
                }}
                title="继续任务"
            >
                ▶ 继续
            </button>
            <button
                class="tf-btn tf-btn-info"
                onclick={(e) => {
                    e.stopPropagation();
                    onAddCheckpoint();
                }}
                title="添加记录点"
            >
                📝 记录
            </button>
        {:else if task.status === "completed"}
            <button
                class="tf-btn tf-btn-secondary"
                onclick={(e) => {
                    e.stopPropagation();
                    onRevert();
                }}
                title="撤回到已暂停状态"
            >
                ↺ 撤回
            </button>
        {/if}

        <div class="spacer"></div>

        {#if task.status !== "pending" && task.status !== "completed"}
            <button
                class="tf-btn tf-btn-primary"
                onclick={(e) => {
                    e.stopPropagation();
                    onComplete();
                }}
                title="完成任务"
            >
                ✓ 完成
            </button>
        {/if}

        <button
            class="tf-btn tf-btn-danger"
            onclick={(e) => {
                e.stopPropagation();
                onDeleteTask();
            }}
            title="删除任务"
        >
            <svg
                width="18"
                height="18"
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
    </div>
</div>

<style>
    .task-header {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .task-info-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }

    .task-info-row .tf-time {
        flex-shrink: 0;
        width: 100px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        font-size: 1.2rem;
        padding-left: var(--tf-spacing-xs);
        font-weight: 600;
        color: var(--tf-text);
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
    }

    .task-title {
        flex: 1;
        min-width: 100px;
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--tf-text);
        word-break: break-word;
        padding: 2px 6px;
        margin: -2px -6px;
        border-radius: var(--tf-radius-sm);
        cursor: default;
        transition: background-color var(--tf-transition-fast);
    }

    .task-title.completed {
        text-decoration: line-through;
        color: var(--tf-text);
        opacity: 0.7;
    }

    :global(.task-item.selected) .task-title {
        background: var(--tf-bg-secondary);
    }

    :global(.task-item.selected) .task-title:hover {
        background: rgba(126, 200, 227, 0.15);
        cursor: text;
    }

    :global(.task-title-input) {
        flex: 1;
        min-width: 100px;
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--tf-text);
        border: none;
        background: var(--tf-bg-secondary);
        outline: 2px solid var(--tf-primary-light);
        border-radius: var(--tf-radius-sm);
        padding: 2px 6px;
        margin: -2px -6px;
        font-family: inherit;
    }

    .duration-badge {
        background: var(--tf-bg-secondary);
        color: var(--tf-text);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        font-size: 0.9rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: var(--tf-radius-md);
        white-space: nowrap;
        border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .task-actions-row {
        display: flex;
        align-items: center;
        gap: var(--tf-spacing-sm);
        height: 0;
        opacity: 0;
        margin-top: 0;
        transition: all var(--tf-transition-normal);
        pointer-events: none;
        overflow: hidden;
    }

    .task-actions-row .spacer {
        flex: 1;
    }

    /* 选中、激活或暂停时显示操作按钮 */
    :global(.task-item.selected) .task-actions-row,
    :global(.task-item.active) .task-actions-row,
    :global(.task-item.paused) .task-actions-row {
        height: 40px;
        margin-top: var(--tf-spacing-sm);
        opacity: 1;
        pointer-events: auto;
        overflow: visible;
    }
</style>
