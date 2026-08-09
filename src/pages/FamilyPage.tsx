import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoCopyOutline, IoTrashOutline } from 'react-icons/io5'

type RiskLevel = 'high' | 'med' | 'low'
type InputType = 'url' | 'email'
type FeedbackType = 'correct' | 'safe' | 'dangerous'

interface Evidence {
  id: string
  title: string
  description: string
}

interface HistoryItem {
  id: string
  date: string
  inputType: InputType
  riskLevel: RiskLevel
  resultSummary: string
  evidences: Evidence[]
  response: string[]
}

interface FamilyMember {
  id: string
  name: string
  relation: string
  phone: string
  riskLevel: RiskLevel | null
  history: HistoryItem[]
}

const RISK_META: Record<RiskLevel, { label: string; badge: string; box: string }> = {
  high: {
    label: '위험',
    badge: 'bg-high text-white',
    box: 'bg-high-bg border-high-line text-high-text',
  },
  med: {
    label: '주의',
    badge: 'bg-med text-white',
    box: 'bg-med/10 border-med/30 text-med-text',
  },
  low: {
    label: '안전',
    badge: 'bg-low text-white',
    box: 'bg-low/10 border-low/30 text-t1',
  },
}

// TODO: API 연동 시 실제 가족 목록 요청으로 교체 — GET /api/v1/family/members
const INITIAL_MEMBERS: FamilyMember[] = [
  {
    id: 'm1',
    name: '김영희',
    relation: '어머니',
    phone: '010-1234-5678',
    riskLevel: 'high',
    history: [
      {
        id: 'm1-h1',
        date: '2026-08-08',
        inputType: 'url',
        riskLevel: 'high',
        resultSummary: '피싱 의심 사이트 및 개인정보 탈취 시도가 감지되었습니다.',
        evidences: [
          { id: 'e1', title: '의심 도메인', description: '공식 도메인과 유사한 위장 주소를 사용하고 있습니다.' },
          { id: 'e2', title: '긴급성 유도 문구', description: '"즉시", "지금 바로" 등 조급함을 유발하는 표현이 포함되어 있습니다.' },
        ],
        response: ['발신자와 안내 내용을 공식 앱에서 한 번 더 확인하세요.', '링크를 클릭하지 마세요.'],
      },
      {
        id: 'm1-h2',
        date: '2026-07-20',
        inputType: 'email',
        riskLevel: 'low',
        resultSummary: '위험 요소가 발견되지 않았습니다.',
        evidences: [],
        response: [],
      },
    ],
  },
  {
    id: 'm2',
    name: '김철수',
    relation: '아버지',
    phone: '010-9876-5432',
    riskLevel: 'med',
    history: [
      {
        id: 'm2-h1',
        date: '2026-08-05',
        inputType: 'email',
        riskLevel: 'med',
        resultSummary: '일부 의심 요소가 발견되었습니다. 주의가 필요합니다.',
        evidences: [
          { id: 'e1', title: '의심 링크', description: '본문 내 URL이 공식 사이트와 다릅니다.' },
        ],
        response: ['공식 홈페이지에서 직접 확인하세요.'],
      },
    ],
  },
  {
    id: 'm3',
    name: '김민지',
    relation: '동생',
    phone: '010-5555-1212',
    riskLevel: 'low',
    history: [
      {
        id: 'm3-h1',
        date: '2026-07-30',
        inputType: 'email',
        riskLevel: 'low',
        resultSummary: '위험 요소가 발견되지 않았습니다.',
        evidences: [],
        response: [],
      },
    ],
  },
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function maskPhone(phone: string): string {
  const parts = phone.split('-')
  if (parts.length === 3) return `${parts[0]}-****-${parts[2]}`
  return phone
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function buildQrMatrix(seed: string, size = 9): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => hashCode(`${seed}-${r}-${c}`) % 3 === 0)
  )
  const applyFinder = (row0: number, col0: number) => {
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++)
        matrix[row0 + r][col0 + c] = !(r === 1 && c === 1)
  }
  applyFinder(0, 0)
  applyFinder(0, size - 3)
  applyFinder(size - 3, 0)
  return matrix
}

export default function FamilyPage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<FamilyMember[]>(INITIAL_MEMBERS)
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null)
  const [feedback, setFeedback] = useState<FeedbackType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FamilyMember | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerateInvite = () => {
    // TODO: API 연동 시 실제 초대 코드 발급 요청으로 교체 — POST /api/v1/family/invite
    setInviteCode(generateInviteCode())
    setCopied(false)
  }

  const handleCopyCode = async () => {
    if (!inviteCode) return
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const handleDeleteMember = (id: string) => {
    // TODO: API 연동 시 실제 삭제 요청으로 교체 — DELETE /api/v1/family/{linkId}
    setMembers((prev) => prev.filter((m) => m.id !== id))
    if (selectedMember?.id === id) setSelectedMember(null)
    setDeleteTarget(null)
  }

  const handleFeedback = (type: FeedbackType) => {
    setFeedback(type)
    // TODO: API 연동 — POST /api/v1/analyses/{analysisId}/feedback
  }

  const goToChat = () => {
    setSelectedHistoryItem(null)
    setSelectedMember(null)
    navigate('/chat')
  }

  return (
    <div className="min-h-screen bg-white px-5 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-bold text-t1">가족 관리</h1>
        <p className="text-sm text-t2 mt-1">가족을 초대하고 탐지 이력을 함께 확인하세요.</p>
      </header>

      <section className="bg-surface rounded-2xl border border-line p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-t1">초대 코드</span>
          <button
            onClick={handleGenerateInvite}
            className="text-xs font-semibold text-blue px-3 py-1.5 rounded-full border border-blue"
          >
            {inviteCode ? '코드 재발급' : '초대 코드 생성'}
          </button>
        </div>
        {inviteCode && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-full flex items-center justify-between bg-white rounded-xl border border-line px-4 py-3">
              <span className="text-lg font-bold tracking-[0.3em] text-t1">{inviteCode}</span>
              <button onClick={handleCopyCode} className="flex items-center gap-1 text-xs font-semibold text-blue">
                <IoCopyOutline size={14} />
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
            <svg
              viewBox="0 0 9 9"
              shapeRendering="crispEdges"
              className="w-32 h-32 bg-white rounded-xl border border-line p-2"
              role="img"
              aria-label={`초대 코드 ${inviteCode} QR 코드`}
            >
              {buildQrMatrix(inviteCode).map((row, r) =>
                row.map((filled, c) =>
                  filled ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#1B2640" /> : null
                )
              )}
            </svg>
            <p className="text-xs text-t3 text-center">QR을 스캔하거나 코드를 공유해 가족을 초대하세요</p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-t1">가족 구성원</span>
        <div className="flex flex-col gap-2">
          {members.length === 0 && (
            <div className="bg-surface rounded-2xl border border-line p-6 text-center text-sm text-t3">
              등록된 가족 구성원이 없습니다.
            </div>
          )}
          {members.map((member) => (
            <div key={member.id} className="bg-surface rounded-2xl border border-line p-4 flex items-center gap-3">
              <button
                onClick={() => setSelectedMember(member)}
                className="flex-1 flex items-center gap-3 text-left min-w-0"
              >
                <span className="w-10 h-10 shrink-0 rounded-full bg-char-disc text-blue font-bold flex items-center justify-center">
                  {member.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-t1 truncate">
                    {member.name} <span className="text-xs text-t3 font-normal">· {member.relation}</span>
                  </p>
                  <p className="text-xs text-t2 mt-0.5">{maskPhone(member.phone)}</p>
                </div>
                {member.riskLevel ? (
                  <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${RISK_META[member.riskLevel].badge}`}>
                    {RISK_META[member.riskLevel].label}
                  </span>
                ) : (
                  <span className="shrink-0 text-xs font-semibold px-3 py-1 rounded-full bg-track text-t3">
                    기록 없음
                  </span>
                )}
              </button>
              <button
                onClick={() => setDeleteTarget(member)}
                aria-label={`${member.name} 삭제`}
                className="shrink-0 text-t3 p-1"
              >
                <IoTrashOutline size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {selectedMember && (
        <div
          className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center px-5"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="w-full max-w-sm max-h-[80vh] overflow-y-auto bg-white rounded-2xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-t1">{selectedMember.name}</p>
                <p className="text-xs text-t2 mt-0.5">{maskPhone(selectedMember.phone)} · 탐지 이력</p>
              </div>
              <button onClick={() => setSelectedMember(null)} className="text-t3 text-sm font-bold px-2" aria-label="닫기">✕</button>
            </div>
            <div className="flex flex-col gap-2">
              {selectedMember.history.length === 0 && (
                <div className="bg-surface rounded-2xl border border-line p-6 text-center text-sm text-t3">
                  아직 탐지 이력이 없습니다.
                </div>
              )}
              {selectedMember.history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedHistoryItem(item); setFeedback(null) }}
                  className="text-left bg-surface rounded-2xl border border-line p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-t3">{formatDate(item.date)}</span>
                      <span className="text-xs text-t3">·</span>
                      <span className="text-xs text-t3">{item.inputType === 'url' ? 'URL' : '텍스트'}</span>
                    </div>
                    <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${RISK_META[item.riskLevel].badge}`}>
                      {RISK_META[item.riskLevel].label}
                    </span>
                  </div>
                  <p className="text-sm text-t1 line-clamp-2">{item.resultSummary}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedHistoryItem && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-5"
          onClick={() => setSelectedHistoryItem(null)}
        >
          <div
            className="w-full max-w-sm max-h-[80vh] overflow-y-auto bg-white rounded-2xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-t3">{formatDate(selectedHistoryItem.date)}</span>
                <span className="text-xs text-t3">·</span>
                <span className="text-xs text-t3">{selectedHistoryItem.inputType === 'url' ? 'URL' : '텍스트'}</span>
              </div>
              <button onClick={() => setSelectedHistoryItem(null)} className="text-t3 text-sm font-bold px-2" aria-label="닫기">✕</button>
            </div>

            <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${RISK_META[selectedHistoryItem.riskLevel].box}`}>
              <div className="flex items-center gap-2">
                <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${RISK_META[selectedHistoryItem.riskLevel].badge}`}>
                  {RISK_META[selectedHistoryItem.riskLevel].label}
                </span>
                <span className="text-sm font-semibold">{selectedHistoryItem.resultSummary}</span>
              </div>
              {selectedHistoryItem.evidences.length > 0 && (
                <div className="flex flex-col gap-2">
                  {selectedHistoryItem.evidences.map((evidence) => (
                    <div key={evidence.id} className="bg-white/70 rounded-xl border border-line p-3">
                      <p className="text-sm font-semibold text-t1">{evidence.title}</p>
                      <p className="text-xs text-t2 mt-1">{evidence.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedHistoryItem.response.length > 0 && (
              <div className="bg-high-bg border border-high-line rounded-2xl p-4 flex flex-col gap-2">
                <p className="text-sm font-bold text-high-text">이렇게 대응하세요</p>
                {selectedHistoryItem.response.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-high mt-0.5">✓</span>
                    <p className="text-sm text-t1">{r}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-t1">이 분석이 정확했나요?</p>
              <p className="text-xs text-t2">알려주시면 탐지 정확도를 높이는 데 써요.</p>
              <div className="flex gap-2 flex-wrap">
                {([
                  { type: 'correct' as FeedbackType, label: '정확해요' },
                  { type: 'safe' as FeedbackType, label: '실제로는 안전했어요' },
                  { type: 'dangerous' as FeedbackType, label: '실제로는 위험했어요' },
                ]).map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => handleFeedback(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      feedback === type ? 'bg-blue text-white border-blue' : 'bg-white text-t2 border-line'
                    }`}
                  >
                    {feedback === type ? '✓ ' : ''}{label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={goToChat}
              className="w-full py-3 bg-blue text-white font-bold rounded-xl"
            >
              대응 방법 물어보기
            </button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-5"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-2xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-t1">{deleteTarget.name}님을 가족 목록에서 삭제할까요?</p>
            <p className="text-xs text-t2">삭제하면 탐지 이력도 함께 사라져요.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-line text-t2 font-semibold text-sm"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteMember(deleteTarget.id)}
                className="flex-1 py-2.5 rounded-xl bg-high text-white font-semibold text-sm"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}