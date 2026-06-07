import { useState } from 'react'
import { SCRIPTURE_BOOKS, buildReadingPlan } from '../data/scriptureIndex'
import { Plus, Trash2, Pencil, BookOpen, CheckCircle2, ChevronDown, ChevronUp, Play } from 'lucide-react'

function getDayOfPlan(plan) {
  const start = new Date(plan.createdAt)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today - start) / 86400000)
}

export default function Plans({ plans, activePlanId, readDays, onNewPlan, onEdit, onDelete, onActivateAndRead, onActivate }) {
  const [expanded, setExpanded] = useState(null)

  if (plans.length === 0) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No Reading Plans</h2>
          <p>Create a plan to start tracking your scripture reading.</p>
          <button className="btn-primary" onClick={onNewPlan}>
            <Plus size={18} /> Create Plan
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Reading Plans</h1>
        <button className="btn-icon" onClick={onNewPlan}><Plus size={20} /></button>
      </div>

      <div className="plans-list">
        {plans.map(plan => {
          const scripture = SCRIPTURE_BOOKS.find(s => s.id === plan.scriptureId)
          const days = readDays[plan.id] || []
          const pct = Math.min(100, Math.round((days.length / plan.totalDays) * 100))
          const isActive = plan.id === activePlanId
          const isExpanded = expanded === plan.id

          // Figure out today's first chapter for "Read Now"
          const dayIdx = getDayOfPlan(plan)
          const readingPlan = buildReadingPlan(plan.scriptureId, plan.totalDays)
          const todayAssignment = readingPlan.days[Math.min(dayIdx, readingPlan.days.length - 1)]
          const firstChapterRef = todayAssignment?.chapters?.[0] || ''
          // Parse "Book Name N" → book name + chapter number
          const parts = firstChapterRef.split(' ')
          const chNum = parseInt(parts[parts.length - 1]) || 1
          const bookName = parts.slice(0, -1).join(' ') || scripture?.books?.[0]?.name || ''

          return (
            <div
              key={plan.id}
              className={`card plan-item ${isActive ? 'plan-item-active' : ''}`}
              style={{ '--plan-color': scripture?.color || 'var(--accent)' }}
            >
              {/* Tappable header row */}
              <div
                className="plan-item-header"
                onClick={() => setExpanded(isExpanded ? null : plan.id)}
              >
                <div className="plan-item-info">
                  {isActive && <span className="active-dot" />}
                  <div>
                    <div className="plan-item-name">{plan.name}</div>
                    <div className="plan-item-sub">{scripture?.title} · {plan.totalDays} days</div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={18} className="plan-chevron" /> : <ChevronDown size={18} className="plan-chevron" />}
              </div>

              {/* Progress bar — always visible */}
              <div className="progress-bar" style={{ margin: '0.6rem 0 0.25rem' }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: scripture?.color }} />
              </div>
              <div className="plan-item-stats">
                <span>{days.length} / {plan.totalDays} days read</span>
                <span>{pct}%</span>
              </div>

              {/* Expandable action area */}
              {isExpanded && (
                <div className="plan-actions">
                  {/* Read Now — primary action */}
                  <button
                    className="plan-action-primary"
                    onClick={() => onActivateAndRead(plan, bookName, chNum)}
                  >
                    <Play size={16} />
                    {isActive ? "Read Today's Assignment" : 'Activate & Read Now'}
                  </button>

                  <div className="plan-action-row">
                    {/* Set Active (only if not already active) */}
                    {!isActive && (
                      <button className="plan-action-btn" onClick={() => onActivate(plan.id)}>
                        <CheckCircle2 size={15} /> Set Active
                      </button>
                    )}

                    {/* Edit */}
                    <button className="plan-action-btn" onClick={() => onEdit(plan)}>
                      <Pencil size={15} /> Edit Plan
                    </button>

                    {/* Delete */}
                    <button
                      className="plan-action-btn plan-action-danger"
                      onClick={() => { if (confirm(`Delete "${plan.name}"?`)) onDelete(plan.id) }}
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>

                  {todayAssignment && (
                    <div className="plan-today-hint">
                      <BookOpen size={12} />
                      Today: {todayAssignment.chapters.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
