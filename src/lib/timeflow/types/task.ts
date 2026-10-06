/**
 * TimeFlow Core Types
 * 核心数据类型定义
 */

/** 任务状态 */
export type TaskStatus = 'pending' | 'active' | 'paused' | 'completed';

/** Checkpoint - 任务中间记录点 */
export interface Checkpoint {
    id: string;
    time: Date;
    note: string;
}

/** 工作时段 */
export interface WorkSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    checkpoints: Checkpoint[];
}

/** Task - 任务 */
export interface Task {
    id: string;
    title: string;
    status: TaskStatus;
    createdAt: Date;
    completedAt?: Date;
    sessions: WorkSession[];
}

/** 用于创建新任务的输入类型 */
export type NewTaskInput = Pick<Task, 'title'>;

/** 用于创建新 Checkpoint 的输入类型 */
export type NewCheckpointInput = Pick<Checkpoint, 'note'>;

/** 时间格式化选项 */
export interface TimeFormatOptions {
    showSeconds?: boolean;
    use24Hour?: boolean;
}
