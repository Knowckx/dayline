<script lang="ts">
    import type { TaskStatus } from "@/lib/timeflow/types/task";

    interface Props {
        status: TaskStatus;
        statusText: string;
        statusClass: string;
    }

    let { status, statusText, statusClass }: Props = $props();
</script>

<div class="status-wrapper">
    <span class="tf-badge {statusClass}">
        {#if status === "active"}
            <div class="status-vibe">
                <div class="vibe-bar"></div>
                <div class="vibe-bar"></div>
                <div class="vibe-bar"></div>
            </div>
        {/if}
        {statusText}
    </span>
</div>

<style>
    .status-wrapper {
        display: flex;
        align-items: center;
    }

    .tf-badge {
        font-size: 1rem;
        padding: 4px 10px;
        border-radius: var(--tf-radius-full);
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
    }

    .status-pending {
        background: var(--tf-bg-secondary);
        color: var(--tf-text-secondary);
    }

    .status-active {
        background: var(--tf-accent-green);
        color: #166534;
    }

    .status-paused {
        background: var(--tf-accent-yellow);
        color: #92400e;
    }

    .status-completed {
        background: var(--tf-primary-light);
        color: var(--tf-primary-dark);
    }

    .status-vibe {
        display: flex;
        align-items: center;
        gap: 2px;
        margin-right: 6px;
        height: 12px;
    }

    .vibe-bar {
        width: 2px;
        height: 100%;
        background: currentColor;
        border-radius: 1px;
        animation: tf-wave 1s ease-in-out infinite;
    }

    .vibe-bar:nth-child(2) {
        animation-delay: 0.2s;
    }

    .vibe-bar:nth-child(3) {
        animation-delay: 0.4s;
    }

    @keyframes tf-wave {
        0%,
        100% {
            transform: scaleY(0.4);
        }
        50% {
            transform: scaleY(1);
        }
    }
</style>
