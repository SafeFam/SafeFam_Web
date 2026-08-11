import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { IoChevronBack, IoChevronForward } from 'react-icons/io5'
import { scrollBehavior } from '../lib/motion'

export interface IntroSlide {
  key: string
  eyebrow: string
  title: string
  body: string
  visual: ReactNode
}

interface IntroCarouselProps {
  slides: IntroSlide[]
}

/**
 * 서비스 소개 슬라이드.
 *
 * 네이티브 가로 스크롤 + scroll-snap으로 만들었다. 직접 transform을 옮기는
 * 방식보다 터치·트랙패드 제스처가 그대로 살고, 키보드/스크린리더에서도
 * 평범한 스크롤 영역으로 읽힌다.
 *
 * 자동 재생은 넣지 않는다 — 고령 사용자가 읽는 중에 화면이 넘어가면
 * 읽기를 방해한다(§7 전 연령 원칙).
 */
export default function IntroCarousel({ slides }: IntroCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [index, setIndex] = useState(0)

  const scrollToIndex = useCallback((next: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.max(0, Math.min(next, track.children.length - 1))
    const target = track.children[clamped] as HTMLElement | undefined
    if (!target) return
    track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: scrollBehavior() })
  }, [])

  // 스크롤 위치에서 현재 슬라이드를 역산한다(제스처로 넘겨도 점이 따라오게).
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const width = track.clientWidth
        if (width === 0) return
        setIndex(Math.round(track.scrollLeft / width))
      })
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      track.removeEventListener('scroll', onScroll)
    }
  }, [])

  const atStart = index <= 0
  const atEnd = index >= slides.length - 1

  return (
    <div className="relative">
      <div
        ref={trackRef}
        role="group"
        aria-roledescription="캐러셀"
        aria-label="서비스 소개"
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <section
            key={slide.key}
            aria-roledescription="슬라이드"
            aria-label={`${i + 1} / ${slides.length}`}
            className="w-full shrink-0 snap-center rounded-card border border-tint-line bg-surface px-6 py-10 sm:px-10"
          >
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              <div className="shrink-0">{slide.visual}</div>
              <div className="min-w-0">
                <p className="text-section text-blue">{slide.eyebrow}</p>
                <h3 className="mt-2 text-title-lg text-t1">{slide.title}</h3>
                <p className="mt-3 text-body text-t2">{slide.body}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => scrollToIndex(index - 1)}
          disabled={atStart}
          aria-label="이전 슬라이드"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-t2 transition-colors hover:bg-surface disabled:opacity-35 disabled:hover:bg-transparent"
        >
          <IoChevronBack size={20} aria-hidden />
        </button>

        <ul className="flex items-center gap-2">
          {slides.map((slide, i) => (
            <li key={slide.key}>
              <button
                type="button"
                onClick={() => scrollToIndex(i)}
                aria-label={`${i + 1}번째 슬라이드로 이동`}
                aria-current={i === index}
                className={[
                  'block h-2.5 rounded-full transition-all',
                  i === index ? 'w-6 bg-blue' : 'w-2.5 bg-toggle-off hover:bg-blue-light',
                ].join(' ')}
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => scrollToIndex(index + 1)}
          disabled={atEnd}
          aria-label="다음 슬라이드"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-t2 transition-colors hover:bg-surface disabled:opacity-35 disabled:hover:bg-transparent"
        >
          <IoChevronForward size={20} aria-hidden />
        </button>
      </div>
    </div>
  )
}
