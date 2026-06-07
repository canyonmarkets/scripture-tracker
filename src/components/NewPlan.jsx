import { useState, useMemo } from 'react'
import {
  SCRIPTURE_BOOKS, getTotalVerses, buildReadingPlan,
  READING_SPEEDS, daysFromMinutesPerDay, WORDS_PER_VERSE
} from '../data/scriptureIndex'
import { ArrowLeft, BookOpen, Clock, Calendar } from 'lucide-react'

// Preset values for each unit
const UNIT_PRESETS = {
  days:   [21, 30, 45, 60, 75, 90, 120, 150, 180, 270, 365, 500],
  weeks:  [3, 4, 6, 8, 10, 13, 17, 20, 26, 39, 52, 78],
  months: [1, 2, 3, 4, 5, 6, 9, 12, 18, 24, 36],
}

const UNIT_LABELS = { days: 'Days', weeks: 'Weeks', months: 'Months' }

function unitToDays(value, unit) {
  if (unit === 'days')   return value
  if (unit === 'weeks')  return value * 7
  if (unit === 'months') return Math.round(value * 30.44)
  return value
}

const MINUTE_OPTIONS = [5, 10, 15, 20, 30, 45, 60]

function formatMinutes(min) {
  if (min < 1) return `~${Math.round(min * 60)} sec`
  if (min < 60) return `~${Math.round(min)} min`
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`
}

function formatDays(days) {
  if (days < 14)  return `${days} days`
  if (days < 60)  return `${Math.round(days / 7)} weeks`
  const months = (days / 30.44)
  return months < 24 ? `${months.toFixed(1)} months` : `${(months / 12).toFixed(1)} years`
}

export default function NewPlan({ initialPlan, onSave, onCancel }) {
  const isEditing = !!initialPlan

  // Derive initial unit/value from existing plan if editing
  const initDays = initialPlan?.totalDays || 91
  const initUnit = initDays % 7 === 0 ? 'weeks' : 'days'
  const initValue = initUnit === 'weeks' ? initDays / 7 : initDays

  const [scriptureId, setScriptureId] = useState(initialPlan?.scriptureId || 'bofm')
  const [name, setName] = useState(initialPlan?.name || '')
  const [mode, setMode] = useState('duration')

  // Duration mode state
  const [durationUnit, setDurationUnit] = useState(initUnit)
  const [durationValue, setDurationValue] = useState(initValue)
  const [customValue, setCustomValue] = useState('')
  const [usingCustom, setUsingCustom] = useState(false)

  // Time-per-day mode state
  const [minutesPerDay, setMinutesPerDay] = useState(20)
  const [speedKey, setSpeedKey] = useState('average')

  const scripture = SCRIPTURE_BOOKS.find(s => s.id === scriptureId)
  const speed = READING_SPEEDS.find(s => s.key === speedKey)
  const totalVerses = getTotalVerses(scriptureId)

  // Resolve total days from current selections
  const totalDays = useMemo(() => {
    if (mode === 'time') return daysFromMinutesPerDay(minutesPerDay, scriptureId, speed.wpm)
    const val = usingCustom ? (parseInt(customValue) || 1) : durationValue
    return Math.max(1, unitToDays(val, durationUnit))
  }, [mode, durationUnit, durationValue, customValue, usingCustom, minutesPerDay, scriptureId, speed])

  const stats = useMemo(() => {
    const wpm = speed.wpm
    const wpv = WORDS_PER_VERSE[scriptureId] || 30
    const totalWords = totalVerses * wpv
    const versesPerDay = Math.ceil(totalVerses / totalDays)
    const minPerDay = mode === 'time' ? minutesPerDay : (versesPerDay * wpv) / wpm
    const plan = buildReadingPlan(scriptureId, totalDays)
    const avgChaptersPerDay = plan.days.reduce((s, d) => s + d.chapters.length, 0) / plan.days.length
    return { versesPerDay, minPerDay, avgChaptersPerDay, totalWords }
  }, [totalDays, scriptureId, mode, minutesPerDay, speed, totalVerses])

  function handleUnitChange(unit) {
    setDurationUnit(unit)
    setUsingCustom(false)
    setCustomValue('')
    // Pick a sensible default for the new unit
    setDurationValue(UNIT_PRESETS[unit][Math.floor(UNIT_PRESETS[unit].length / 2)])
  }

  function handlePresetClick(val) {
    setDurationValue(val)
    setUsingCustom(false)
    setCustomValue('')
  }

  function handleCustomChange(e) {
    const raw = e.target.value.replace(/\D/g, '')
    setCustomValue(raw)
    setUsingCustom(true)
  }

  function defaultName() {
    if (mode === 'time') return `${scripture.title} — ${minutesPerDay} min/day`
    return `${scripture.title} — ${formatDays(totalDays)}`
  }

  function handleSave() {
    onSave({
      name: name.trim() || defaultName(),
      scriptureId,
      totalDays,
      weeks: Math.round(totalDays / 7),
    })
  }

  const presets = UNIT_PRESETS[durationUnit]

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <button className="back-btn" onClick={onCancel}><ArrowLeft size={20} /></button>
          <span className="header-title">{isEditing ? 'Edit Reading Plan' : 'New Reading Plan'}</span>
        </div>
      </header>

      <main className="app-main" style={{ padding: '1rem' }}>

        {/* Plan Name */}
        <div className="card form-card">
          <label className="form-label">Plan Name <span className="optional">(optional)</span></label>
          <input
            className="form-input"
            placeholder={defaultName()}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Scripture */}
        <div className="card form-card">
          <label className="form-label">Scripture</label>
          <div className="scripture-grid">
            {SCRIPTURE_BOOKS.map(s => (
              <button
                key={s.id}
                className={`scripture-option ${scriptureId === s.id ? 'selected' : ''}`}
                style={{ '--sc-color': s.color }}
                onClick={() => setScriptureId(s.id)}
              >
                <BookOpen size={18} />
                <span className="sc-title">{s.shortTitle}</span>
                <span className="sc-full">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="card form-card">
          <div className="mode-toggle">
            <button className={`mode-btn ${mode === 'duration' ? 'selected' : ''}`} onClick={() => setMode('duration')}>
              <Calendar size={15} /> Set a Deadline
            </button>
            <button className={`mode-btn ${mode === 'time' ? 'selected' : ''}`} onClick={() => setMode('time')}>
              <Clock size={15} /> Set Reading Time
            </button>
          </div>

          {mode === 'duration' ? (
            <>
              {/* Unit switcher */}
              <div className="unit-switcher">
                {Object.keys(UNIT_LABELS).map(u => (
                  <button
                    key={u}
                    className={`unit-btn ${durationUnit === u ? 'selected' : ''}`}
                    onClick={() => handleUnitChange(u)}
                  >
                    {UNIT_LABELS[u]}
                  </button>
                ))}
              </div>

              {/* Preset grid */}
              <div className="preset-grid">
                {presets.map(val => {
                  const isSelected = !usingCustom && durationValue === val
                  return (
                    <button
                      key={val}
                      className={`duration-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handlePresetClick(val)}
                    >
                      {val}
                    </button>
                  )
                })}
              </div>

              {/* Custom input */}
              <div className="custom-input-row">
                <span className="custom-label">Or enter any number of {UNIT_LABELS[durationUnit].toLowerCase()}:</span>
                <input
                  className={`custom-number-input ${usingCustom && customValue ? 'selected' : ''}`}
                  type="number"
                  min="1"
                  placeholder="e.g. 43"
                  value={customValue}
                  onChange={handleCustomChange}
                />
              </div>

              {/* Summary of chosen duration */}
              <div className="duration-summary">
                Finish in <strong>{formatDays(totalDays)}</strong>
                {usingCustom && customValue && (
                  <span className="duration-exact"> ({totalDays} days)</span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="time-mode-header">
                <span className="form-label">How many minutes per day can you read?</span>
              </div>
              <div className="minutes-grid">
                {MINUTE_OPTIONS.map(m => (
                  <button
                    key={m}
                    className={`minutes-option ${minutesPerDay === m ? 'selected' : ''}`}
                    onClick={() => setMinutesPerDay(m)}
                  >
                    <span className="min-number">{m}</span>
                    <span className="min-label">min</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Reading speed */}
        <div className="card form-card">
          <label className="form-label">Reading Speed</label>
          <div className="speed-row">
            {READING_SPEEDS.map(s => (
              <button
                key={s.key}
                className={`speed-btn ${speedKey === s.key ? 'selected' : ''}`}
                onClick={() => setSpeedKey(s.key)}
              >
                <span className="speed-label">{s.label}</span>
                <span className="speed-wpm">{s.wpm} wpm</span>
              </button>
            ))}
          </div>
          <p className="speed-note">{speed.note}</p>
        </div>

        {/* Stats */}
        <div className="card stats-preview">
          <div className="preview-row">
            <span>Total Verses</span>
            <strong>{totalVerses.toLocaleString()}</strong>
          </div>
          <div className="preview-row">
            <span>Total Words</span>
            <strong>{Math.round(stats.totalWords).toLocaleString()}</strong>
          </div>
          <div className="preview-row">
            <span>Reading Period</span>
            <strong>{totalDays} days <span className="preview-sub">({formatDays(totalDays)})</span></strong>
          </div>
          <div className="preview-row">
            <span>Verses Per Day</span>
            <strong>~{stats.versesPerDay}</strong>
          </div>
          <div className="preview-row">
            <span>Chapters Per Day</span>
            <strong>~{stats.avgChaptersPerDay.toFixed(1)}</strong>
          </div>
          <div className="preview-row preview-highlight">
            <span>⏱ Est. Time Per Day</span>
            <strong>{formatMinutes(stats.minPerDay)}</strong>
          </div>
          {mode === 'time' && (
            <div className="preview-row preview-highlight">
              <span>📅 Finish In</span>
              <strong>{formatDays(totalDays)}</strong>
            </div>
          )}
        </div>

        <button className="btn-primary" onClick={handleSave} style={{ width: '100%', marginTop: '0.5rem' }}>
          {isEditing ? 'Save Changes' : 'Create Plan'}
        </button>
        <button className="btn-outline" onClick={onCancel} style={{ width: '100%', marginTop: '0.5rem', marginBottom: '1rem' }}>
          Cancel
        </button>
      </main>
    </div>
  )
}
