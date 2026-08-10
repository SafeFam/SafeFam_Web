import type { HTMLAttributes } from 'react'

export type CardKind = 'plain' | 'tint' | 'danger'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  kind?: CardKind
}

const KIND_CLASS: Record<CardKind, string> = {
  plain: 'bg-white border-line',
  tint: 'bg-surface border-tint-line',
  danger: 'bg-high-bg border-high-line',
}

/** 앱(`SfCard`)과 같은 규격의 카드 — 반경 16 · 1px 테두리. */
export default function Card({
  kind = 'plain',
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-card border p-4 ${KIND_CLASS[kind]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
