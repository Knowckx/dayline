/**
 * TimeFlow 导出工具函数
 */

import type { Task } from '../types/task';
import { formatDate, formatTime, isSameDay } from './time';

/**
 * 计算任务总用时（毫秒）
 */
function calculateTaskDurationMs(task: Task): number {
    return task.sessions.reduce((sum, session) => {
        if (!session.endTime) return sum;
        return sum + (session.endTime.getTime() - session.startTime.getTime());
    }, 0);
}

/**
 * 将任务列表导出为 Markdown 格式
 */
export function exportToMarkdown(tasks: Task[], date: Date = new Date()): string {
    const todayTasks = tasks.filter(task => isSameDay(task.createdAt, date));

    if (todayTasks.length === 0) {
        return `# ${formatDate(date)}\n\n_今天还没有记录任务_`;
    }

    const lines: string[] = [];

    // 标题
    lines.push(`# ${formatDate(date)}`);
    lines.push('');
    lines.push('## 🚀 工作记录');
    lines.push('');

    // 按创建时间排序
    const sortedTasks = [...todayTasks].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    for (const task of sortedTasks) {
        const startTime = formatTime(task.createdAt, { showSeconds: false });
        const checkbox = task.status === 'completed' ? '[x]' : '[ ]';

        if (task.status === 'completed' && task.completedAt) {
            const endTime = formatTime(task.completedAt, { showSeconds: false });
            const duration = formatDurationShort(calculateTaskDurationMs(task));
            lines.push(`- ${checkbox} ${startTime} - ${endTime} | ${task.title} (用时 ${duration})`);
        } else {
            const statusText = task.status === 'pending' ? '待开始' :
                task.status === 'active' ? '进行中' : '已暂停';
            lines.push(`- ${checkbox} ${startTime} | ${task.title} (${statusText})`);
        }

        // 添加工作时段信息
        if (task.sessions.length > 1) {
            lines.push(`    > 共 ${task.sessions.length} 个工作时段`);
        }

        // 添加 Checkpoints
        const allCheckpoints = task.sessions.flatMap(s => s.checkpoints);
        for (const cp of allCheckpoints) {
            const cpTime = formatTime(cp.time, { showSeconds: false });
            lines.push(`    > ${cpTime} - ${cp.note}`);
        }
    }

    // 统计信息
    lines.push('');
    lines.push('---');
    lines.push('');

    const completedCount = todayTasks.filter(t => t.status === 'completed').length;
    const totalCount = todayTasks.length;
    lines.push(`📊 **统计**: 完成 ${completedCount}/${totalCount} 个任务`);

    // 计算总用时
    const totalMs = todayTasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + calculateTaskDurationMs(t), 0);

    if (totalMs > 0) {
        lines.push(`⏱️ **总用时**: ${formatDurationShort(totalMs)}`);
    }

    return lines.join('\n');
}

/**
 * 格式化持续时间为简短格式
 * @returns 如 "1h30m" 或 "45m"
 */
function formatDurationShort(ms: number): string {
    if (ms < 0) return '0m';

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours === 0) parts.push(`${minutes}m`);

    return parts.join('');
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            return true;
        } catch {
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

/**
 * 下载文本为文件
 */
export function downloadAsFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
