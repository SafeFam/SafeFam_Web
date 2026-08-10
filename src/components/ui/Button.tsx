import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** 가로를 꽉 채운다(폼 제출 버튼 등). */
  block?: boolean
  /** 라벨 왼쪽 아이콘. */
  icon?: ReactNode
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-blue text-white hover:bg-blue/90',
  ghost: 'bg-white text-t1 border-[1.5px] border-line hover:bg-surface',
  danger: 'bg-high text-white hover:bg-high/90',
}

/**
 * 앱(`SfButton`)과 같은 규격의 버튼 — 반경 14 · 세로 패딩 16 · 글자 17/700.
 *
 * 전 연령 대상이라 버튼 글자를 17 아래로 내리지 않는다. 크기를 줄여야 하는
 * 자리에는 이 컴포넌트 대신 텍스트 버튼을 쓴다.
 */
export default function Button({
  variant = 'primary',
  block = false,
  icon,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-button px-5 py-4 text-button transition-colors',
        VARIANT_CLASS[variant],
        block ? 'w-full' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
