import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoCopyOutline, IoPencilOutline, IoTrashOutline } from 'react-icons/io5'
import {
  deleteFamilyMember,
  getFamilyMembers,
  getFamilyWardLogs,
  patchFamilyMember,
  postFamilyInvite,
} from '../api/family'
import type { FamilyInvite, FamilyLogItem, FamilyMember } from '../api/family'
import type { PhishingCategory, RiskLevel } from '../api/analyses'

type UiRiskLevel = 'high' | 'med' | 'low'

const PAGE_SIZE = 20

const RISK_META: Record<UiRiskLevel, { label: string; badge: string; box: string }> = {
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

const RISK_LEVEL_MAP: Record<RiskLevel, UiRiskLevel> = { HIGH: 'high', MEDIUM: 'med', LOW: 'low' }

const CATEGORY_LABEL: Record<PhishingCategory, string> = {
  FINANCIAL_INSTITUTION: '금융기관 사칭',
  GOVERNMENT_AGENCY: '정부기관 사칭',
  LOAN: '대출 사기',
  JOB: '일자리 사기',
  DELIVERY: '택배 사칭',
  MESSENGER: '메신저 사칭',
  OTHER: '기타',
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '날짜 없음'
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return `${year}.${month}.${day}`
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 7) return phone
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`
}

function memberDisplayName(member: FamilyMember): string {
  return member.wardNickname ?? maskPhone(member.wardPhone)
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

  const [members, setMembers] = useState<FamilyMember[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [memberRisk, setMemberRisk] = useState<Record<number, UiRiskLevel | null>>({})

  const [invite, setInvite] = useState<FamilyInvite | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [historyItems, setHistoryItems] = useState<FamilyLogItem[]>([])
  const [historyPage, setHistoryPage] = useState(0)
  const [historyLast, setHistoryLast] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyLoadMoreError, setHistoryLoadMoreError] = useState<string | null>(null)

  const [selectedLogItem, setSelectedLogItem] = useState<FamilyLogItem | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<FamilyMember | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [editTarget, setEditTarget] = useState<FamilyMember | null>(null)
  const [relationInput, setRelationInput] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setMembersLoading(true)
    setMembersError(null)
    getFamilyMembers()
      .then((list) => {
        if (!active) return
        setMembers(list)
        list.forEach((member) => {
          getFamilyWardLogs(member.wardId, { page: 0, size: 1 })
            .then((res) => {
              if (!active) return
              const latest = res.content[0]
              setMemberRisk((prev) => ({
                ...prev,
                [member.linkId]: latest?.riskLevel ? RISK_LEVEL_MAP[latest.riskLevel] : null,
              }))
            })
            .catch(() => {})
        })
      })
      .catch(() => { if (active) setMembersError('가족 목록을 불러오지 못했습니다.') })
      .finally(() => { if (active) setMembersLoading(false) })
    return () => { active = false }
  }, [])

  const handleGenerateInvite = async () => {
    setInviteLoading(true)
    setInviteError(null)
    setCopied(false)
    try {
      const result = await postFamilyInvite()
      setInvite(result)
    } catch {
      setInviteError('초대 코드를 발급하지 못했습니다.')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleCopyCode = async () => {
    if (!invite) return
    try {
      await navigator.clipboard.writeText(invite.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const openMemberHistory = async (member: FamilyMember) => {
    setSelectedMember(member)
    setHistoryItems([])
    setHistoryError(null)
    setHistoryLoadMoreError(null)
    setHistoryLoading(true)
    try {
      const res = await getFamilyWardLogs(member.wardId, { page: 0, size: PAGE_SIZE })
      setHistoryItems(res.content)
      setHistoryLast(res.last)
      setHistoryPage(0)
    } catch {
      setHistoryError('탐지 이력을 불러오지 못했습니다.')
    } finally {
      setHistoryLoading(false)
    }
  }

  const closeMemberHistory = () => {
    setSelectedMember(null)
    setHistoryItems([])
    setHistoryError(null)
    setHistoryLoadMoreError(null)
    setHistoryPage(0)
    setHistoryLast(true)
  }

  const handleLoadMoreHistory = async () => {
    if (!selectedMember || historyLoadingMore || historyLast) return
    setHistoryLoadingMore(true)
    setHistoryLoadMoreError(null)
    try {
      const nextPage = historyPage + 1
      const res = await getFamilyWardLogs(selectedMember.wardId, { page: nextPage, size: PAGE_SIZE })
      setHistoryItems((prev) => [...prev, ...res.content])
      setHistoryLast(res.last)
      setHistoryPage(nextPage)
    } catch {
      setHistoryLoadMoreError('추가 이력을 불러오지 못했습니다.')
    } finally {
      setHistoryLoadingMore(false)
    }
  }

  const handleAskChat = (item: FamilyLogItem) => {
    setSelectedLogItem(null)
    setSelectedMember(null)
    navigate('/chat', { state: { analysisId: item.analysisId } })
  }

  const confirmDeleteMember = async () => {
    if (!deleteTarget) return
    setDeleteError(null)
    try {
      await deleteFamilyMember(deleteTarget.linkId)
      setMembers((prev) => prev.filter((m) => m.linkId !== deleteTarget.linkId))
      if (selectedMember?.linkId === deleteTarget.linkId) closeMemberHistory()
      setDeleteTarget(null)
    } catch {
      setDeleteError('삭제에 실패했습니다.')
    }
  }

  const openEditRelation = (member: FamilyMember) => {
    setEditTarget(member)
    setRelationInput(member.relationship ?? '')
    setEditError(null)
  }

  const handleSaveRelation = async () => {
    if (!editTarget) return
    const trimmed = relationInput.trim()
    if (!trimmed) {
      setEditError('관계를 입력해주세요.')
      return
    }
    setEditSubmitting(true)
    setEditError(null)
    try {
      await patchFamilyMember(editTarget.linkId, trimmed)
      setMembers((prev) =>
        prev.map((m) => (m.linkId === editTarget.linkId ? { ...m, relationship: trimmed } : m))
      )
      setSelectedMember((prev) =>
        prev && prev.linkId === editTarget.linkId ? { ...prev, relationship: trimmed } : prev
      )
      setEditTarget(null)
    } catch {
      setEditError('관계 수정에 실패했습니다.')
    } finally {
      setEditSubmitting(false)
    }
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
            disabled={inviteLoading}
            className="text-xs font-semibold text-blue px-3 py-1.5 rounded-full border border-blue disabled:opacity-40"
          >
            {inviteLoading ? '발급 중...' : invite ? '코드 재발급' : '초대 코드 생성'}
          </button>
        </div>
        {inviteError && <p className="text-xs text-high-text">{inviteError}</p>}
        {invite && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-full flex items-center justify-between bg-white rounded-xl border border-line px-4 py-3">
              <span className="text-lg font-bold tracking-[0.3em] text-t1">{invite.inviteCode}</span>
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
              aria-label={`초대 코드 ${invite.inviteCode} QR 코드`}
            >
              {buildQrMatrix(invite.qrToken).map((row, r) =>
                row.map((filled, c) =>
                  filled ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#1B2640" /> : null
                )
              )}
            </svg>
            <p className="text-xs text-t3 text-center">
              QR을 스캔하거나 코드를 공유해 가족을 초대하세요 · {formatDate(invite.expiresAt)}까지 유효
            </p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-t1">가족 구성원</span>
        <div className="flex flex-col gap-2">
          {membersLoading && (
            <div className="bg-surface rounded-2xl border border-line p-6 flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!membersLoading && membersError && (
            <div className="bg-high-bg border border-high-line rounded-2xl p-6 text-center text-sm text-high-text">
              {membersError}
            </div>
          )}
          {!membersLoading && !membersError && members.length === 0 && (
            <div className="bg-surface rounded-2xl border border-line p-6 text-center text-sm text-t3">
              등록된 가족 구성원이 없습니다.
            </div>
          )}
          {!membersLoading && !membersError && members.map((member) => {
            const risk = memberRisk[member.linkId]
            const name = memberDisplayName(member)
            return (
              <div key={member.linkId} className="bg-surface rounded-2xl border border-line p-4 flex items-center gap-3">
                <button
                  onClick={() => openMemberHistory(member)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                >
                  <span className="w-10 h-10 shrink-0 rounded-full bg-char-disc text-blue font-bold flex items-center justify-center">
                    {name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-t1 truncate">
                      {name}{member.relationship && <span className="text-xs text-t3 font-normal"> · {member.relationship}</span>}
                    </p>
                    <p className="text-xs text-t2 mt-0.5">{maskPhone(member.wardPhone)}</p>
                  </div>
                  {risk ? (
                    <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${RISK_META[risk].badge}`}>
                      {RISK_META[risk].label}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-semibold px-3 py-1 rounded-full bg-track text-t3">
                      기록 없음
                    </span>
                  )}
                </button>
                <button
                  onClick={() => openEditRelation(member)}
                  aria-label={`${name} 관계 수정`}
                  className="shrink-0 text-t3 p-1"
                >
                  <IoPencilOutline size={16} />
                </button>
                <button
                  onClick={() => setDeleteTarget(member)}
                  aria-label={`${name} 삭제`}
                  className="shrink-0 text-t3 p-1"
                >
                  <IoTrashOutline size={16} />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {selectedMember && (
        <div
          className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center px-5"
          onClick={closeMemberHistory}
        >
          <div
            className="w-full max-w-sm max-h-[80vh] overflow-y-auto bg-white rounded-2xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-t1">{memberDisplayName(selectedMember)}</p>
                <p className="text-xs text-t2 mt-0.5">{maskPhone(selectedMember.wardPhone)} · 탐지 이력</p>
              </div>
              <button onClick={closeMemberHistory} className="text-t3 text-sm font-bold px-2" aria-label="닫기">✕</button>
            </div>
            <div className="flex flex-col gap-2">
              {historyLoading && (
                <div className="flex items-center justify-center py-10">
                  <span className="w-6 h-6 border-2 border-blue border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!historyLoading && historyError && (
                <div className="bg-high-bg border border-high-line rounded-2xl p-4 text-center text-sm text-high-text">
                  {historyError}
                </div>
              )}
              {!historyLoading && !historyError && historyItems.length === 0 && (
                <div className="bg-surface rounded-2xl border border-line p-6 text-center text-sm text-t3">
                  아직 탐지 이력이 없습니다.
                </div>
              )}
              {!historyLoading && !historyError && historyItems.map((item) => {
                const uiRisk = item.riskLevel ? RISK_LEVEL_MAP[item.riskLevel] : null
                return (
                  <button
                    key={item.analysisId}
                    onClick={() => setSelectedLogItem(item)}
                    className="text-left bg-surface rounded-2xl border border-line p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-t3 shrink-0">{formatDate(item.analyzedAt)}</span>
                        {item.maskedSender && (
                          <>
                            <span className="text-xs text-t3 shrink-0">·</span>
                            <span className="text-xs text-t3 truncate">{item.maskedSender}</span>
                          </>
                        )}
                      </div>
                      {uiRisk && (
                        <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${RISK_META[uiRisk].badge}`}>
                          {RISK_META[uiRisk].label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-t1 line-clamp-2">{item.messagePreview ?? '분석 결과를 확인해보세요.'}</p>
                  </button>
                )
              })}
              {!historyLoading && !historyError && !historyLast && historyItems.length > 0 && (
                <button
                  onClick={handleLoadMoreHistory}
                  disabled={historyLoadingMore}
                  className="w-full py-3 rounded-xl border border-line text-sm font-semibold text-t2 disabled:opacity-40"
                >
                  {historyLoadingMore ? '불러오는 중...' : '더 보기'}
                </button>
              )}
              {historyLoadMoreError && (
                <div className="bg-high-bg border border-high-line rounded-2xl p-3 text-center text-sm text-high-text">
                  {historyLoadMoreError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedLogItem && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-5"
          onClick={() => setSelectedLogItem(null)}
        >
          <div
            className="w-full max-w-sm max-h-[80vh] overflow-y-auto bg-white rounded-2xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-t3 shrink-0">{formatDate(selectedLogItem.analyzedAt)}</span>
                {selectedLogItem.maskedSender && (
                  <>
                    <span className="text-xs text-t3 shrink-0">·</span>
                    <span className="text-xs text-t3 truncate">{selectedLogItem.maskedSender}</span>
                  </>
                )}
              </div>
              <button onClick={() => setSelectedLogItem(null)} className="text-t3 text-sm font-bold px-2" aria-label="닫기">✕</button>
            </div>

            {selectedLogItem.riskLevel && (
              <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${RISK_META[RISK_LEVEL_MAP[selectedLogItem.riskLevel]].box}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${RISK_META[RISK_LEVEL_MAP[selectedLogItem.riskLevel]].badge}`}>
                    {RISK_META[RISK_LEVEL_MAP[selectedLogItem.riskLevel]].label}
                  </span>
                  {selectedLogItem.category && (
                    <span className="text-sm font-semibold">{CATEGORY_LABEL[selectedLogItem.category]}</span>
                  )}
                </div>
                <p className="text-sm">{selectedLogItem.messagePreview ?? '메시지 미리보기가 없습니다.'}</p>
              </div>
            )}

            <button
              onClick={() => handleAskChat(selectedLogItem)}
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
            <p className="text-sm font-semibold text-t1">{memberDisplayName(deleteTarget)}님을 가족 목록에서 삭제할까요?</p>
            <p className="text-xs text-t2">연결을 해제하면 더 이상 탐지 이력을 확인할 수 없습니다.</p>
            {deleteError && <p className="text-xs text-high-text">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-line text-t2 font-semibold text-sm"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteMember}
                className="flex-1 py-2.5 rounded-xl bg-high text-white font-semibold text-sm"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-5"
          onClick={() => setEditTarget(null)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-2xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-t1">{memberDisplayName(editTarget)}님과의 관계</p>
            <input
              value={relationInput}
              onChange={(e) => setRelationInput(e.target.value)}
              maxLength={20}
              autoFocus
              className="text-sm text-t1 bg-white border border-line rounded-lg px-3 py-2 outline-none focus:border-blue"
            />
            {editError && <p className="text-xs text-high-text">{editError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setEditTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-line text-t2 font-semibold text-sm"
              >
                취소
              </button>
              <button
                onClick={handleSaveRelation}
                disabled={editSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-blue text-white font-semibold text-sm disabled:opacity-40"
              >
                {editSubmitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
