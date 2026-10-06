<!-- task_input.svelte - 任务输入组件 -->
<script lang="ts">
    import "../styles/theme.css";
    import { taskStore } from "../stores/task_store.svelte";
    import infa from "@knowckx/infa-s5";

    interface Props {
        isActive: boolean; // 今日页签激活状态。
    }

    let { isActive }: Props = $props();

    let inputValue = $state("");
    let inputRef: HTMLInputElement | undefined = $state();
    let isExpanded = $derived(taskStore.isTaskInputExpanded);

    function handleSubmit() {
        const trimmed = inputValue.trim();
        if (!trimmed) {
            // 空输入时按 Enter 等于关闭输入框
            taskStore.setTaskInputExpanded(false);
            return;
        }

        taskStore.addTask({ title: trimmed });
        inputValue = "";
        taskStore.setTaskInputExpanded(false);
    }

    function handleFabClick() {
        taskStore.setTaskInputExpanded(true);
        // 等待 DOM 更新后聚焦
        setTimeout(() => inputRef?.focus(), 50);
    }

    /** 全局快捷键处理 */
    function handleGlobalKeydown(e: KeyboardEvent) {
        if (!isActive) return;
        // 如果焦点在输入框中，不处理
        const activeElement = document.activeElement;
        if (
            activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement
        ) {
            return;
        }

        // Enter 键：逻辑切换为“仅开启”
        if (e.key === "Enter") {
            const activeTask = taskStore.getActiveTask();
            // Shift + Enter 始终针对新任务输入；普通 Enter 仅在没有运行中任务时针对新任务输入
            const isTargeted = e.shiftKey || !activeTask;

            if (isTargeted && !isExpanded) {
                e.preventDefault();
                handleFabClick();
            }
        }
    }
</script>

<!-- 全局键盘监听 -->
<svelte:window onkeydown={isActive ? handleGlobalKeydown : undefined} />

<!-- 输入区域 -->
{#if isExpanded}
    <div class="task-input-wrapper">
        <div class="task-input-card">
            <infa.Input
                bind:value={inputValue}
                onEscape={() => {
                    taskStore.setTaskInputExpanded(false);
                }}
                onkeydown={(e) => {
                    if (e.key === "Enter") {
                        e.stopPropagation();
                        handleSubmit();
                    } else if (e.key === " ") {
                        e.stopPropagation();
                    }
                }}
                placeholder="输入新任务，按 Enter 确认..."
                autoFocus={isActive}
            />
            <div class="task-input-actions">
                <button
                    class="tf-btn tf-btn-secondary"
                    onclick={() => {
                        taskStore.setTaskInputExpanded(false);
                        inputValue = "";
                    }}
                >
                    取消
                </button>
                <button
                    class="tf-btn tf-btn-primary"
                    onclick={handleSubmit}
                    disabled={!inputValue.trim()}
                >
                    添加任务
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- FAB 悬浮按钮 -->
{#if !isExpanded}
    <button class="tf-fab" onclick={handleFabClick} aria-label="新增时间记录" title="新增时间记录">
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
        >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    </button>
{/if}

<style>
    .task-input-wrapper {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: var(--tf-spacing-lg);
        background: linear-gradient(to top, var(--tf-bg) 80%, transparent);
        z-index: 100;
    }

    .task-input-card {
        max-width: 600px;
        margin: 0 auto;
        background: var(--tf-bg-card);
        border-radius: var(--tf-radius-xl);
        padding: var(--tf-spacing-lg);
        box-shadow: var(--tf-shadow-lg);
    }

    .task-input-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--tf-spacing-sm);
        margin-top: var(--tf-spacing-md);
    }
</style>
