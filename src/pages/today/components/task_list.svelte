<!-- task_list.svelte - 任务列表组件 -->
<script lang="ts">
    import { taskStore } from "../stores/task_store.svelte";
    import { isSameDay } from "../utils/time";
    import TaskItem from "./task/task_item.svelte";

    interface Props {
        isActive: boolean; // 今日页签激活状态。
    }

    let { isActive }: Props = $props();

    // 筛选选中日期的任务
    const filteredTasks = $derived.by(() => {
        const selected = taskStore.selectedDate;
        return taskStore.tasks
            .filter((task) => isSameDay(task.createdAt, selected))
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    });
</script>

<div class="task-list">
    {#if filteredTasks.length === 0}
        <div class="empty-state">
            <div class="empty-icon">📝</div>
            <h3 class="empty-title">这天还没有任务</h3>
            <p class="empty-desc">点击右下角的 + 按钮开始记录你的工作</p>
        </div>
    {:else}
        <div class="tf-timeline" role="list">
            {#each filteredTasks as task (task.id)}
                <TaskItem {task} {isActive} />
            {/each}
        </div>
    {/if}
</div>

<style>
    .task-list {
        padding-bottom: 100px; /* 为 FAB 按钮留出空间 */
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--tf-spacing-2xl);
        text-align: center;
        min-height: 50vh;
    }

    .empty-icon {
        font-size: 4rem;
        margin-bottom: var(--tf-spacing-lg);
    }

    .empty-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--tf-text);
        margin: 0 0 var(--tf-spacing-sm);
    }

    .empty-desc {
        font-size: 1rem;
        color: var(--tf-text-secondary);
        margin: 0;
    }

    .tf-timeline {
        position: relative;
        padding-left: var(--tf-spacing-xl);
    }

    .tf-timeline::before {
        content: "";
        position: absolute;
        left: 11px;
        top: 10px;
        bottom: 10px;
        width: 2px;
        background: linear-gradient(
            to bottom,
            var(--tf-primary-light),
            var(--tf-border)
        );
    }
</style>
