import { IoAlertCircle, IoCheckmarkCircle, IoWarning } from 'react-icons/io5'
import type { RiskLevel } from '../../api/analyses'

export type UiRiskLevel = 'high' | 'med' | 'low'

export const RISK_LEVEL_MAP: Record<RiskLevel, UiRiskLevel> = {
  HIGH: 'high',
  MEDIUM: 'med',
  LOW: 'low',
}

/**
 * 위험도 표기 규격.
 *
 * ★앱과 공유하는 원칙: **색 + 아이콘 + 글자 3종을 항상 함께** 쓴다.
 * 색약이거나 시력이 낮은 사용자는 색만으로 구분하지 못하므로 어느 하나도 빼지 않는다.
 */
export const RISK_META: Record<
  UiRiskLevel,
  { label: string; badge: string; box: string; Icon: typeof IoWarning }
> = {
  high: {
    label: '위험',
    badge: 'bg-high text-white',
    box: 'bg-high-bg border-high-line text-high-text',
    Icon: IoWarning,
  },
  med: {
    label: '주의',
    badge: 'bg-med text-white',
    box: 'bg-med/10 border-med/30 text-med-text',
    Icon: IoAlertCircle,
  },
  low: {
    label: '안전',
    badge: 'bg-low text-white',
    box: 'bg-low/10 border-low/30 text-t1',
    Icon: IoCheckmarkCircle,
  },
}
