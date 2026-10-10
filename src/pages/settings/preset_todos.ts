import type { TodoCreateInput } from '@/lib/todos/todo';

/** 设置页注入的待办配置表，按当前创建字段直接修改或追加条目。 */
export const presetTodos: TodoCreateInput[] = [
	{
		title: '盈立收50',
		body: '',
		scheduledDate: ['2026-10-02'],
		scheduledTime: '00:00',
		type_int: 23,
		additional: ''
	},
	{
		title: '信用卡还款',
		body: '',
		scheduledDate: ['2026-10-10'],
		scheduledTime: '00:00',
		type_int: 23,
		additional: ''
	},
	{
		title: '月末:广发返利金、香港券商交易',
		body: '',
		scheduledDate: ['2026-10-28'],
		scheduledTime: '00:00',
		type_int: 23,
		additional: ''
	},
	{
		title: '补维A',
		body: '',
		scheduledDate: ['2026-10-01', '2026-10-16'],
		scheduledTime: '00:00',
		type_int: 23,
		additional: ''
	},
	{
		title: '补维D',
		body: '',
		scheduledDate: ['2026-10-01', '2026-10-06', '2026-10-11', '2026-10-16', '2026-10-21', '2026-10-26'],
		scheduledTime: '00:00',
		type_int: 23,
		additional: ''
	},
];
