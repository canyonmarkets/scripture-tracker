import { useState, useEffect } from 'react'
import { Sun, Moon, Bell, BellOff, Type, AlignLeft } from 'lucide-react'
import { syncScripturePushSubscription, removePushSubscription } from '../lib/pushSubscription'

const FONT_FAMILIES = [
  { key: 'system', label: 'System', style: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { key: 'serif', label: 'Georgia', style: 'Georgia, "Times New Roman", serif' },
  { key: 'palatino', label: 'Palatino', style: '"Palatino Linotype", Palatino, serif' },
  { key: 'bookman', label: 'Bookman', style: '"Book Antiqua", Palatino, serif' },
]

const FONT_SIZES = [
  { key: 'sm', label: 'Small', px: '14px' },
  { key: 'md', label: 'Medium', px: '17px' },
  { key: 'lg', label: 'Large', px: '20px' },
  { key: 'xl', label: 'X-Large', px: '24px' },
]

const PREVIEW_TEXT = '"I, Nephi, having been born of goodly parents, therefore I was taught somewhat in all the learning of my father…"'

export default function Preferences({ prefs, setTheme, setFontSize, setFontFamily }) {
  const { theme, fontSize, fontFamily } = prefs
  const [notifPermission, setNotifPermission] = useState('default')
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('st_notifEnabled') === 'true')
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem('st_reminderTime') || '07:00')
  const [syncStatus, setSyncStatus] = useState(null)

  useEffect(() => {
    if ('Notification' in window) setNotifPermission(Notification.permission)
  }, [])

  async function requestNotifications() {
    if (!('Notification' in window)) return alert('Notifications not supported in this browser.')
    const perm = await Notification.requestPermission()
    setNotifPermission(perm)
    if (perm === 'granted') {
      setNotifEnabled(true)
      localStorage.setItem('st_notifEnabled', 'true')
      const status = await syncScripturePushSubscription(reminderTime)
      setSyncStatus(status)
    }
  }

  async function toggleNotif() {
    const next = !notifEnabled
    setNotifEnabled(next)
    localStorage.setItem('st_notifEnabled', next.toString())
    if (next) {
      if (notifPermission !== 'granted') {
        await requestNotifications()
      } else {
        const status = await syncScripturePushSubscription(reminderTime)
        setSyncStatus(status)
      }
    } else {
      await removePushSubscription()
      setSyncStatus('disabled')
    }
  }

  async function saveReminderTime(t) {
    setReminderTime(t)
    localStorage.setItem('st_reminderTime', t)
    if (notifEnabled && Notification.permission === 'granted') {
      const status = await syncScripturePushSubscription(t)
      setSyncStatus(status)
    }
  }

  const currentFont = FONT_FAMILIES.find(f => f.key === fontFamily) || FONT_FAMILIES[0]
  const currentSize = FONT_SIZES.find(f => f.key === fontSize) || FONT_SIZES[1]

  return (
    <div className="page-content">
      <h1 className="page-title" style={{ padding: '0 1rem 0.75rem' }}>Preferences</h1>

      {/* Theme */}
      <div className="card pref-section">
        <div className="pref-section-title">Appearance</div>
        <div className="theme-toggle-row">
          <button
            className={`theme-btn ${theme === 'light' ? 'selected' : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={18} />
            <span>Light</span>
          </button>
          <button
            className={`theme-btn ${theme === 'dark' ? 'selected' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={18} />
            <span>Dark</span>
          </button>
        </div>
      </div>

      {/* Font Family */}
      <div className="card pref-section">
        <div className="pref-section-title">
          <AlignLeft size={15} /> Font Style
        </div>
        <div className="font-family-grid">
          {FONT_FAMILIES.map(f => (
            <button
              key={f.key}
              className={`font-family-btn ${fontFamily === f.key ? 'selected' : ''}`}
              style={{ fontFamily: f.style }}
              onClick={() => setFontFamily(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="card pref-section">
        <div className="pref-section-title">
          <Type size={15} /> Text Size
        </div>
        <div className="font-size-options">
          {FONT_SIZES.map(opt => (
            <button
              key={opt.key}
              className={`font-size-btn ${fontSize === opt.key ? 'selected' : ''}`}
              style={{ fontSize: opt.px }}
              onClick={() => setFontSize(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Live preview */}
        <div
          className="font-preview"
          style={{
            fontSize: currentSize.px,
            fontFamily: currentFont.style,
          }}
        >
          {PREVIEW_TEXT}
        </div>
      </div>

      {/* Reminders */}
      <div className="card pref-section">
        <div className="pref-section-title">
          {notifEnabled ? <Bell size={15} /> : <BellOff size={15} />}
          Daily Reading Reminder
          <button
            className={`toggle-btn ${notifEnabled ? 'on' : ''}`}
            onClick={toggleNotif}
            style={{ marginLeft: 'auto' }}
          >
            <span className="toggle-thumb" />
          </button>
        </div>

        {notifPermission === 'denied' && (
          <p className="settings-note">Notifications are blocked. Enable them in your browser or phone settings.</p>
        )}
        {syncStatus && (
          <p className="settings-note" style={{ color: syncStatus === 'ok' ? 'green' : 'orange' }}>
            notif sync: {syncStatus}
          </p>
        )}
        {notifEnabled && notifPermission === 'granted' && (
          <div className="reminder-time-row">
            <label>Reminder time</label>
            <input
              type="time"
              className="time-input"
              value={reminderTime}
              onChange={e => saveReminderTime(e.target.value)}
            />
          </div>
        )}
        {notifPermission !== 'granted' && !notifEnabled && (
          <button className="btn-outline btn-sm" style={{ alignSelf: 'flex-start' }} onClick={requestNotifications}>
            <Bell size={14} /> Enable Notifications
          </button>
        )}
      </div>

      {/* About */}
      <div className="card pref-section">
        <div className="about-title">Scripture Tracker</div>
        <p className="about-text">
          A personal reading companion for the standard works of The Church of Jesus Christ of Latter-day Saints.
        </p>
        <p className="about-text" style={{ marginTop: '0.4rem' }}>
          Scripture text provided by the open-source scriptures-json project.
        </p>
        <div className="about-version">Version 1.0</div>
      </div>
    </div>
  )
}
