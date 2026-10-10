<!-- 今日页：承载迁入的 Timeflow 时间记录功能。 -->
<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import "./styles/theme.css";
    import {
        taskStore,
        calculateTaskDuration,
    } from "./stores/task_store.svelte";
    import type { Task } from "./types/task";
    import TaskList from "./components/task_list.svelte";
    import TaskInput from "./components/task_input.svelte";
    import ConfirmDialog from "./components/confirm_dialog.svelte";
    import ShortcutsHelp from "./components/shortcuts_help.svelte";
    import { formatDate, isSameDay, isToday } from "./utils/time";
    import { exportToMarkdown, copyToClipboard } from "./utils/export";
    import { Tip } from "@knowckx/infa-s5";

    interface Props {
        isActive: boolean; // 当前是否选中今日页签。
    }

    let { isActive }: Props = $props();

    let showExportToast = $state(false);
    let checkDateInterval: ReturnType<typeof setInterval> | null = null;
    let lastCheckedDate = new Date();

    // 快捷键帮助面板状态
    let showShortcutsHelp = $state(false);

    // 删除确认弹窗状态
    let showDeleteConfirm = $state(false);
    let taskToDelete = $state<Task | null>(null);
    let deleteConfirmMessage = $state("");

    /** 判断删除任务是否需要二次确认 */
    function shouldConfirmDelete(task: Task): boolean {
        // 有 Checkpoint
        const hasCheckpoints = task.sessions.some(
            (s) => s.checkpoints.length > 0,
        );
        // 总时长超过 5 分钟
        const totalMs = calculateTaskDuration(task);
        const hasSignificantTime = totalMs > 5 * 60 * 1000;
        return hasCheckpoints || hasSignificantTime;
    }

    /** 生成删除确认消息 */
    function getDeleteConfirmMessage(task: Task): string {
        const checkpointCount = task.sessions.reduce(
            (sum, s) => sum + s.checkpoints.length,
            0,
        );
        const totalMs = calculateTaskDuration(task);
        const minutes = Math.floor(totalMs / (1000 * 60));

        const parts: string[] = [];
        if (checkpointCount > 0) parts.push(`${checkpointCount} 个检查点`);
        if (minutes > 0) parts.push(`用时 ${minutes} 分钟`);

        return `此任务包含 ${parts.join("，")}，确定要删除吗？`;
    }

    /** 处理删除任务（带确认逻辑） */
    function handleDeleteTask(task: Task) {
        if (shouldConfirmDelete(task)) {
            taskToDelete = task;
            deleteConfirmMessage = getDeleteConfirmMessage(task);
            showDeleteConfirm = true;
        } else {
            taskStore.deleteTask(task.id);
            Tip.success("已删除任务");
        }
    }

    /** 确认删除 */
    function confirmDelete() {
        if (taskToDelete) {
            taskStore.deleteTask(taskToDelete.id);
            Tip.success("已删除任务");
        }
        showDeleteConfirm = false;
        taskToDelete = null;
    }

    /** 取消删除 */
    function cancelDelete() {
        showDeleteConfirm = false;
        taskToDelete = null;
    }

    onMount(() => {
        taskStore.init();

        // 每分钟检查是否跨日，跨日时自动切换到新的一天
        checkDateInterval = setInterval(() => {
            const now = new Date();
            if (!isSameDay(now, lastCheckedDate)) {
                // 跨日了，如果当前显示的是昨天（之前的"今天"），自动切换到新的今天
                if (isSameDay(taskStore.selectedDate, lastCheckedDate)) {
                    taskStore.resetToToday();
                }
                lastCheckedDate = now;
            }
        }, 60 * 1000); // 每分钟检查一次
    });

    onDestroy(() => {
        if (checkDateInterval) {
            clearInterval(checkDateInterval);
        }
    });

    /** 计算选中日期的总工作时长（毫秒） */
    const selectedDateTotalMs = $derived.by(() => {
        const selected = taskStore.selectedDate;
        return taskStore.tasks
            .filter((task) => {
                // 只统计该日期创建的已完成任务
                if (task.status !== "completed") return false;
                const taskDate = task.createdAt;
                return (
                    taskDate.getFullYear() === selected.getFullYear() &&
                    taskDate.getMonth() === selected.getMonth() &&
                    taskDate.getDate() === selected.getDate()
                );
            })
            .reduce((sum, task) => {
                // 累加所有时段的时长
                return (
                    sum +
                    task.sessions.reduce((sessionSum, session) => {
                        if (!session.endTime) return sessionSum;
                        return (
                            sessionSum +
                            (session.endTime.getTime() -
                                session.startTime.getTime())
                        );
                    }, 0)
                );
            }, 0);
    });

    /** 格式化总时长 */
    const formattedTotalTime = $derived.by(() => {
        if (selectedDateTotalMs === 0) return null;

        const hours = Math.floor(selectedDateTotalMs / (1000 * 60 * 60));
        const minutes = Math.floor(
            (selectedDateTotalMs % (1000 * 60 * 60)) / (1000 * 60),
        );

        const parts: string[] = [];
        if (hours > 0) parts.push(`${hours}小时`);
        if (minutes > 0) parts.push(`${minutes}分钟`);

        return parts.join("") || "不到1分钟";
    });

    /** 是否显示今天 */
    const isShowingToday = $derived(isToday(taskStore.selectedDate));

    async function handleExport() {
        const markdown = exportToMarkdown(taskStore.tasks);
        const success = await copyToClipboard(markdown);

        if (success) {
            Tip.success("已复制到剪贴板！");
        } else {
            Tip.error("复制失败，请手动复制");
            console.log(markdown);
        }
    }

    /** 辅助：暂停任务并提示结果 */
    function pauseAndNotify(taskId: string) {
        const { discarded, durationSeconds } = taskStore.pauseTask(taskId);
        if (discarded) {
            Tip.info(
                `仅记录了 ${durationSeconds} 秒，未达到 10 秒阈值，已忽略`,
            );
        } else {
            Tip.success("已暂停任务");
        }
    }

    /** 辅助：根据当前状态切换任务（开始/暂停） */
    function toggleTaskState(task: Task) {
        if (task.status === "active") {
            pauseAndNotify(task.id);
        } else if (task.status === "pending" || task.status === "paused") {
            taskStore.startTask(task.id);
            Tip.success("已开始/继续任务");
        }
    }

    /** 处理全局键盘事件 */
    function handleGlobalKeydown(e: KeyboardEvent) {
        if (!isActive) return;
        // 如果焦点在输入框内，不处理
        const target = e.target as HTMLElement;
        if (
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable
        ) {
            return;
        }

        // 空格键：智能切换任务状态
        if (e.key === " " || e.code === "Space") {
            e.preventDefault();

            // 1. 优先处理被悬停的任务
            if (taskStore.hoveredTaskId) {
                const hoveredTask = taskStore.tasks.find(
                    (t) => t.id === taskStore.hoveredTaskId,
                );
                if (hoveredTask) {
                    toggleTaskState(hoveredTask);
                    return;
                }
            }

            // 2. 其次处理被选中的任务
            if (taskStore.selectedTaskId) {
                const selectedTask = taskStore.tasks.find(
                    (t) => t.id === taskStore.selectedTaskId,
                );
                if (selectedTask) {
                    toggleTaskState(selectedTask);
                    return;
                }
            }

            // 3. 没有悬停和选中时，如果当前有进行中的任务，则暂停它
            const activeTask = taskStore.getActiveTask();
            if (activeTask) {
                pauseAndNotify(activeTask.id);
                return;
            }

            // 4. 最后，开始当前视图（日期）下最后创建的一个未开始/已暂停任务
            const selected = taskStore.selectedDate;
            const currentViewTasks = taskStore.tasks.filter((t) => {
                const d = t.createdAt;
                return (
                    d.getFullYear() === selected.getFullYear() &&
                    d.getMonth() === selected.getMonth() &&
                    d.getDate() === selected.getDate()
                );
            });

            // 找到最后一个非已完成的任务（倒序找最新的）
            const latestTask = currentViewTasks.find(
                (t) => t.status === "pending" || t.status === "paused",
            );

            if (latestTask) {
                taskStore.startTask(latestTask.id);
                Tip.success("已自动开始最新任务");
            }
        }

        // 处理回车键：快速添加 Checkpoint
        if (e.key === "Enter") {
            console.log(
                `[Page-Key] Global Enter received. taskInputExpanded: ${taskStore.isTaskInputExpanded}`,
            );
            // 如果任务输入框正开着，回车应该由它优先响应（关闭），这里不触发 CP
            if (taskStore.isTaskInputExpanded) {
                console.log("[Page-Key] Task input is open, ignoring for CP");
                return;
            }

            const activeTask = taskStore.getActiveTask();
            if (activeTask) {
                console.log(
                    `[Page-Key] Triggering signal for active task: ${activeTask.id}`,
                );
                e.preventDefault();
                taskStore.triggerCheckpointFocus(activeTask.id);
            } else {
                console.log("[Page-Key] No active task found for CP");
            }
        }

        // Delete 或 Backspace 键：删除悬浮或选中的任务
        if (e.key === "Delete" || e.key === "Backspace") {
            // 1. 优先删除悬浮的任务
            if (taskStore.hoveredTaskId) {
                const hoveredTask = taskStore.tasks.find(
                    (t) => t.id === taskStore.hoveredTaskId,
                );
                if (hoveredTask) {
                    e.preventDefault();
                    handleDeleteTask(hoveredTask);
                    return;
                }
            }

            // 2. 其次删除选中的任务
            if (taskStore.selectedTaskId) {
                const selectedTask = taskStore.tasks.find(
                    (t) => t.id === taskStore.selectedTaskId,
                );
                if (selectedTask) {
                    e.preventDefault();
                    handleDeleteTask(selectedTask);
                    return;
                }
            }
        }

        // ? 键：打开快捷键帮助面板
        if (e.key === "?" || (e.shiftKey && e.key === "/")) {
            e.preventDefault();
            showShortcutsHelp = true;
        }
    }
</script>

<svelte:window onkeydown={isActive ? handleGlobalKeydown : undefined} />

<div class="timeflow-page app-container" aria-label="今日时间记录">
    <!-- 头部 -->
    <header class="app-header">
        <div class="header-content">
            <div class="header-top">
                <h1 class="app-title">
                    <span class="title-icon">⏱️</span>
                    TimeFlow
                </h1>
                <div class="header-actions">
                    <button
                        class="tf-btn tf-btn-ghost"
                        onclick={() => (showShortcutsHelp = true)}
                        title="快捷键帮助"
                        style="width: 36px; padding: 0;"
                    >
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                            <path d="M12 17h.01" />
                        </svg>
                    </button>
                    <button
                        class="tf-btn tf-btn-primary"
                        onclick={handleExport}
                        title="导出今日记录为 Markdown"
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
                                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                            />
                        </svg>
                        导出
                    </button>
                </div>
            </div>
            <div class="header-info">
                <div class="date-nav">
                    <button
                        class="tf-btn tf-btn-secondary"
                        onclick={() => taskStore.goToPreviousDay()}
                        title="前一天"
                        style="width: 36px; padding: 0;"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <div class="date-display">
                        <span class="app-subtitle"
                            >{formatDate(taskStore.selectedDate)}</span
                        >
                        {#if !isShowingToday}
                            <button
                                class="today-btn"
                                onclick={() => taskStore.resetToToday()}
                                style="margin-top: 4px;"
                            >
                                回到今天
                            </button>
                        {/if}
                    </div>
                    <button
                        class="tf-btn tf-btn-secondary"
                        onclick={() => taskStore.goToNextDay()}
                        title="后一天"
                        style="width: 36px; padding: 0;"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </div>
                {#if formattedTotalTime}
                    <div class="total-time">
                        <span class="total-time-icon">🔥</span>
                        <span class="total-time-label"
                            >{isShowingToday ? "今日投入" : "当日投入"}</span
                        >
                        <span class="total-time-value"
                            >{formattedTotalTime}</span
                        >
                    </div>
                {/if}
            </div>
        </div>
    </header>

    <!-- 主内容区 -->
    <main class="app-main">
        {#if taskStore.initialized}
            <TaskList {isActive} />
        {:else}
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>加载中...</p>
            </div>
        {/if}
    </main>

    <!-- 任务输入 -->
    <TaskInput {isActive} />

<!-- 删除确认弹窗 -->
<ConfirmDialog
    {isActive}
    open={showDeleteConfirm}
    title="删除任务"
    message={deleteConfirmMessage}
    confirmText="确认删除"
    cancelText="取消"
    onConfirm={confirmDelete}
    onCancel={cancelDelete}
/>

<!-- 快捷键帮助面板 -->
<ShortcutsHelp
    {isActive}
    open={showShortcutsHelp}
    onClose={() => (showShortcutsHelp = false)}
/>
</div>

<style>
    .app-container {
        position: relative;
        contain: layout; /* 将原应用的固定浮层限定在今日页内容区。 */
        isolation: isolate;
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        background: var(--tf-bg-secondary);
    }

    .app-header {
        flex-shrink: 0;
        background: var(--tf-bg);
        box-shadow: var(--tf-shadow-sm);
        position: sticky;
        top: 0;
        z-index: 50;
    }

    .header-content {
        max-width: 800px;
        margin: 0 auto;
        padding: var(--tf-spacing-lg) clamp(16px, 4vw, 32px);
    }

    .app-title {
        display: flex;
        align-items: center;
        gap: var(--tf-spacing-sm);
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--tf-text);
        margin: 0;
    }

    .title-icon {
        font-size: 1.75rem;
    }

    .app-subtitle {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--tf-text-secondary);
        margin: var(--tf-spacing-xs) 0 0;
    }

    .header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: var(--tf-spacing-sm);
    }

    .header-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: var(--tf-spacing-sm);
        margin-top: var(--tf-spacing-md);
    }

    .date-nav {
        display: flex;
        align-items: center;
        gap: var(--tf-spacing-sm);
    }

    .date-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        min-width: 140px;
        text-align: center;
    }

    .date-display .app-subtitle {
        margin: 0;
    }

    .today-btn {
        background: var(--tf-accent-orange);
        color: #b7791f;
        border: none;
        border-radius: var(--tf-radius-full);
        padding: var(--tf-spacing-xs) var(--tf-spacing-md);
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--tf-transition-fast);
        box-shadow: var(--tf-shadow-btn-warning);
    }

    .today-btn:hover {
        background: #fbd38d;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(251, 211, 141, 0.4);
    }

    .total-time {
        display: flex;
        align-items: center;
        gap: var(--tf-spacing-xs);
        background: linear-gradient(
            135deg,
            var(--tf-accent-orange),
            var(--tf-accent-yellow)
        );
        padding: var(--tf-spacing-xs) var(--tf-spacing-md);
        border-radius: var(--tf-radius-full);
        font-size: 1rem;
    }

    .total-time-icon {
        font-size: 1rem;
    }

    .total-time-label {
        color: #92400e;
        font-weight: 500;
    }

    .total-time-value {
        color: #78350f;
        font-weight: 700;
    }

    .app-main {
        flex: 1;
        min-height: 0;
        width: 100%;
        overflow-y: auto;
        max-width: 800px;
        margin: 0 auto;
        padding: var(--tf-spacing-lg) clamp(16px, 4vw, 32px);
    }

    .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--tf-spacing-2xl);
        color: var(--tf-text-secondary);
    }

    .loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--tf-border);
        border-top-color: var(--tf-primary);
        border-radius: 50%;
        animation: tf-spin 0.8s linear infinite;
        margin-bottom: var(--tf-spacing-md);
    }

    @keyframes tf-spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
