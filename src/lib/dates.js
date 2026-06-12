// Date keys must use the device's LOCAL calendar day. toISOString() gives the
// UTC day, which in US timezones rolls over at ~5pm local — evening reads were
// being recorded under tomorrow's date, breaking the streak and heatmap.
export function localDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// One-time repair of read days recorded with UTC keys. An evening reader's
// history has the telltale signature: the plan's first day is missing but the
// day after creation is present (every mark landed one day late). When we see
// that, shift the whole set back one day. Runs before React renders.
export function migrateUtcReadDays() {
  try {
    if (localStorage.getItem('st_dateFix_v1')) return
    const plans = JSON.parse(localStorage.getItem('st_plans') || '[]')
    const readDays = JSON.parse(localStorage.getItem('st_readDays') || '{}')
    let changed = false

    for (const plan of plans) {
      const days = readDays[plan.id]
      if (!Array.isArray(days) || days.length === 0) continue
      const created = new Date(plan.createdAt)
      created.setHours(0, 0, 0, 0)
      const createdKey = localDateKey(created)
      const dayAfterKey = localDateKey(new Date(created.getTime() + 86400000))
      if (!days.includes(createdKey) && days.includes(dayAfterKey)) {
        readDays[plan.id] = [...new Set(days.map(k => {
          const d = new Date(k + 'T00:00:00')
          d.setDate(d.getDate() - 1)
          return localDateKey(d)
        }))].sort()
        changed = true
      }
    }

    if (changed) localStorage.setItem('st_readDays', JSON.stringify(readDays))
    localStorage.setItem('st_dateFix_v1', 'true')
  } catch {
    // never block app startup over a repair pass
  }
}
