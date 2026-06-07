import { useEffect, useState, useMemo } from 'react'
import { useStorage } from './hooks/useStorage'
import Home from './components/Home'
import Reader from './components/Reader'
import Plans from './components/Plans'
import Journal from './components/Journal'
import Preferences from './components/Preferences'
import NewPlan from './components/NewPlan'
import SplashScreen from './components/SplashScreen'
import { BookOpen, BookText, List, BookMarked, Settings2 } from 'lucide-react'
import { buildReadingPlan } from './data/scriptureIndex'
import './index.css'

export default function App() {
  const [splashDone, setSplashDone] = useState(false)
  const [tab, setTab] = useState('home')
  const [readerState, setReaderState] = useState(null)
  const [editingPlan, setEditingPlan] = useState(null) // null = new plan, plan obj = editing
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [plans, setPlans] = useStorage('st_plans', [])
  const [readDays, setReadDays] = useStorage('st_readDays', {})
  const [notes, setNotes] = useStorage('st_notes', [])
  const [activePlanId, setActivePlanId] = useStorage('st_activePlan', null)

  const [theme, setTheme] = useStorage('st_theme', 'light')
  const [fontSize, setFontSize] = useStorage('st_fontSize', 'md')
  const [fontFamily, setFontFamily] = useStorage('st_fontFamily', 'system')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-font', fontFamily)
  }, [fontFamily])

  function openReader(scriptureId, book, chapter) {
    setReaderState({ scriptureId, book, chapter })
    setTab('reader')
  }

  function markTodayRead(planId) {
    const today = new Date().toISOString().slice(0, 10)
    setReadDays(prev => {
      const days = prev[planId] || []
      if (days.includes(today)) return prev
      return { ...prev, [planId]: [...days, today] }
    })
  }

  function openNewPlan() {
    setEditingPlan(null)
    setShowPlanForm(true)
  }

  function openEditPlan(plan) {
    setEditingPlan(plan)
    setShowPlanForm(true)
  }

  function savePlan(planData) {
    if (editingPlan) {
      // Update existing plan — preserve id, createdAt, and read days
      setPlans(prev => prev.map(p =>
        p.id === editingPlan.id ? { ...p, ...planData } : p
      ))
    } else {
      const id = Date.now().toString()
      setPlans(prev => [...prev, { ...planData, id, createdAt: new Date().toISOString() }])
      setActivePlanId(id)
    }
    setShowPlanForm(false)
    setEditingPlan(null)
  }

  function deletePlan(id) {
    setPlans(prev => prev.filter(p => p.id !== id))
    setReadDays(prev => { const copy = { ...prev }; delete copy[id]; return copy })
    if (activePlanId === id) {
      const remaining = plans.filter(p => p.id !== id)
      setActivePlanId(remaining[0]?.id || null)
    }
  }

  function activatePlanAndGoHome(planId) {
    setActivePlanId(planId)
    setTab('home')
  }

  const activePlan = plans.find(p => p.id === activePlanId) || plans[0] || null
  const prefs = { theme, fontSize, fontFamily }

  // Compute today's assignment for the active plan so the Reader can track goal progress
  const todayAssignment = useMemo(() => {
    if (!activePlan) return null
    const start = new Date(activePlan.createdAt)
    start.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayIdx = Math.floor((today - start) / 86400000)
    const plan = buildReadingPlan(activePlan.scriptureId, activePlan.totalDays)
    return plan.days[Math.min(dayIdx, plan.days.length - 1)] || null
  }, [activePlan])

  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />

  if (tab === 'reader' && readerState) {
    return (
      <Reader
        {...readerState}
        prefs={prefs}
        todayAssignment={todayAssignment}
        planId={activePlan?.id || null}
        onMarkRead={markTodayRead}
        onBack={() => setTab('home')}
      />
    )
  }

  if (showPlanForm) {
    return (
      <NewPlan
        initialPlan={editingPlan}
        onSave={savePlan}
        onCancel={() => { setShowPlanForm(false); setEditingPlan(null) }}
      />
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <BookOpen size={22} className="header-icon" />
          <span className="header-title">Scripture Tracker</span>
        </div>
      </header>

      <main className="app-main">
        {tab === 'home' && (
          <Home
            plans={plans}
            activePlan={activePlan}
            activePlanId={activePlanId}
            setActivePlanId={setActivePlanId}
            readDays={readDays}
            onMarkRead={markTodayRead}
            onOpenReader={openReader}
            onNewPlan={openNewPlan}
            onGoToPlans={() => setTab('plans')}
          />
        )}
        {tab === 'plans' && (
          <Plans
            plans={plans}
            activePlanId={activePlanId}
            readDays={readDays}
            onNewPlan={openNewPlan}
            onEdit={openEditPlan}
            onDelete={deletePlan}
            onActivateAndRead={(plan, book, chapter) => {
              setActivePlanId(plan.id)
              openReader(plan.scriptureId, book, chapter)
            }}
            onActivate={activatePlanAndGoHome}
          />
        )}
        {tab === 'journal' && (
          <Journal notes={notes} setNotes={setNotes} />
        )}
        {tab === 'settings' && (
          <Preferences
            prefs={prefs}
            setTheme={setTheme}
            setFontSize={setFontSize}
            setFontFamily={setFontFamily}
          />
        )}
      </main>

      <nav className="bottom-nav">
        {[
          { id: 'home',     icon: BookText,   label: 'Today' },
          { id: 'plans',    icon: List,       label: 'Plans' },
          { id: 'journal',  icon: BookMarked, label: 'Journal' },
          { id: 'settings', icon: Settings2,  label: 'Prefs' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`nav-btn ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
