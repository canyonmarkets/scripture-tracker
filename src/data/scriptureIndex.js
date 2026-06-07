// Verse counts per chapter for all standard works
// Source: official LDS scripture verse counts

// Words per verse averages based on full-text word counts:
//   Book of Mormon: ~267,000 words / 6,604 verses ≈ 40.4 wpv
//   New Testament:  ~138,000 words / 7,959 verses ≈ 17.3 wpv
//   Old Testament:  ~622,700 words / 23,145 verses ≈ 26.9 wpv
//   Doctrine & Covenants: ~65,000 words / 3,654 verses ≈ 17.8 wpv
export const WORDS_PER_VERSE = { bofm: 40.4, nt: 17.3, ot: 26.9, dc: 17.8 }

// Reading speed presets calibrated for devotional scripture reading —
// much slower than normal prose because readers pause, re-read, and reflect.
// Comparison: average novel reader ~250 wpm; scripture devotional ~80–130 wpm.
export const READING_SPEEDS = [
  { key: 'slow',    label: 'Slow',    wpm: 80,  note: 'Careful study — pausing, looking up references' },
  { key: 'average', label: 'Average', wpm: 115, note: 'Comfortable devotional pace with reflection' },
  { key: 'fast',    label: 'Fast',    wpm: 160, note: 'Focused reading, familiar passages' },
]

export function calcReadingTime(versesPerDay, scriptureId, wpm) {
  const wpv = WORDS_PER_VERSE[scriptureId] || 30
  const wordsPerDay = versesPerDay * wpv
  const minutes = wordsPerDay / wpm
  return minutes // fractional minutes
}

export function daysFromMinutesPerDay(minutesPerDay, scriptureId, wpm) {
  const totalVerses = getTotalVerses(scriptureId)
  const wpv = WORDS_PER_VERSE[scriptureId] || 30
  const versesPerMinute = wpm / wpv
  const versesPerDay = minutesPerDay * versesPerMinute
  return Math.ceil(totalVerses / versesPerDay)
}

export const SCRIPTURE_BOOKS = [
  {
    id: 'bofm',
    title: 'Book of Mormon',
    shortTitle: 'BoM',
    jsonUrl: 'https://raw.githubusercontent.com/bcbooks/scriptures-json/master/book-of-mormon.json',
    color: '#1a4a7a',
    books: [
      { name: '1 Nephi', chapters: [20,24,31,38,22,6,22,38,6,22,36,23,42,30,36,39,55,25,24,22,26,31] },
      { name: '2 Nephi', chapters: [31,19,25,35,34,18,19,22,54,25,4,10,9,30,32,15,55,25,14,45,29,30,13,30,16,11,22,32,13,18,20,6,15] },
      { name: 'Jacob', chapters: [36,11,28,18,19,43,27] },
      { name: 'Enos', chapters: [27] },
      { name: 'Jarom', chapters: [15] },
      { name: 'Omni', chapters: [30] },
      { name: 'Words of Mormon', chapters: [18] },
      { name: 'Mosiah', chapters: [18,32,27,30,27,7,33,21,24,26,29,24,26,12,31,19,15,35,29,26,36,31,20,23,24,32,31,29,29] },
      { name: 'Alma', chapters: [33,29,27,19,17,8,27,32,34,32,46,37,15,29,38,34,35,43,29,34,23,15,23,30,16,20,31,14,43,29,28,6,23,41,16,28,25,15,19,25,34,25,14,24,23,40,38,32,30,39,32,25,21,3] },
      { name: 'Helaman', chapters: [15,12,37,22,25,41,29,26,41,22,38,25,38,31,37,25] },
      { name: '3 Nephi', chapters: [42,26,24,35,27,18,26,25,24,19,17,18,24,31,24,15,25,32,34,46,29,25,17,25,21,24,33,40,9,33] },
      { name: '4 Nephi', chapters: [49] },
      { name: 'Mormon', chapters: [19,29,22,23,24,22,10,41,37] },
      { name: 'Ether', chapters: [43,15,28,19,6,30,27,26,35,34,23,22,31,31,34] },
      { name: 'Moroni', chapters: [22,24,16,3,36,9,10,26,26,34] },
    ],
  },
  {
    id: 'nt',
    title: 'New Testament',
    shortTitle: 'NT',
    jsonUrl: 'https://raw.githubusercontent.com/bcbooks/scriptures-json/master/new-testament.json',
    color: '#7a3a1a',
    books: [
      { name: 'Matthew', chapters: [25,23,17,25,48,34,29,34,38,42,45,27,31,32,29,27,31,25,21,23,25,39,33,21,36,21,14,26,33,25] },
      { name: 'Mark', chapters: [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20] },
      { name: 'Luke', chapters: [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53] },
      { name: 'John', chapters: [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25] },
      { name: 'Acts', chapters: [26,47,26,37,20,32,24,40,43,35,27,20,32,25,26,33,31,31,21,22,25,16,17,17,28,33,24,21,26,20,28,38,24,29,31,27] },
      { name: 'Romans', chapters: [32,29,31,25,21,23,25,39,33,21,36,21,14,26,33,25] },
      { name: '1 Corinthians', chapters: [31,16,22,24,15,29,37,28,36,50,40,28,25,28,35,26,29,32,22,27] },
      { name: '2 Corinthians', chapters: [24,17,18,18,21,18,16,24,15,18,33,21,14] },
      { name: 'Galatians', chapters: [24,21,29,31,26,18] },
      { name: 'Ephesians', chapters: [23,22,21,32,33,24] },
      { name: 'Philippians', chapters: [30,30,21,23] },
      { name: 'Colossians', chapters: [29,23,25,18] },
      { name: '1 Thessalonians', chapters: [10,20,13,18,28] },
      { name: '2 Thessalonians', chapters: [12,17,18] },
      { name: '1 Timothy', chapters: [20,15,16,16,25,21] },
      { name: '2 Timothy', chapters: [18,26,17,22] },
      { name: 'Titus', chapters: [16,15,15] },
      { name: 'Philemon', chapters: [25] },
      { name: 'Hebrews', chapters: [14,18,19,16,14,20,28,13,28,39,40,29,25] },
      { name: 'James', chapters: [27,26,18,17,20] },
      { name: '1 Peter', chapters: [25,25,22,19,14] },
      { name: '2 Peter', chapters: [21,22,18] },
      { name: '1 John', chapters: [10,29,24,21,21] },
      { name: '2 John', chapters: [13] },
      { name: '3 John', chapters: [14] },
      { name: 'Jude', chapters: [25] },
      { name: 'Revelation', chapters: [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21] },
    ],
  },
  {
    id: 'ot',
    title: 'Old Testament',
    shortTitle: 'OT',
    jsonUrl: 'https://raw.githubusercontent.com/bcbooks/scriptures-json/master/old-testament.json',
    color: '#3a6b1a',
    books: [
      { name: 'Genesis', chapters: [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26] },
      { name: 'Exodus', chapters: [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38] },
      { name: 'Leviticus', chapters: [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,24,33,3,22,16,27,25,15,27] },
      { name: 'Numbers', chapters: [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13] },
      { name: 'Deuteronomy', chapters: [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12] },
      { name: 'Joshua', chapters: [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33] },
      { name: 'Judges', chapters: [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25] },
      { name: 'Ruth', chapters: [22,23,18,22] },
      { name: '1 Samuel', chapters: [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13] },
      { name: '2 Samuel', chapters: [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25] },
      { name: '1 Kings', chapters: [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53] },
      { name: '2 Kings', chapters: [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30] },
      { name: '1 Chronicles', chapters: [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30] },
      { name: '2 Chronicles', chapters: [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23] },
      { name: 'Ezra', chapters: [11,70,13,24,17,22,28,36,15,44] },
      { name: 'Nehemiah', chapters: [11,20,32,23,19,19,73,18,38,39,36,47,31] },
      { name: 'Esther', chapters: [22,28,23,23,10,21,22,27,30,22] },
      { name: 'Job', chapters: [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17] },
      { name: 'Psalms', chapters: [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,13,25,11,22,23,28,13,40,23,14,18,14,12,5,27,18,12,10,15,21,23,21,11,7,9,24,14,12,12,18,14,9,13,12,11,14,20,8,36,37,6,24,20,28,23,11,13,21,72,13,20,17,8,19,13,14,17,7,19,53,17,16,16,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,14,10,8,12,15,21,10,20,14,9,6] },
      { name: 'Proverbs', chapters: [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,62,29,26] },
      { name: 'Ecclesiastes', chapters: [18,26,22,16,20,12,29,17,18,20,10,14] },
      { name: 'Song of Solomon', chapters: [17,17,11,16,16,13,13,14] },
      { name: 'Isaiah', chapters: [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24] },
      { name: 'Jeremiah', chapters: [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,15,22,21,29,29,35,29,26,28,20,32,20,18,32,21,32,12,8,44,37,27,47,39,34,16,31,22,14,25,35,8] },
      { name: 'Lamentations', chapters: [22,22,66,22,22] },
      { name: 'Ezekiel', chapters: [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35] },
      { name: 'Daniel', chapters: [21,49,30,37,31,28,28,27,27,21,45,13] },
      { name: 'Hosea', chapters: [11,23,5,19,15,11,16,14,17,15,12,14,16,9] },
      { name: 'Joel', chapters: [20,32,21] },
      { name: 'Amos', chapters: [15,16,15,13,27,14,17,14,15] },
      { name: 'Obadiah', chapters: [21] },
      { name: 'Jonah', chapters: [17,10,10,11] },
      { name: 'Micah', chapters: [16,13,12,13,15,16,20] },
      { name: 'Nahum', chapters: [15,13,19] },
      { name: 'Habakkuk', chapters: [17,20,19] },
      { name: 'Zephaniah', chapters: [18,15,20] },
      { name: 'Haggai', chapters: [15,23] },
      { name: 'Zechariah', chapters: [21,13,10,14,11,15,14,23,17,12,17,14,9,21] },
      { name: 'Malachi', chapters: [14,17,18,6] },
    ],
  },
  {
    id: 'dc',
    title: 'Doctrine & Covenants',
    shortTitle: 'D&C',
    jsonUrl: 'https://raw.githubusercontent.com/bcbooks/scriptures-json/master/doctrine-and-covenants.json',
    color: '#4a1a7a',
    books: [
      { name: 'Doctrine and Covenants', chapters: [39,1,28,7,35,37,8,13,14,70,30,8,4,11,73,35,16,47,41,4,6,23,7,56,16,19,7,16,50,24,13,5,16,4,7,43,17,12,23,6,22,17,19,29,35,44,8,6,35,46,22,33,16,15,20,20,11,65,24,17,21,46,66,43,43,22,12,35,29,18,21,30,28,97,25,25,23,10,31,20] },
    ],
  },
]

export function getTotalVerses(scriptureId) {
  const scripture = SCRIPTURE_BOOKS.find(s => s.id === scriptureId)
  if (!scripture) return 0
  return scripture.books.reduce((total, book) => {
    return total + book.chapters.reduce((t, v) => t + v, 0)
  }, 0)
}

export function getChapterList(scriptureId) {
  const scripture = SCRIPTURE_BOOKS.find(s => s.id === scriptureId)
  if (!scripture) return []
  const list = []
  scripture.books.forEach(book => {
    book.chapters.forEach((verseCount, idx) => {
      list.push({
        book: book.name,
        chapter: idx + 1,
        verseCount,
        ref: `${book.name} ${idx + 1}`,
      })
    })
  })
  return list
}

export function buildReadingPlan(scriptureId, totalDays) {
  const chapters = getChapterList(scriptureId)
  const totalVerses = chapters.reduce((t, c) => t + c.verseCount, 0)
  const versesPerDay = Math.ceil(totalVerses / totalDays)

  const days = []
  let dayVerses = 0
  let dayChapters = []

  chapters.forEach(ch => {
    dayVerses += ch.verseCount
    dayChapters.push(ch.ref)
    if (dayVerses >= versesPerDay) {
      days.push({ chapters: dayChapters, verses: dayVerses })
      dayVerses = 0
      dayChapters = []
    }
  })
  if (dayChapters.length > 0) {
    days.push({ chapters: dayChapters, verses: dayVerses })
  }
  return { days, totalVerses, versesPerDay }
}
