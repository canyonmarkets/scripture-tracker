import { useMemo } from 'react'
import { SCRIPTURE_BOOKS, buildReadingPlan } from '../data/scriptureIndex'
import { Flame, CheckCircle2, Circle, ChevronRight, Plus, TrendingUp, Bookmark } from 'lucide-react'

function getStreak(days) {
  if (!days || days.length === 0) return 0
  const sorted = [...days].sort().reverse()
  let streak = 0
  let check = new Date()
  check.setHours(0, 0, 0, 0)
  for (const d of sorted) {
    const date = new Date(d + 'T00:00:00')
    const diff = Math.round((check - date) / 86400000)
    if (diff === 0 || diff === 1) {
      streak++
      check = date
    } else break
  }
  return streak
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getDayOfPlan(plan) {
  const start = new Date(plan.createdAt)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today - start) / 86400000)
}

export default function Home({ plans, activePlan, activePlanId, setActivePlanId, readDays, bookmark, onMarkRead, onOpenReader, onNewPlan }) {
  const today = getTodayKey()

  const planData = useMemo(() => {
    if (!activePlan) return null
    const readingPlan = buildReadingPlan(activePlan.scriptureId, activePlan.totalDays)
    const days = readDays[activePlan.id] || []
    const dayIdx = getDayOfPlan(activePlan)
    let todaysAssignment = readingPlan.days[dayIdx] || null
    const daysRead = days.length
    const totalDays = activePlan.totalDays
    const pct = Math.min(100, Math.round((daysRead / totalDays) * 100))
    const streak = getStreak(days)
    const readToday = days.includes(today)
    const scripture = SCRIPTURE_BOOKS.find(s => s.id === activePlan.scriptureId)

    // If a bookmark exists, filter today's chapters to only those at or after the bookmark
    if (todaysAssignment && bookmark) {
      const bookmarkRef = `${bookmark.book} ${bookmark.chapter}`
      // Build a flat ordered list of all chapter refs across the whole plan
      const allChapters = readingPlan.days.flatMap(d => d.chapters)
      const bookmarkIdx = allChapters.indexOf(bookmarkRef)
      if (bookmarkIdx !== -1) {
        const filtered = todaysAssignment.chapters.filter(ch => allChapters.indexOf(ch) >= bookmarkIdx)
        if (filtered.length !== todaysAssignment.chapters.length) {
          // Recalculate verse count for the filtered chapters
          const filteredVerses = filtered.reduce((sum, ch) => {
            const day = readingPlan.days.find(d => d.chapters.includes(ch))
            if (!day) return sum
            // Approximate: distribute day's verses evenly across its chapters
            return sum + Math.round(day.verses / day.chapters.length)
          }, 0)
          todaysAssignment = { chapters: filtered, verses: filteredVerses }
        }
      }
    }

    return { readingPlan, todaysAssignment, daysRead, totalDays, pct, streak, readToday, scripture, dayIdx }
  }, [activePlan, readDays, today, bookmark])

  if (plans.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📖</div>
        <h2>Welcome to Scripture Tracker</h2>
        <p>Create your first reading plan to get started on your journey through the scriptures.</p>
        <button className="btn-primary" onClick={onNewPlan}>
          <Plus size={18} /> Create Reading Plan
        </button>
      </div>
    )
  }

  if (!planData) return null

  const { todaysAssignment, daysRead, totalDays, pct, streak, readToday, scripture, dayIdx } = planData

  return (
    <div className="home-page">
      {/* Plan selector if multiple plans */}
      {plans.length > 1 && (
        <div className="plan-selector">
          <select
            value={activePlanId || ''}
            onChange={e => setActivePlanId(e.target.value)}
            className="plan-select"
          >
            {plans.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Progress card */}
      <div className="card progress-card" style={{ '--accent': scripture?.color || '#1a4a7a' }}>
        <div className="progress-header">
          <div>
            <div className="plan-name">{activePlan.name}</div>
            <div className="plan-subtitle">{scripture?.title}</div>
          </div>
          <div className="streak-badge">
            <Flame size={18} />
            <span>{streak}</span>
          </div>
        </div>

        <div className="progress-bar-wrap">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="progress-label">{pct}% complete — Day {Math.min(dayIdx + 1, totalDays)} of {totalDays}</div>
        </div>

        <div className="stats-row">
          <div className="stat">
            <div className="stat-val">{daysRead}</div>
            <div className="stat-label">Days Read</div>
          </div>
          <div className="stat">
            <div className="stat-val">{totalDays - daysRead}</div>
            <div className="stat-label">Remaining</div>
          </div>
          <div className="stat">
            <div className="stat-val">{streak}</div>
            <div className="stat-label">Streak</div>
          </div>
        </div>
      </div>

      {/* Bookmark — continue where you left off */}
      {bookmark && (
        <button
          className="card bookmark-continue-card"
          onClick={() => onOpenReader(activePlan.scriptureId, bookmark.book, bookmark.chapter)}
        >
          <div className="bookmark-continue-left">
            <Bookmark size={18} className="bookmark-continue-icon" />
            <div>
              <div className="bookmark-continue-label">Continue Reading</div>
              <div className="bookmark-continue-ref">{bookmark.book} {bookmark.chapter}</div>
            </div>
          </div>
          <ChevronRight size={18} className="bookmark-continue-arrow" />
        </button>
      )}

      {/* Today's reading */}
      <div className="card today-card">
        <div className="today-label">
          <TrendingUp size={16} />
          <span>Today's Reading</span>
        </div>

        {todaysAssignment ? (
          <>
            <div className="today-chapters">
              {todaysAssignment.chapters.map((ch, i) => {
                const [bookName, chNum] = ch.split(' ').reduce((acc, part, idx, arr) => {
                  if (idx === arr.length - 1) return [arr.slice(0, -1).join(' '), part]
                  return acc
                }, ['', ''])
                return (
                  <button
                    key={i}
                    className="chapter-btn"
                    onClick={() => onOpenReader(activePlan.scriptureId, bookName, parseInt(chNum))}
                  >
                    <span>{ch}</span>
                    <ChevronRight size={14} />
                  </button>
                )
              })}
            </div>
            <div className="today-meta">{todaysAssignment.verses} verses</div>

            <button
              className={`mark-read-btn ${readToday ? 'done' : ''}`}
              onClick={() => !readToday && onMarkRead(activePlan.id)}
            >
              {readToday ? (
                <><CheckCircle2 size={18} /> Read Today — Well Done!</>
              ) : (
                <><Circle size={18} /> Mark Today as Read</>
              )}
            </button>
          </>
        ) : (
          <div className="plan-complete">
            <CheckCircle2 size={40} className="complete-icon" />
            <p>You've completed this reading plan! 🎉</p>
          </div>
        )}
      </div>

      {/* Calendar heatmap */}
      <CalendarHeatmap readDays={readDays[activePlan.id] || []} totalDays={totalDays} startDate={activePlan.createdAt} />

      <button className="btn-outline add-plan-btn" onClick={onNewPlan}>
        <Plus size={16} /> New Reading Plan
      </button>
    </div>
  )
}

function CalendarHeatmap({ readDays, totalDays, startDate }) {
  const cells = useMemo(() => {
    const result = []
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const set = new Set(readDays)
    for (let i = 0; i < Math.min(totalDays, 84); i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      const isPast = d <= today
      const isRead = set.has(key)
      result.push({ key, isPast, isRead, isToday: key === today.toISOString().slice(0, 10) })
    }
    return result
  }, [readDays, totalDays, startDate])

  return (
    <div className="card heatmap-card">
      <div className="heatmap-title">Reading History</div>
      <div className="heatmap-grid">
        {cells.map(cell => (
          <div
            key={cell.key}
            className={`heatmap-cell ${cell.isRead ? 'read' : ''} ${cell.isToday ? 'today' : ''} ${!cell.isPast ? 'future' : ''}`}
            title={cell.key}
          />
        ))}
      </div>
      <div className="heatmap-legend">
        <span className="heatmap-cell read" /> Read &nbsp;
        <span className="heatmap-cell today" /> Today &nbsp;
        <span className="heatmap-cell" style={{ opacity: 0.3 }} /> Missed
      </div>
    </div>
  )
}
