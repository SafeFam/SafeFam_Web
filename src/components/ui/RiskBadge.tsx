import { RISK_META } from './risk'
import type { UiRiskLevel } from './risk'

interface RiskBadgeProps {
  level: UiRiskLevel
  className?: string
}

/**
 * 위험도 뱃지 — 색 + 아이콘 + 글자를 항상 함께 보여준다(`risk.ts` 주석 참고).
 */
export default function RiskBadge({ level, className = '' }: RiskBadgeProps) {
  const { label, badge, Icon } = RISK_META[level]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-badge px-3 py-1 text-section ${badge} ${className}`}
    >
      <Icon size={15} aria-hidden />
      {label}
    </span>
  )
}
