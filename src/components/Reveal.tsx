import type { ReactNode } from 'react'
import { useReveal } from '../hooks/useReveal'

interface RevealProps {
  children: ReactNode
  /** 같은 줄에 여러 개를 놓을 때 순서대로 조금씩 늦게 나타나게 한다(ms). */
  delay?: number
  className?: string
}

/**
 * 스크롤해서 들어오면 살짝 떠오르며 나타나는 래퍼.
 *
 * 동작 줄이기 설정을 켠 사용자에겐 `useReveal`이 즉시 `shown`을 주고,
 * `motion-reduce:` 유틸이 transform·transition까지 걷어낸다.
 */
export default function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const { ref, shown } = useReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={[
        'transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
