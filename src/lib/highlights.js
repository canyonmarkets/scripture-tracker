/**
 * Highlight + note storage, keyed per scripture / book / chapter.
 * Each entry: { color: 'yellow'|'green'|'blue'|'pink', note: string }
 * Stored as: st_hi_{scriptureId}_{bookName}_{chapter} → JSON object { [verseNum]: entry }
 */

function storageKey(scriptureId, bookName, chapter) {
  return `st_hi_${scriptureId}_${bookName}_${chapter}`
}

export function getHighlights(scriptureId, bookName, chapter) {
  try {
    const raw = localStorage.getItem(storageKey(scriptureId, bookName, chapter))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function setHighlight(scriptureId, bookName, chapter, verseNum, color, note = '') {
  const highlights = getHighlights(scriptureId, bookName, chapter)
  highlights[verseNum] = { color, note }
  localStorage.setItem(storageKey(scriptureId, bookName, chapter), JSON.stringify(highlights))
}

export function updateNote(scriptureId, bookName, chapter, verseNum, note) {
  const highlights = getHighlights(scriptureId, bookName, chapter)
  if (highlights[verseNum]) {
    highlights[verseNum].note = note
  } else {
    highlights[verseNum] = { color: 'yellow', note }
  }
  localStorage.setItem(storageKey(scriptureId, bookName, chapter), JSON.stringify(highlights))
}

export function clearHighlight(scriptureId, bookName, chapter, verseNum) {
  const highlights = getHighlights(scriptureId, bookName, chapter)
  delete highlights[verseNum]
  localStorage.setItem(storageKey(scriptureId, bookName, chapter), JSON.stringify(highlights))
}
