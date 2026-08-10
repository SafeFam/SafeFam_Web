import type { ReactNode } from 'react'

/** 섹션 구분 라벨 — 13/600, 앱 `SectionLabel`과 같은 규격. */
export default function SectionLabel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={`text-section text-t2 ${className}`}>{children}</p>
  )
}
