export const colors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textTertiary: '#64748B',
  textMuted: '#94A3B8',
  primary: '#2563EB',
  primaryMuted: '#93C5FD',
  chip: '#E2E8F0',
  chipActive: '#2563EB',
  danger: '#B91C1C',
  dangerBackground: '#FEE2E2',
  dangerSurface: '#FEF2F2',
} as const;

export type ColorToken = keyof typeof colors;
