import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoCopyOutline, IoPencilOutline, IoTrashOutline } from 'react-icons/io5'
import { QRCodeSVG } from 'qrcode.react'
import {
  deleteFamilyMember,
  getFamilyMembers,
  getFamilyWardLogs,
  patchFamilyMember,
  postFamilyInvite,
} from '../api/family'
import type { FamilyInvite, FamilyLogItem, FamilyMember } from '../api/family'
import { CATEGORY_LABEL } from '../api/analyses'
import type { RiskLevel } from '../api/analyses'

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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '날짜 없음'
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return `${year}.${month}.${day}`
}

/**
 * 초대 코드 만료까지 남은 시간을 `분:초`로 적는다.
 *
 * 유효기간이 **10분**뿐이라(`FamilyService.INVITE_EXPIRE_MINUTES`) 날짜만 적으면
 * 하루 종일 쓸 수 있다는 오해를 준다. 앱도 같은 화면에서 남은 시간을 센다.
 */
function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 7) return phone
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`
}

function memberDisplayName(member: FamilyMember): string {
  return member.wardName ?? maskPhone(member.wardPhone)
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

  /**
   * 카운트다운의 '지금'. 초마다 흐르는 시계는 React 밖의 것이라
   * 타이머 콜백에서만 갱신하고, 남은 시간은 렌더할 때 빼서 구한다.
   * 초대가 없는 동안은 타이머를 돌리지 않으므로, 새로 발급할 때
   * 핸들러에서 한 번 맞춰준다(안 그러면 마운트 시각에 멈춰 있다).
   */
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!invite) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [invite])

  const inviteExpiresAt = invite ? new Date(invite.expiresAt).getTime() : Number.NaN
  // 서버가 이상한 시각을 주면 카운트다운 대신 만료 안내로 떨어뜨린다.
  const inviteRemainingMs = Number.isNaN(inviteExpiresAt)
    ? 0
    : Math.max(0, inviteExpiresAt - now)

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
      // 발급 직전까지 타이머가 멈춰 있었으니 시계를 지금으로 맞춘다.
      setNow(Date.now())
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
        <h1 className="text-title-screen text-t1">가족 관리</h1>
        <p className="text-body text-t2 mt-1">가족을 초대하고 탐지 이력을 함께 확인하세요.</p>
      </header>

      <section className="bg-surface rounded-2xl border border-line p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-body-strong text-t1">초대 코드</span>
          <button
            onClick={handleGenerateInvite}
            disabled={inviteLoading}
            className="text-section text-blue px-3 py-1.5 rounded-full border border-blue disabled:opacity-40"
          >
            {inviteLoading ? '발급 중...' : invite ? '코드 재발급' : '초대 코드 생성'}
          </button>
        </div>
        {inviteError && <p className="text-caption text-high-text">{inviteError}</p>}
        {invite && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-full flex items-center justify-between bg-white rounded-xl border border-line px-4 py-3">
              <span className="text-title-screen tracking-[0.3em] text-t1">{invite.inviteCode}</span>
              <button onClick={handleCopyCode} className="flex items-center gap-1 text-section text-blue">
                <IoCopyOutline size={14} />
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
            {/*
              앱 스캐너는 읽어낸 원문을 그대로 qrToken으로 서버에 넘긴다
              (SafeFam_FE `qr_scan_screen.dart` → `FamilyApi.linkByQr`).
              그러니 토큰 문자열만 담고 접두사·URL 같은 장식을 붙이면 안 된다.
            */}
            <div className="bg-white rounded-xl border border-line p-3 text-t1">
              <QRCodeSVG
                value={invite.qrToken}
                size={160}
                // 화면을 카메라로 찍는 상황이라 반사·모아레로 일부가 뭉갠다.
                // 오류정정을 M으로 올리고 규격상 필수인 여백 4모듈을 확보해 인식률을 지킨다.
                level="M"
                marginSize={4}
                // 토큰 하드코딩을 피하려고 부모의 text-t1을 currentColor로 물려받는다.
                // 배경은 감싼 div의 bg-white가 맡는다.
                fgColor="currentColor"
                bgColor="transparent"
                title={`초대 코드 ${invite.inviteCode} QR 코드`}
              />
            </div>
            <p className="text-caption text-t3 text-center">
              {inviteRemainingMs > 0 ? (
                <>
                  QR을 스캔하거나 코드를 공유해 가족을 초대하세요 ·{' '}
                  <span className="text-t1">{formatRemaining(inviteRemainingMs)}</span> 뒤 만료
                </>
              ) : (
                <span className="text-high-text">
                  초대 코드가 만료됐어요. 다시 발급해 주세요.
                </span>
              )}
            </p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-body-strong text-t1">가족 구성원</span>
        <div className="flex flex-col gap-2">
          {membersLoading && (
            <div className="bg-surface rounded-2xl border border-line p-6 flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!membersLoading && membersError && (
            <div className="bg-high-bg border border-high-line rounded-2xl p-6 text-center text-body text-high-text">
              {membersError}
            </div>
          )}
          {!membersLoading && !membersError && members.length === 0 && (
            <div className="bg-surface rounded-2xl border border-line p-6 text-center text-body text-t3">
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
                  <span className="w-10 h-10 shrink-0 rounded-full bg-char-disc text-blue text-body-strong flex items-center justify-center">
                    {name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-strong text-t1 truncate">
                      {name}{member.relationship && <span className="text-caption text-t3"> · {member.relationship}</span>}
                    </p>
                    <p className="text-caption text-t2 mt-0.5">{maskPhone(member.wardPhone)}</p>
                  </div>
                  {risk ? (
                    <span className={`shrink-0 text-section px-3 py-1 rounded-full ${RISK_META[risk].badge}`}>
                      {RISK_META[risk].label}
                    </span>
                  ) : (
                    <span className="shrink-0 text-section px-3 py-1 rounded-full bg-track text-t3">
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
                <p className="text-title-screen text-t1">{memberDisplayName(selectedMember)}</p>
                <p className="text-caption text-t2 mt-0.5">{maskPhone(selectedMember.wardPhone)} · 탐지 이력</p>
              </div>
              <button onClick={closeMemberHistory} className="text-t3 text-body-strong px-2" aria-label="닫기">✕</button>
            </div>
            <div className="flex flex-col gap-2">
              {historyLoading && (
                <div className="flex items-center justify-center py-10">
                  <span className="w-6 h-6 border-2 border-blue border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!historyLoading && historyError && (
                <div className="bg-high-bg border border-high-line rounded-2xl p-4 text-center text-body text-high-text">
                  {historyError}
                </div>
              )}
              {!historyLoading && !historyError && historyItems.length === 0 && (
                <div className="bg-surface rounded-2xl border border-line p-6 text-center text-body text-t3">
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
                        <span className="text-caption text-t3 shrink-0">{formatDate(item.analyzedAt)}</span>
                        {item.maskedSender && (
                          <>
                            <span className="text-caption text-t3 shrink-0">·</span>
                            <span className="text-caption text-t3 truncate">{item.maskedSender}</span>
                          </>
                        )}
                      </div>
                      {uiRisk && (
                        <span className={`shrink-0 text-section px-3 py-1 rounded-full ${RISK_META[uiRisk].badge}`}>
                          {RISK_META[uiRisk].label}
                        </span>
                      )}
                    </div>
                    <p className="text-body text-t1 line-clamp-2">{item.messagePreview ?? '분석 결과를 확인해보세요.'}</p>
                  </button>
                )
              })}
              {!historyLoading && !historyError && !historyLast && historyItems.length > 0 && (
                <button
                  onClick={handleLoadMoreHistory}
                  disabled={historyLoadingMore}
                  className="w-full py-3 rounded-xl border border-line text-button text-t2 disabled:opacity-40"
                >
                  {historyLoadingMore ? '불러오는 중...' : '더 보기'}
                </button>
              )}
              {historyLoadMoreError && (
                <div className="bg-high-bg border border-high-line rounded-2xl p-3 text-center text-body text-high-text">
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
                <span className="text-caption text-t3 shrink-0">{formatDate(selectedLogItem.analyzedAt)}</span>
                {selectedLogItem.maskedSender && (
                  <>
                    <span className="text-caption text-t3 shrink-0">·</span>
                    <span className="text-caption text-t3 truncate">{selectedLogItem.maskedSender}</span>
                  </>
                )}
              </div>
              <button onClick={() => setSelectedLogItem(null)} className="text-t3 text-body-strong px-2" aria-label="닫기">✕</button>
            </div>

            {selectedLogItem.riskLevel && (
              <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${RISK_META[RISK_LEVEL_MAP[selectedLogItem.riskLevel]].box}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`shrink-0 text-section px-3 py-1 rounded-full ${RISK_META[RISK_LEVEL_MAP[selectedLogItem.riskLevel]].badge}`}>
                    {RISK_META[RISK_LEVEL_MAP[selectedLogItem.riskLevel]].label}
                  </span>
                  {selectedLogItem.category && (
                    <span className="text-body-strong">{CATEGORY_LABEL[selectedLogItem.category]}</span>
                  )}
                </div>
                <p className="text-body">{selectedLogItem.messagePreview ?? '메시지 미리보기가 없습니다.'}</p>
              </div>
            )}

            <button
              onClick={() => handleAskChat(selectedLogItem)}
              className="w-full py-3 bg-blue text-white text-button rounded-xl"
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
            <p className="text-body-strong text-t1">{memberDisplayName(deleteTarget)}님을 가족 목록에서 삭제할까요?</p>
            <p className="text-caption text-t2">연결을 해제하면 더 이상 탐지 이력을 확인할 수 없습니다.</p>
            {deleteError && <p className="text-caption text-high-text">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-line text-t2 text-button"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteMember}
                className="flex-1 py-2.5 rounded-xl bg-high text-white text-button"
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
            <p className="text-body-strong text-t1">{memberDisplayName(editTarget)}님과의 관계</p>
            <input
              value={relationInput}
              onChange={(e) => setRelationInput(e.target.value)}
              maxLength={20}
              autoFocus
              className="text-body text-t1 bg-white border border-line rounded-lg px-3 py-2 outline-none focus:border-blue"
            />
            {editError && <p className="text-caption text-high-text">{editError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setEditTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-line text-t2 text-button"
              >
                취소
              </button>
              <button
                onClick={handleSaveRelation}
                disabled={editSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-blue text-white text-button disabled:opacity-40"
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
