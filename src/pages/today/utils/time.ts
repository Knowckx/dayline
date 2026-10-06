/**
 * TimeFlow 时间工具函数
 */

import type { TimeFormatOptions } from '../types/task';

/**
 * 格式化时间为 HH:mm:ss 格式
 */
export function formatTime(date: Date, options: TimeFormatOptions = {}): string {
    const { showSeconds = true, use24Hour = true } = options;

    const hours = use24Hour
        ? date.getHours().toString().padStart(2, '0')
        : (date.getHours() % 12 || 12).toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    let result = `${hours}:${minutes}`;
    if (showSeconds) {
        result += `:${seconds}`;
    }

    if (!use24Hour) {
        result += date.getHours() >= 12 ? ' PM' : ' AM';
    }

    return result;
}

/**
 * 计算两个时间之间的持续时间
 * @returns 格式化的持续时间字符串，如 "01:30:00"
 */
export function calculateDuration(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();

    if (diffMs < 0) return '00:00:00';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
}

/**
 * 格式化持续时间为可读格式
 * @returns 如 "1小时30分钟"
 */
export function formatDurationReadable(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();

    if (diffMs < 0) return '0分钟';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}小时`);
    if (minutes > 0) parts.push(`${minutes}分钟`);

    return parts.length > 0 ? parts.join('') : '不到1分钟';
}

/**
 * 获取当前日期的格式化字符串
 * @returns 如 "2024年5月20日 星期一"
 */
export function formatDate(date: Date): string {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];

    return `${year}年${month}月${day}日 ${weekday}`;
}

/**
 * 判断两个日期是否是同一天
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

/**
 * 获取日期部分（时间归零为 00:00:00）
 */
export function getDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * 日期加减天数
 */
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * 判断日期是否是今天
 */
export function isToday(date: Date): boolean {
    return isSameDay(date, new Date());
}
