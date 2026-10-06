<script lang="ts">
    import type { Checkpoint } from "../../types/task";
    import CheckpointItem from "./checkpoint_item.svelte";

    interface Props {
        checkpoints: Checkpoint[];
        onDelete: (id: string) => void;
    }

    let { checkpoints, onDelete }: Props = $props();
</script>

{#if checkpoints.length > 0}
    <div class="tf-checkpoint">
        {#each checkpoints as checkpoint (checkpoint.id)}
            <CheckpointItem {checkpoint} {onDelete} />
        {/each}
    </div>
{/if}

<style>
    .tf-checkpoint {
        position: relative;
        margin-top: 12px;
        margin-bottom: 8px;
        padding-left: 0;
    }

    .tf-checkpoint::before {
        content: "";
        position: absolute;
        left: 12px; /* 对齐 24px 槽位的中心 */
        top: 0;
        bottom: 0;
        width: 1px;
        border-left: 1px dashed rgba(126, 200, 227, 0.2);
        z-index: 0;
    }
</style>
