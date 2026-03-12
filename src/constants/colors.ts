export const Colors = {
  primary: '#1677FF',
  primaryLight: '#E6F4FF',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: '#E8E8E8',
  error: '#FF4D4F',
  success: '#52C41A',
  warning: '#FAAD14',
  tabBar: '#FFFFFF',
  tabBarInactive: '#999999',
};

/** Distinct colors for up to 10 indicators */
export const INDICATOR_COLORS = [
  '#1677FF', // blue
  '#52C41A', // green
  '#FAAD14', // amber
  '#FF4D4F', // red
  '#722ED1', // purple
  '#13C2C2', // cyan
  '#EB2F96', // magenta
  '#FA8C16', // orange
  '#2F54EB', // geek blue
  '#A0D911', // lime
];

export function getIndicatorColor(index: number): string {
  return INDICATOR_COLORS[index % INDICATOR_COLORS.length];
}
