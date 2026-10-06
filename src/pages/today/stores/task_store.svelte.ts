/**
 * TimeFlow Task Store
 * 使用 Svelte 5 runes 管理任务状态
 */

import type { Task, WorkSession, Checkpoint, NewTaskInput, NewCheckpointInput } from '../types/task';
import { config } from '../config';

const STORAGE_KEY = 'dayline.timeflow'; // 时间记录独立存储，仅维护迁入后的当前结构。

/** 生成唯一 ID */
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/** 从 localStorage 加载任务 */
function loadTasks(): Task[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const parsed = JSON.parse(stored);
        // 恢复 Date 对象
        return parsed.map((task: Task) => ({
            ...task,
            createdAt: new Date(task.createdAt),
            completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
            sessions: task.sessions.map((session: WorkSession) => ({
                ...session,
                startTime: new Date(session.startTime),
                endTime: session.endTime ? new Date(session.endTime) : undefined,
                checkpoints: session.checkpoints.map((cp: Checkpoint) => ({
                    ...cp,
                    time: new Date(cp.time)
                }))
            }))
        }));
    } catch {
        return [];
    }
}

/** 保存任务到 localStorage */
function saveTasks(tasks: Task[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/** 计算任务总用时（毫秒） */
export function calculateTaskDuration(task: Task, now: number = Date.now()): number {
    return task.sessions.reduce((sum, session) => {
        if (!session.endTime) {
            // 进行中的时段，计算到当前时间
            return sum + (now - session.startTime.getTime());
        }
        return sum + (session.endTime.getTime() - session.startTime.getTime());
    }, 0);
}

/** 获取任务当前活跃的时段 */
function getCurrentSession(task: Task): WorkSession | undefined {
    return task.sessions.find(s => !s.endTime);
}

/** 创建任务状态管理器 */
function createTaskStore() {
    let tasks = $state<Task[]>([]);
    let initialized = $state(false);
    let selectedDate = $state<Date>(new Date());
    let hoveredTaskId = $state<string | null>(null);
    let selectedTaskId = $state<string | null>(null);
    let isTaskInputExpanded = $state(false);
    let checkpointFocusSignal = $state<{ taskId: string; timestamp: number } | null>(null);


    return {
        /** 获取所有任务 */
        get tasks() {
            return tasks;
        },

        /** 是否已初始化 */
        get initialized() {
            return initialized;
        },

        /** 获取当前选中的日期 */
        get selectedDate() {
            return selectedDate;
        },

        /** 当前所悬停的任务 ID */
        get hoveredTaskId() {
            return hoveredTaskId;
        },

        /** 设置当前悬停的任务 ID */
        setHoveredTaskId(id: string | null) {
            hoveredTaskId = id;
        },

        /** 当前所选中的任务 ID */
        get selectedTaskId() {
            return selectedTaskId;
        },

        /** 设置当前选中的任务 ID */
        setSelectedTaskId(id: string | null) {
            selectedTaskId = id;
        },

        /** 获取聚焦信号 */
        get checkpointFocusSignal() {
            return checkpointFocusSignal;
        },

        /** 触发特定任务的 Checkpoint 输入框聚焦 */
        triggerCheckpointFocus(taskId: string) {
            // 防抖：防止 50ms 内重复触发同一个任务的信号
            if (checkpointFocusSignal &&
                checkpointFocusSignal.taskId === taskId &&
                Date.now() - checkpointFocusSignal.timestamp < 50) {
                console.log(`[Store] Ignored duplicate signal for ${taskId}`);
                return;
            }
            console.log(`[Store] Triggering signal for ${taskId}`);
            checkpointFocusSignal = { taskId, timestamp: Date.now() };
        },

        /** 清除 Checkpoint 聚焦信号（消费后调用） */
        clearCheckpointFocusSignal() {
            checkpointFocusSignal = null;
        },


        /** 获取任务输入框是否展开 */
        get isTaskInputExpanded() {
            return isTaskInputExpanded;
        },

        /** 设置任务输入框是否展开 */
        setTaskInputExpanded(expanded: boolean) {
            isTaskInputExpanded = expanded;
        },

        /** 初始化（从 localStorage 加载） */
        init() {
            if (initialized) return;
            tasks = loadTasks();
            selectedDate = new Date();
            initialized = true;
        },

        /** 设置选中日期 */
        setSelectedDate(date: Date) {
            selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        },

        /** 切换到前一天 */
        goToPreviousDay() {
            const prev = new Date(selectedDate);
            prev.setDate(prev.getDate() - 1);
            selectedDate = prev;
        },

        /** 切换到后一天 */
        goToNextDay() {
            const next = new Date(selectedDate);
            next.setDate(next.getDate() + 1);
            selectedDate = next;
        },

        /** 重置到今天 */
        resetToToday() {
            const today = new Date();
            selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        },

        /** 获取当前进行中的任务 */
        getActiveTask(): Task | undefined {
            return tasks.find(t => t.status === 'active');
        },

        /** 添加新任务（状态为 pending） */
        addTask(input: NewTaskInput): Task {
            const newTask: Task = {
                id: generateId(),
                title: input.title,
                status: 'pending',
                createdAt: new Date(),
                sessions: []
            };

            tasks = [...tasks, newTask];
            saveTasks(tasks);
            return newTask;
        },

        /** 开始任务 */
        startTask(taskId: string): void {
            tasks = tasks.map(task => {
                if (task.id !== taskId) return task;
                if (task.status !== 'pending' && task.status !== 'paused') return task;

                const newSession: WorkSession = {
                    id: generateId(),
                    startTime: new Date(),
                    checkpoints: []
                };

                return {
                    ...task,
                    status: 'active' as const,
                    sessions: [...task.sessions, newSession]
                };
            });
            saveTasks(tasks);
        },

        /** 暂停任务，返回是否丢弃了过短的时段及实际时长（秒） */
        pauseTask(taskId: string): { discarded: boolean, durationSeconds: number } {
            let discarded = false;
            let durationSeconds = 0;

            tasks = tasks.map(task => {
                if (task.id !== taskId) return task;
                if (task.status !== 'active') return task;

                // 找到当前活跃的时段
                const currentSession = task.sessions.find(s => !s.endTime);
                if (!currentSession) return task;

                const durationMs = Date.now() - currentSession.startTime.getTime();
                durationSeconds = Math.floor(durationMs / 1000);

                // 时段太短，丢弃它
                if (durationMs < config.MIN_SESSION_DURATION_MS) {
                    discarded = true;
                    const remainingSessions = task.sessions.filter(s => s.id !== currentSession.id);
                    return {
                        ...task,
                        // 如果没有其他时段了，回到 pending；否则回到 paused
                        status: remainingSessions.length > 0 ? 'paused' as const : 'pending' as const,
                        sessions: remainingSessions
                    };
                }

                // 正常关闭时段
                const updatedSessions = task.sessions.map(session => {
                    if (session.endTime) return session;
                    return { ...session, endTime: new Date() };
                });

                return {
                    ...task,
                    status: 'paused' as const,
                    sessions: updatedSessions
                };
            });
            saveTasks(tasks);
            return { discarded, durationSeconds };
        },

        /** 继续任务（创建新时段） */
        resumeTask(taskId: string): void {
            this.startTask(taskId);
        },

        /** 完成任务 */
        completeTask(taskId: string): void {
            tasks = tasks.map(task => {
                if (task.id !== taskId) return task;

                // 关闭当前时段（如果有）
                const updatedSessions = task.sessions.map(session => {
                    if (session.endTime) return session;
                    return { ...session, endTime: new Date() };
                });

                return {
                    ...task,
                    status: 'completed' as const,
                    completedAt: new Date(),
                    sessions: updatedSessions
                };
            });
            saveTasks(tasks);
        },

        /** 撤回完成状态，回到暂停状态 */
        revertTask(taskId: string): void {
            tasks = tasks.map(task => {
                if (task.id !== taskId) return task;
                if (task.status !== 'completed') return task;

                return {
                    ...task,
                    status: 'paused' as const,
                    completedAt: undefined
                };
            });
            saveTasks(tasks);
        },

        /** 添加 Checkpoint（支持 active 或 paused 状态） */
        addCheckpoint(taskId: string, input: NewCheckpointInput): Checkpoint | null {
            const task = tasks.find(t => t.id === taskId);
            if (!task || (task.status !== 'active' && task.status !== 'paused')) return null;

            const newCheckpoint: Checkpoint = {
                id: generateId(),
                time: new Date(),
                note: input.note
            };

            tasks = tasks.map(t => {
                if (t.id !== taskId) return t;

                // 如果有进行中的时段，添加到进行中的时段；
                // 如果是暂停状态（没有进行中的时段），添加到最后一个时段
                const hasActiveSession = t.sessions.some(s => !s.endTime);

                const updatedSessions = t.sessions.map((session, index) => {
                    if (hasActiveSession) {
                        // 有活跃时段时，只添加到活跃那个
                        if (session.endTime) return session;
                    } else {
                        // 没有活跃时段时（暂停态），添加到最后一个
                        if (index !== t.sessions.length - 1) return session;
                    }

                    return {
                        ...session,
                        checkpoints: [...session.checkpoints, newCheckpoint]
                    };
                });

                return { ...t, sessions: updatedSessions };
            });

            saveTasks(tasks);
            return newCheckpoint;
        },

        /** 更新任务属性 */
        updateTask(taskId: string, updates: Partial<Task>): void {
            tasks = tasks.map(task => {
                if (task.id !== taskId) return task;
                return { ...task, ...updates };
            });
            saveTasks(tasks);
        },

        /** 删除任务 */
        deleteTask(taskId: string): void {
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks(tasks);
        },

        /** 删除 Checkpoint */
        deleteCheckpoint(taskId: string, checkpointId: string): void {
            tasks = tasks.map(task => {
                if (task.id !== taskId) return task;
                return {
                    ...task,
                    sessions: task.sessions.map(session => ({
                        ...session,
                        checkpoints: session.checkpoints.filter(cp => cp.id !== checkpointId)
                    }))
                };
            });
            saveTasks(tasks);
        },

        /** 删除工作时段 */
        deleteSession(taskId: string, sessionId: string): void {
            tasks = tasks.map(task => {
                if (task.id !== taskId) return task;

                const remainingSessions = task.sessions.filter(s => s.id !== sessionId);

                // 更新任务状态
                let newStatus = task.status;
                if (remainingSessions.length === 0) {
                    // 没有时段了，回到 pending
                    newStatus = 'pending';
                } else if (task.status === 'active' && !remainingSessions.some(s => !s.endTime)) {
                    // 如果删除的是进行中的时段，变为 paused
                    newStatus = 'paused';
                }

                return {
                    ...task,
                    status: newStatus,
                    sessions: remainingSessions
                };
            });
            saveTasks(tasks);
        }
    };
}

/** 全局任务 store 实例 */
export const taskStore = createTaskStore();
