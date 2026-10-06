<!-- session_list.svelte - 工作时段列表组件 -->
<script lang="ts">
    import type { WorkSession } from "../types/task";
    import { taskStore } from "../stores/task_store.svelte";
    import SessionItem from "./session_item.svelte";
    import ConfirmDialog from "./confirm_dialog.svelte";

    interface Props {
        isActive: boolean; // 今日页签激活状态。
        sessions: WorkSession[];
        taskId: string;
        now: number; // 与任务总用时同步的当前时间
    }

    let { sessions, taskId, now, isActive }: Props = $props();

    let showDeleteConfirm = $state(false);
    let sessionToDelete = $state<string | null>(null);

    /** 请求删除时段（显示确认弹窗） */
    function handleRequestDelete(sessionId: string) {
        sessionToDelete = sessionId;
        showDeleteConfirm = true;
    }

    /** 确认删除时段 */
    function confirmDelete() {
        if (sessionToDelete) {
            taskStore.deleteSession(taskId, sessionToDelete);
        }
        showDeleteConfirm = false;
        sessionToDelete = null;
    }

    /** 取消删除时段 */
    function cancelDelete() {
        showDeleteConfirm = false;
        sessionToDelete = null;
    }
</script>

{#if sessions.length > 0}
    <div class="sessions-list">
        {#each sessions as session, i}
            <SessionItem {session} {now} index={i} onDelete={handleRequestDelete} />
        {/each}
    </div>
{/if}

<!-- 删除时段确认弹窗 -->
<ConfirmDialog
    {isActive}
    open={showDeleteConfirm}
    title="删除时段"
    message="确定要删除这个工作时段吗？此操作不可撤销。"
    confirmText="确认删除"
    cancelText="取消"
    onConfirm={confirmDelete}
    onCancel={cancelDelete}
/>

<style>
    .sessions-list {
        /* 与时间标签对齐 */
        margin-left: 0;
    }
</style>
