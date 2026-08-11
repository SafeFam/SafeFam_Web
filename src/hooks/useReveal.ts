import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion'

/**
 * 애니메이션을 건너뛰고 처음부터 보여야 하는 상황인지.
 *
 * 동작 줄이기를 켰으면 움직임 없이 즉시 보여준다. IntersectionObserver가
 * 없는 환경에서도 내용이 안 보이는 일은 없어야 하므로 같이 걸러낸다.
 */
function shouldSkipAnimation(): boolean {
  if (typeof window === 'undefined') return true
  if (typeof IntersectionObserver === 'undefined') return true
  return prefersReducedMotion()
}

/**
 * 화면에 들어올 때 한 번만 켜지는 스크롤 리빌 플래그.
 *
 * 랜딩(온보딩)에서 섹션이 올라오며 나타나는 효과에 쓴다. 한 번 보이면
 * 관찰을 끊어서, 위아래로 스크롤할 때 요소가 다시 사라졌다 나타나지 않는다.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null)
  // 렌더 시점에 한 번만 판정한다. 효과 안에서 setState하면 렌더가 한 번 더 돈다.
  const [skip] = useState(shouldSkipAnimation)
  const [shown, setShown] = useState(skip)

  useEffect(() => {
    if (skip) return

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true)
          observer.disconnect()
        }
      },
      // 요소가 조금 올라온 뒤에 켜야 자연스럽다.
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [skip])

  return { ref, shown }
}
