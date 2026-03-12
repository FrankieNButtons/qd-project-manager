import type { IndicatorChangeEvent } from './indicator';

export type LogLevel = 'INFO' | 'ALERT' | 'ERROR';

export type MessageStatus = 'unread' | 'read' | 'acknowledged' | 'shared' | 'deleted';

export interface LogMessage {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: '数据更新' | '指标变更' | '系统错误';
  title: string;
  body: string;
  status: MessageStatus;
  alertData?: IndicatorChangeEvent;
}
