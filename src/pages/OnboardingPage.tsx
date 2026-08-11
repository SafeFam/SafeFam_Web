import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoCallOutline,
  IoChatbubbleEllipsesOutline,
  IoClipboardOutline,
  IoLinkOutline,
  IoPeopleOutline,
  IoPulseOutline,
  IoScanOutline,
  IoShieldCheckmarkOutline,
  IoTextOutline,
} from 'react-icons/io5'
import logo from '../assets/logo.png'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import RiskBadge from '../components/ui/RiskBadge'
import SectionLabel from '../components/ui/SectionLabel'
import Reveal from '../components/Reveal'
import IntroCarousel from '../components/IntroCarousel'
import type { IntroSlide } from '../components/IntroCarousel'
import type { UiRiskLevel } from '../components/ui/risk'
import { scrollBehavior } from '../lib/motion'
import { useAuth } from '../hooks/useAuth'

/** 캐릭터를 원에 담는 앱 `CharacterDisc` 규격. */
function CharacterDisc({ size = 96 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full bg-char-disc"
      style={{ width: size, height: size }}
    >
      <img src={logo} alt="" className="h-full w-full object-cover" />
    </div>
  )
}

function SlideIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg text-blue">
      {children}
    </div>
  )
}

const SLIDES: IntroSlide[] = [
  {
    key: 'paste',
    eyebrow: '1. 붙여넣기',
    title: '받은 문자를 그대로 넣으세요',
    body: '의심스러운 문자를 복사해 붙여넣기만 하면 됩니다. 앱을 설치하거나 따로 설정할 것도 없습니다.',
    visual: (
      <SlideIcon>
        <IoClipboardOutline size={36} aria-hidden />
      </SlideIcon>
    ),
  },
  {
    key: 'analyze',
    eyebrow: '2. AI 3중 분석',
    title: '세 가지 눈으로 함께 봅니다',
    body: '문맥·링크·글자 패턴을 각각 따로 검사한 뒤 하나의 점수로 모읍니다. 한 가지 방식만 쓰는 검사보다 놓치는 게 적습니다.',
    visual: (
      <SlideIcon>
        <IoPulseOutline size={36} aria-hidden />
      </SlideIcon>
    ),
  },
  {
    key: 'act',
    eyebrow: '3. 대응 안내',
    title: '무엇을 해야 하는지까지',
    body: '위험도만 알려주고 끝내지 않습니다. 이미 송금했는지에 따라 지급정지·신고처 안내까지 이어집니다.',
    visual: (
      <SlideIcon>
        <IoShieldCheckmarkOutline size={36} aria-hidden />
      </SlideIcon>
    ),
  },
  {
    key: 'family',
    eyebrow: '4. 가족과 함께',
    title: '혼자 판단하지 않아도 됩니다',
    body: '가족을 연결해 두면 위험한 문자를 받았을 때 알림이 함께 갑니다. 전화 걸기·안전 확인까지 한 화면에서 할 수 있습니다.',
    visual: (
      <SlideIcon>
        <IoPeopleOutline size={36} aria-hidden />
      </SlideIcon>
    ),
  },
]

const LAYERS: {
  key: string
  weight: string
  title: string
  body: string
  Icon: typeof IoTextOutline
}[] = [
  {
    key: 'context',
    weight: '50%',
    title: '문맥 분석',
    body: '어떤 말투로 무엇을 요구하는지, 어디를 사칭하는지 AI가 읽습니다.',
    Icon: IoChatbubbleEllipsesOutline,
  },
  {
    key: 'link',
    weight: '30%',
    title: '링크 보안',
    body: '단축 URL을 끝까지 따라가 실제 도착지를 확인하고, 백신 엔진 90개로 대조합니다.',
    Icon: IoLinkOutline,
  },
  {
    key: 'pattern',
    weight: '20%',
    title: '글자 패턴',
    body: '금융기관 이름과 사기 문구 패턴을 대조합니다. 계좌·카드번호가 섞여 있으면 따로 짚어 줍니다.',
    Icon: IoTextOutline,
  },
]

const RISK_GUIDE: { level: UiRiskLevel; title: string; body: string }[] = [
  { level: 'high', title: '바로 멈추세요', body: '링크를 누르지 말고, 이미 송금했다면 지급정지부터 안내합니다.' },
  { level: 'med', title: '확인이 필요해요', body: '기관 공식 번호로 직접 걸어 사실인지 확인하도록 안내합니다.' },
  { level: 'low', title: '위험 신호가 없어요', body: '그래도 돈을 보내라는 요구가 있으면 한 번 더 확인하세요.' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const introRef = useRef<HTMLDivElement | null>(null)

  const scrollToIntro = () => {
    introRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
  }

  return (
    <main>
      {/* ── 히어로 ───────────────────────────────── */}
      <section className="bg-bg">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-24">
          <Reveal>
            <div className="flex justify-center">
              <CharacterDisc size={120} />
            </div>
            <p className="mt-6 text-section text-blue">우리 가족 금융 지킴이</p>
            <h1 className="mt-3 text-logo text-t1 sm:text-[40px] sm:leading-tight">
              이 문자, 사기일까요?
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-body text-t2">
              스미싱·보이스피싱 문자를 넣으면 세이프팸이 위험도를 알려주고,
              무엇을 해야 하는지까지 안내합니다. 위험하면 가족에게도 함께 알립니다.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {isLoggedIn ? (
                <Button onClick={() => navigate('/home')} className="w-full sm:w-auto">
                  홈으로 가기
                </Button>
              ) : (
                <Button onClick={() => navigate('/login')} className="w-full sm:w-auto">
                  로그인하고 시작하기
                </Button>
              )}
              <Button variant="ghost" onClick={scrollToIntro} className="w-full sm:w-auto">
                서비스 둘러보기
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 서비스 소개 슬라이드 ──────────────────── */}
      <section ref={introRef} className="scroll-mt-16">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <Reveal>
            <SectionLabel>어떻게 쓰나요</SectionLabel>
            <h2 className="mt-2 text-title-lg text-t1">넣고, 보고, 대응하기</h2>
          </Reveal>
          <Reveal delay={100} className="mt-6">
            <IntroCarousel slides={SLIDES} />
          </Reveal>
        </div>
      </section>

      {/* ── 3중 스코어링 ─────────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <Reveal>
            <SectionLabel>분석 방식</SectionLabel>
            <h2 className="mt-2 text-title-lg text-t1">세 겹으로 나눠 봅니다</h2>
            <p className="mt-3 text-body text-t2">
              결과 화면에서는 각 항목이 점수에 얼마나 기여했는지 그대로 보여줍니다.
              왜 위험한지 근거를 확인할 수 있습니다.
            </p>
          </Reveal>

          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {LAYERS.map((layer, i) => (
              <li key={layer.key}>
                <Reveal delay={i * 110}>
                  <Card className="h-full">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bg text-blue">
                        <layer.Icon size={22} aria-hidden />
                      </span>
                      <span className="text-title-screen text-blue">{layer.weight}</span>
                    </div>
                    <h3 className="mt-4 text-body-strong text-t1">{layer.title}</h3>
                    <p className="mt-2 text-caption text-t2">{layer.body}</p>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 위험도 표기 ──────────────────────────── */}
      <section>
        <div className="mx-auto max-w-3xl px-6 py-16">
          <Reveal>
            <SectionLabel>결과 보는 법</SectionLabel>
            <h2 className="mt-2 text-title-lg text-t1">세 단계로 알려드립니다</h2>
            <p className="mt-3 text-body text-t2">
              색만으로 구분하지 않습니다. 색·아이콘·글자를 항상 함께 써서
              색을 구분하기 어려운 분도 바로 알아볼 수 있게 했습니다.
            </p>
          </Reveal>

          <ul className="mt-8 space-y-3">
            {RISK_GUIDE.map((item, i) => (
              <li key={item.level}>
                <Reveal delay={i * 90}>
                  <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                    <div className="shrink-0">
                      <RiskBadge level={item.level} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-strong text-t1">{item.title}</p>
                      <p className="mt-1 text-caption text-t2">{item.body}</p>
                    </div>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 가족·긴급 연락 ───────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="grid gap-4 sm:grid-cols-2">
            <Reveal>
              <Card className="h-full">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bg text-blue">
                  <IoPeopleOutline size={22} aria-hidden />
                </span>
                <h3 className="mt-4 text-title-screen text-t1">가족 공동 대응</h3>
                <p className="mt-2 text-body text-t2">
                  초대 코드나 QR로 가족을 연결하면, 위험한 문자를 받았을 때
                  보호자에게 알림이 갑니다. 바로 전화를 걸거나 안전한지 확인할 수 있습니다.
                </p>
              </Card>
            </Reveal>
            <Reveal delay={110}>
              <Card className="h-full">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bg text-blue">
                  <IoCallOutline size={22} aria-hidden />
                </span>
                <h3 className="mt-4 text-title-screen text-t1">신고처 바로 연결</h3>
                <p className="mt-2 text-body text-t2">
                  금융감독원 1332, 경찰 112, 거래 은행 고객센터로 한 번에 연결됩니다.
                  당황한 상황에서 번호를 찾지 않아도 됩니다.
                </p>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 마무리 CTA ───────────────────────────── */}
      <section>
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <Reveal>
            <div className="flex justify-center">
              <CharacterDisc size={80} />
            </div>
            <h2 className="mt-6 text-title-lg text-t1">지금 바로 확인해 보세요</h2>
            <p className="mx-auto mt-3 max-w-md text-body text-t2">
              의심스러운 문자 하나면 충분합니다. 확인은 몇 초, 피해는 되돌리기 어렵습니다.
            </p>
            <div className="mt-8 flex justify-center">
              {isLoggedIn ? (
                <Button
                  onClick={() => navigate('/home')}
                  icon={<IoScanOutline size={20} aria-hidden />}
                >
                  문자 검사하러 가기
                </Button>
              ) : (
                <Button onClick={() => navigate('/login')}>로그인하고 시작하기</Button>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
