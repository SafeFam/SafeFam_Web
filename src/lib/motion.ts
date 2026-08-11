/**
 * 사용자가 OS에서 '동작 줄이기'를 켰는지.
 *
 * 전 연령 대상이라 어지럼증을 유발할 수 있는 연출을 강제하지 않는다.
 * CSS는 `motion-reduce:` 유틸로 처리되지만, **JS로 직접 굴리는 움직임**
 * (`scrollTo`·`scrollIntoView`의 `behavior: 'smooth'` 등)은 이 설정을
 * 자동으로 따르지 않으므로 여기서 직접 확인해야 한다.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/** 프로그램적 스크롤에 쓸 동작. 동작 줄이기를 켰으면 애니메이션 없이 즉시 이동한다. */
export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth'
}
