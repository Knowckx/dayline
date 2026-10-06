<!-- shortcuts_help.svelte - 快捷键帮助面板 -->
<script lang="ts">
    interface Props {
        isActive: boolean; // 今日页签激活状态。
        open: boolean;
        onClose: () => void;
    }

    let { isActive, open, onClose }: Props = $props();

    // 快捷键分组
    const shortcutGroups = [
        {
            title: "任务操作",
            shortcuts: [
                {
                    keys: ["Space"],
                    desc: "开始/暂停任务（悬浮/选中）",
                },
                { keys: ["Enter"], desc: "记录 Checkpoint（有运行任务时）" },
                { keys: ["Shift", "Enter"], desc: "强制新建任务" },
                { keys: ["Delete"], desc: "删除任务（悬浮/选中）" },
            ],
        },
        {
            title: "输入框",
            shortcuts: [
                { keys: ["Enter"], desc: "确认提交 / 空时关闭" },
                { keys: ["Esc"], desc: "关闭输入框" },
            ],
        },
        {
            title: "全局",
            shortcuts: [{ keys: ["?"], desc: "打开此帮助面板" }],
        },
    ];

    function handleOverlayClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            onClose();
        }
    }
</script>

<svelte:window onkeydown={isActive && open ? handleKeydown : undefined} />

{#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="overlay" onclick={handleOverlayClick}>
        <div class="panel">
            <header class="panel-header">
                <h2 class="panel-title">
                    <span class="title-icon">⌨️</span>
                    快捷键
                </h2>
                <button
                    class="tf-btn tf-btn-ghost"
                    onclick={onClose}
                    aria-label="返回"
                    style="width: 36px; padding: 0;"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
            </header>

            <div class="panel-content">
                {#each shortcutGroups as group}
                    <section class="shortcut-group">
                        <h3 class="group-title">{group.title}</h3>
                        <ul class="shortcut-list">
                            {#each group.shortcuts as shortcut}
                                <li class="shortcut-item">
                                    <div class="keys">
                                        {#each shortcut.keys as key, i}
                                            {#if i > 0}
                                                <span class="key-separator"
                                                    >+</span
                                                >
                                            {/if}
                                            <kbd class="key">{key}</kbd>
                                        {/each}
                                    </div>
                                    <span class="desc">{shortcut.desc}</span>
                                </li>
                            {/each}
                        </ul>
                    </section>
                {/each}
            </div>

            <footer class="panel-footer">
                <span class="tip"
                    >按 <kbd class="key key-sm">Esc</kbd> 关闭</span
                >
            </footer>
        </div>
    </div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
        animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .panel {
        background: var(--tf-bg-card);
        border-radius: var(--tf-radius-xl);
        box-shadow: var(--tf-shadow-lg);
        max-width: 480px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.25s ease;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--tf-spacing-lg);
        border-bottom: 1px solid var(--tf-border);
    }

    .panel-content {
        padding: var(--tf-spacing-lg);
        overflow-y: auto;
    }

    .shortcut-group {
        margin-bottom: var(--tf-spacing-lg);
    }

    .shortcut-group:last-child {
        margin-bottom: 0;
    }

    .group-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--tf-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 var(--tf-spacing-sm) 0;
    }

    .shortcut-list {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .shortcut-item {
        display: flex;
        align-items: center;
        gap: var(--tf-spacing-md);
        padding: var(--tf-spacing-sm) 0;
    }

    .keys {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 120px;
    }

    .key {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 28px;
        padding: 0 var(--tf-spacing-sm);
        background: white;
        border: 1px solid var(--tf-border);
        border-radius: var(--tf-radius-sm);
        font-family: var(--tf-font-mono);
        font-size: 1rem;
        font-weight: 500;
        color: var(--tf-text);
        box-shadow: 0 2px 0 var(--tf-border);
    }

    .key-sm {
        min-width: 20px;
        height: 20px;
        font-size: 1rem;
    }

    .key-separator {
        color: var(--tf-text-muted);
        font-size: 1rem;
    }

    .desc {
        color: var(--tf-text-secondary);
        font-size: 1rem;
    }

    .panel-footer {
        padding: var(--tf-spacing-md) var(--tf-spacing-lg);
        border-top: 1px solid var(--tf-border);
        background: var(--tf-bg-secondary);
    }

    .tip {
        display: flex;
        align-items: center;
        gap: var(--tf-spacing-xs);
        color: var(--tf-text-muted);
        font-size: 1rem;
    }
</style>
