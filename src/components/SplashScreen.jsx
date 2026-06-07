import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in') // 'in' | 'hold' | 'out'

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('out'), 2800)
    const doneTimer = setTimeout(() => onDone(), 3600)
    return () => { clearTimeout(holdTimer); clearTimeout(doneTimer) }
  }, [onDone])

  return (
    <div className={`splash-shell splash-${phase}`}>
      <div className="splash-bg" />
      <div className="splash-content">
        <div className="splash-logo-wrap">
          <img src="/channels4_profile.jpg" alt="The Church of Jesus Christ of Latter-day Saints" className="splash-logo" />
        </div>
        <div className="splash-text">
          <h1 className="splash-title">Scripture Tracker</h1>
          <p className="splash-subtitle">Daily reading. Daily discipleship.</p>
        </div>
      </div>
      <div className="splash-footer">
        The Church of Jesus Christ of Latter-day Saints
      </div>
    </div>
  )
}
