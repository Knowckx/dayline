<!-- task_item.svelte - 任务卡片综合组件 -->
<script lang="ts">
    import type { Task } from "../../types/task";

    import {
        taskStore,
        calculateTaskDuration,
    } from "../../stores/task_store.svelte";
    import SessionList from "../session_list.svelte";
    import ConfirmDialog from "../confirm_dialog.svelte";
    import TaskHeader from "./task_header.svelte";
    import CheckpointList from "./checkpoint_list.svelte";
    import infa from "@knowckx/infa-s5";

    interface Props {
        isActive: boolean; // 今日页签激活状态，限制输入框聚焦。
        task: Task;
    }

    let { task, isActive: isPageActive }: Props = $props();

    let durationNow = $state(Date.now()); // 任务与时段共用的用时刷新时间
    let durationInterval: ReturnType<typeof setInterval> | undefined; // 进行中任务的刷新定时器
    const isActive = $derived(task.status === "active");

    /** 进行中每分钟刷新用时，状态变化或组件销毁时清理定时器。 */
    function setupDurationTimer() {
        refreshDurationTime();
        if (!isActive) return;
        durationInterval = setInterval(refreshDurationTime, 60 * 1000);
        return clearDurationTimer;
    }

    /** 使用实际时间重新计算用时。 */
    function refreshDurationTime() {
        durationNow = Date.now();
    }

    /** 停止用时刷新。 */
    function clearDurationTimer() {
        clearInterval(durationInterval);
        durationInterval = undefined;
    }

    $effect(setupDurationTimer);

    let showCheckpointInput = $state(false);
    let checkpointNote = $state("");
    let showConfirmDialog = $state(false);
    /** 展开状态 */
    let isExpanded = $state(false);
    let itemRef = $state<HTMLElement>();

    // 选中状态
    const isSelected = $derived(taskStore.selectedTaskId === task.id);

    // 当选中状态变化时，自动设置展开状态
    $effect(() => {
        if (isSelected) {
            isExpanded = true;
        } else {
            if (isEditingTitle) {
                handleSaveTitle();
            }
            if (task.status === "pending" || task.status === "completed") {
                isExpanded = false;
            }
        }
    });

    // 进行中或已暂停的任务始终展开
    $effect(() => {
        if (task.status === "active" || task.status === "paused") {
            isExpanded = true;
        }
    });

    // 响应全局快捷键
    $effect(() => {
        const signal = taskStore.checkpointFocusSignal;
        if (signal && signal.taskId === task.id) {
            // 第三步：全局信号仅负责“开启”
            taskStore.clearCheckpointFocusSignal();
            console.log(
                `[Checkpoint-Signal] Received signal for ${task.title}. Input state: ${showCheckpointInput}`,
            );
            if (!showCheckpointInput) {
                showCheckpointInput = true;
                // 对聚焦进行二次加固
                setTimeout(() => {
                    if (!isPageActive) return;
                    const input = itemRef?.querySelector(
                        ".checkpoint-input-wrapper input",
                    ) as HTMLInputElement;
                    if (input) {
                        console.log(
                            `[Checkpoint-Focus] Success for: ${task.title}`,
                        );
                        input.focus();
                    } else {
                        console.warn(
                            `[Checkpoint-Focus] Element not found in ref for: ${task.title}`,
                        );
                    }
                }, 60);
            }
        }
    });

    // 状态变更追踪日志
    $effect(() => {
        console.log(
            `[Checkpoint-State] ${task.title} -> ${showCheckpointInput ? "OPEN" : "CLOSED"}`,
        );
    });

    // 状态工具辅助
    const statusText = $derived.by(() => {
        switch (task.status) {
            case "pending":
                return "待开始";
            case "active":
                return "进行中";
            case "paused":
                return "已暂停";
            case "completed":
                return "已完成";
        }
    });

    const statusClass = $derived.by(() => {
        switch (task.status) {
            case "pending":
                return "status-pending";
            case "active":
                return "status-active";
            case "paused":
                return "status-paused";
            case "completed":
                return "status-completed";
        }
    });

    const totalDuration = $derived(calculateTaskDuration(task, durationNow));
    const formattedDuration = $derived.by(() => {
        if (totalDuration === 0) return null;
        const hours = Math.floor(totalDuration / (1000 * 60 * 60));
        const minutes = Math.floor(
            (totalDuration % (1000 * 60 * 60)) / (1000 * 60),
        );
        const parts: string[] = [];
        if (hours > 0) parts.push(`${hours}小时`);
        if (minutes > 0) parts.push(`${minutes}分钟`);
        return parts.join("") || "不到1分钟";
    });

    const allCheckpoints = $derived(
        task.sessions
            .flatMap((s) => s.checkpoints)
            .sort((a, b) => a.time.getTime() - b.time.getTime()),
    );

    // 业务逻辑处理
    function handleStart() {
        const activeTask = taskStore.getActiveTask();
        if (activeTask && activeTask.id !== task.id) {
            showConfirmDialog = true;
        } else {
            taskStore.startTask(task.id);
        }
    }

    function handleConfirmStart() {
        const activeTask = taskStore.getActiveTask();
        if (activeTask) taskStore.pauseTask(activeTask.id);
        taskStore.startTask(task.id);
        showConfirmDialog = false;
    }

    function handlePause() {
        const { discarded, durationSeconds } = taskStore.pauseTask(task.id);
        if (discarded) {
            infa.Tip.info(
                `仅记录了 ${durationSeconds} 秒，未达到 10 秒阈值，已忽略`,
            );
        }
    }

    function handleSubmitCheckpoint() {
        console.log(
            `[Checkpoint-Action] handleSubmitCheckpoint starting for: ${task.title}, note: "${checkpointNote}"`,
        );
        const trimmed = checkpointNote.trim();
        if (!trimmed) {
            console.log(
                `[Checkpoint-Action] Empty note, closing input for: ${task.title}`,
            );
            showCheckpointInput = false;
            return;
        }
        taskStore.addCheckpoint(task.id, { note: trimmed });
        checkpointNote = "";
        showCheckpointInput = false;
        console.log(
            `[Checkpoint-Action] Submit successful, closed input for: ${task.title}`,
        );
    }

    // 标题编辑逻辑
    let isEditingTitle = $state(false);
    let editedTitle = $state("");
    let suppressNextClick = false;

    function handleStartTitleEdit(e: MouseEvent) {
        e.stopPropagation();
        if (taskStore.selectedTaskId !== task.id) {
            // 如果未选中，点击标题仅执行选中（自动展开）
            taskStore.setSelectedTaskId(task.id);
            return;
        }
        // 只有在已选中的情况下，再次点击标题才进入编辑模式
        editedTitle = task.title;
        isEditingTitle = true;
    }

    function handleSaveTitle() {
        if (!isEditingTitle) return;
        const trimmed = editedTitle.trim();
        if (trimmed && trimmed !== task.title) {
            taskStore.updateTask(task.id, { title: trimmed });
        }
        suppressNextClick = true;
        setTimeout(() => (suppressNextClick = false), 150);
        isEditingTitle = false;
    }

    function handleKeyDownTitle(e: KeyboardEvent) {
        e.stopPropagation();
        if (e.key === "Enter") {
            handleSaveTitle();
        } else if (e.key === "Escape") {
            isEditingTitle = false;
            suppressNextClick = true;
            setTimeout(() => (suppressNextClick = false), 150);
        }
    }
</script>

<div
    bind:this={itemRef}
    class="task-item tf-card"
    class:completed={task.status === "completed"}
    class:active={task.status === "active"}
    class:paused={task.status === "paused"}
    class:selected={isSelected}
    class:expanded={isExpanded}
    onmouseenter={() => taskStore.setHoveredTaskId(task.id)}
    onmouseleave={() => taskStore.setHoveredTaskId(null)}
    onclick={() => {
        if (suppressNextClick) return;
        if (isSelected) {
            isExpanded = !isExpanded;
        } else {
            taskStore.setSelectedTaskId(task.id);
        }
    }}
    onkeydown={(e) => {
        // 如果 CP 输入框开着，忽略卡片主回车/空格，由输入框自己拦截
        if (showCheckpointInput) return;

        if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            if (e.key === " ") {
                e.preventDefault();
                if (task.status === "pending") handleStart();
                else if (task.status === "active") handlePause();
                else if (task.status === "paused") handleStart();
            } else if (e.key === "Enter") {
                if (isSelected) isExpanded = !isExpanded;
                else taskStore.setSelectedTaskId(task.id);
            }
        }
    }}
    tabindex="0"
    role="button"
    aria-pressed={isSelected}
    aria-expanded={isExpanded}
>
    <!-- 时间线指示点 -->
    <div
        class="tf-timeline-dot"
        class:completed={task.status === "completed"}
        class:active={task.status === "active"}
        class:paused={task.status === "paused"}
    ></div>

    <div class="task-layer layer-header">
        <TaskHeader
            isActive={isPageActive}
            {task}
            {statusText}
            {statusClass}
            {formattedDuration}
            {isEditingTitle}
            bind:editedTitle
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleStart}
            onComplete={() => taskStore.completeTask(task.id)}
            onRevert={() => taskStore.revertTask(task.id)}
            onAddCheckpoint={() => (showCheckpointInput = true)}
            onDeleteTask={() => taskStore.deleteTask(task.id)}
            onStartTitleEdit={handleStartTitleEdit}
            onSaveTitle={handleSaveTitle}
            onKeyDownTitle={handleKeyDownTitle}
        />
    </div>

    {#if isExpanded || showCheckpointInput}
        <div class="task-layer layer-progress">
            {#if isExpanded}
                <CheckpointList
                    checkpoints={allCheckpoints}
                    onDelete={(id) => taskStore.deleteCheckpoint(task.id, id)}
                />
            {/if}

            {#if showCheckpointInput}
                <div class="checkpoint-input-wrapper">
                    <infa.Input
                        bind:value={checkpointNote}
                        onEscape={() => (showCheckpointInput = false)}
                        onkeydown={(e) => {
                            if (e.key === "Enter") {
                                console.log(
                                    `[Checkpoint-Key] Enter pressed in input for: ${task.title}`,
                                );
                                e.stopPropagation();
                                handleSubmitCheckpoint();
                            } else if (e.key === " ") {
                                console.log(
                                    `[Checkpoint-Key] Space pressed (and intercepted) in input for: ${task.title}`,
                                );
                                e.stopPropagation();
                            }
                        }}
                        placeholder="记录当前进度..."
                        autoFocus={isPageActive}
                    />
                </div>
            {/if}
        </div>
    {/if}

    {#if isExpanded && task.sessions.length > 0}
        <div class="task-layer layer-sessions">
            <SessionList sessions={task.sessions} taskId={task.id} now={durationNow} isActive={isPageActive} />
        </div>
    {/if}
</div>

<ConfirmDialog
    isActive={isPageActive}
    open={showConfirmDialog}
    title="切换任务"
    message="当前有任务正在进行中，是否暂停当前任务并开始此任务？"
    confirmText="确认切换"
    cancelText="取消"
    onConfirm={handleConfirmStart}
    onCancel={() => (showConfirmDialog = false)}
/>

<style>
    .task-item {
        position: relative;
        margin-bottom: var(--tf-spacing-md);
        transition: all var(--tf-transition-normal);
        border: 2px solid transparent;
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .task-layer {
        padding: 0;
    }

    .layer-header {
        position: relative;
        z-index: 2;
    }

    .layer-progress {
        margin-top: var(--tf-spacing-xs);
        padding-top: var(--tf-spacing-xs);
        border-top: 1px dashed rgba(126, 200, 227, 0.1);
    }

    .checkpoint-input-wrapper {
        display: flex;
        gap: var(--tf-spacing-sm);
        margin-top: var(--tf-spacing-md);
        padding-left: var(--tf-spacing-xl);
    }

    .layer-sessions {
        margin-top: var(--tf-spacing-sm);
        padding-top: var(--tf-spacing-sm);
        border-top: 1px solid rgba(126, 200, 227, 0.08);
    }

    .task-item.completed:not(.selected) {
        opacity: 0.7;
    }

    .task-item:hover:not(.selected) {
        background: var(--tf-bg-card);
        box-shadow: 0 6px 20px rgba(126, 200, 227, 0.15);
        transform: translateY(-2px);
    }

    .task-item.selected {
        background: var(--tf-bg-card);
        border: 2px solid var(--tf-primary-light);
        box-shadow:
            0 12px 30px rgba(126, 200, 227, 0.18),
            0 4px 12px rgba(0, 0, 0, 0.05);
        transform: translateY(-2px);
        outline: none;
        z-index: 5;
    }

    .task-item.active {
        border-color: var(--tf-accent-green);
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(8px);
        animation: tf-premium-glow 3s ease-in-out infinite;
        z-index: 10;
    }

    @keyframes tf-premium-glow {
        0%,
        100% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.1);
        }
        50% {
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.2);
        }
    }

    .tf-timeline-dot.active {
        background: var(--tf-accent-green);
        box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
        animation: dot-pulse 1.5s ease-in-out infinite;
    }

    @keyframes dot-pulse {
        0%,
        100% {
            transform: scale(1);
            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
        }
        50% {
            transform: scale(1.15);
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.3);
        }
    }

    .tf-timeline-dot.paused {
        background: var(--tf-accent-yellow);
        box-shadow: 0 0 0 4px rgba(234, 179, 8, 0.2);
    }
</style>
