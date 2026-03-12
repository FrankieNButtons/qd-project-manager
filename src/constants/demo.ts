import type { SheetData } from '../types/sheet';

export const WEB_DEMO_DOC_ID = 'DEMO123';
export const WEB_DEMO_TAB_ID = 'demo';
export const WEB_DEMO_URL = `https://docs.qq.com/sheet/${WEB_DEMO_DOC_ID}?tab=${WEB_DEMO_TAB_ID}`;

export const WEB_DEMO_DOC_ID_2 = 'DEMO456';
export const WEB_DEMO_TAB_ID_2 = 'demo2';
export const WEB_DEMO_URL_2 = `https://docs.qq.com/sheet/${WEB_DEMO_DOC_ID_2}?tab=${WEB_DEMO_TAB_ID_2}`;

export const WEB_DEMO_SHEET: SheetData = {
  title: 'Web演示项目进度',
  textLabels: [
    '指标名',
    '阶段目标',
    '2026-02-24',
    '2026-02-25',
    '2026-02-26',
    '2026-02-27',
    '2026-02-28',
  ],
  doubles: [],
  table: [
    ['指标名', '阶段目标', '2026-02-24', '2026-02-25', '2026-02-26', '2026-02-27', '2026-02-28'],
    ['需求完成数', 30, 12, 15, 18, 20, 24],
    ['缺陷关闭数', 20, 9, 10, 12, 13, 16],
    ['整体进度(%)', 100, 78, 81, 84, 88, 91],
  ],
  maxRow: 3,
  maxCol: 6,
};

export const WEB_DEMO_SHEET_2: SheetData = {
  title: 'Web演示项目进度B',
  textLabels: [
    '指标名',
    '阶段目标',
    '2026-02-24',
    '2026-02-25',
    '2026-02-26',
    '2026-02-27',
    '2026-02-28',
  ],
  doubles: [],
  table: [
    ['指标名', '阶段目标', '2026-02-24', '2026-02-25', '2026-02-26', '2026-02-27', '2026-02-28'],
    ['需求完成数', 30, 10, 14, 16, 19, 22],
    ['缺陷关闭数', 20, 7, 9, 11, 14, 18],
    ['整体进度(%)', 100, 70, 75, 80, 85, 89],
  ],
  maxRow: 3,
  maxCol: 6,
};
