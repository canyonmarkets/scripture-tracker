/**
 * Fetches audio URLs from the Church of Jesus Christ's public content API.
 * Returns male and female narrator MP3 URLs for any scripture chapter.
 *
 * API: https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/content?lang=eng&uri=/scriptures/{path}
 */

// Maps book names (as used in our app) to the Church's URL slug format
const BOOK_SLUGS = {
  // Book of Mormon
  '1 Nephi':          '1-ne',
  '2 Nephi':          '2-ne',
  'Jacob':            'jacob',
  'Enos':             'enos',
  'Jarom':            'jarom',
  'Omni':             'omni',
  'Words of Mormon':  'w-of-m',
  'Mosiah':           'mosiah',
  'Alma':             'alma',
  'Helaman':          'hel',
  '3 Nephi':          '3-ne',
  '4 Nephi':          '4-ne',
  'Mormon':           'morm',
  'Ether':            'ether',
  'Moroni':           'moro',

  // Old Testament
  'Genesis':          'gen',
  'Exodus':           'ex',
  'Leviticus':        'lev',
  'Numbers':          'num',
  'Deuteronomy':      'deut',
  'Joshua':           'josh',
  'Judges':           'judg',
  'Ruth':             'ruth',
  '1 Samuel':         '1-sam',
  '2 Samuel':         '2-sam',
  '1 Kings':          '1-kgs',
  '2 Kings':          '2-kgs',
  '1 Chronicles':     '1-chr',
  '2 Chronicles':     '2-chr',
  'Ezra':             'ezra',
  'Nehemiah':         'neh',
  'Esther':           'esth',
  'Job':              'job',
  'Psalms':           'ps',
  'Proverbs':         'prov',
  'Ecclesiastes':     'eccl',
  'Song of Solomon':  'song',
  'Isaiah':           'isa',
  'Jeremiah':         'jer',
  'Lamentations':     'lam',
  'Ezekiel':          'ezek',
  'Daniel':           'dan',
  'Hosea':            'hosea',
  'Joel':             'joel',
  'Amos':             'amos',
  'Obadiah':          'obad',
  'Jonah':            'jonah',
  'Micah':            'micah',
  'Nahum':            'nahum',
  'Habakkuk':         'hab',
  'Zephaniah':        'zeph',
  'Haggai':           'hag',
  'Zechariah':        'zech',
  'Malachi':          'mal',

  // New Testament
  'Matthew':          'matt',
  'Mark':             'mark',
  'Luke':             'luke',
  'John':             'john',
  'Acts':             'acts',
  'Romans':           'rom',
  '1 Corinthians':    '1-cor',
  '2 Corinthians':    '2-cor',
  'Galatians':        'gal',
  'Ephesians':        'eph',
  'Philippians':      'philip',
  'Colossians':       'col',
  '1 Thessalonians':  '1-thes',
  '2 Thessalonians':  '2-thes',
  '1 Timothy':        '1-tim',
  '2 Timothy':        '2-tim',
  'Titus':            'titus',
  'Philemon':         'philem',
  'Hebrews':          'heb',
  'James':            'james',
  '1 Peter':          '1-pet',
  '2 Peter':          '2-pet',
  '1 John':           '1-jn',
  '2 John':           '2-jn',
  '3 John':           '3-jn',
  'Jude':             'jude',
  'Revelation':       'rev',

  // Doctrine & Covenants
  'Doctrine and Covenants': 'dc',
}

// Maps scriptureId to the Church's URL path prefix
const SCRIPTURE_PATH = {
  bofm: 'bofm',
  nt:   'nt',
  ot:   'ot',
  dc:   'dc-testament',
}

// In-memory cache so we don't re-fetch the same chapter
const audioCache = new Map()

/**
 * Returns { male, female } MP3 URLs for a chapter, or null if unavailable.
 * @param {string} scriptureId - 'bofm' | 'nt' | 'ot' | 'dc'
 * @param {string} bookName    - e.g. '1 Nephi', 'Genesis'
 * @param {number} chapter     - chapter number
 */
export function clearAudioCache(scriptureId, bookName, chapter) {
  const bookSlug = BOOK_SLUGS[bookName]
  const pathPrefix = SCRIPTURE_PATH[scriptureId]
  if (bookSlug && pathPrefix) {
    audioCache.delete(`/scriptures/${pathPrefix}/${bookSlug}/${chapter}`)
  }
}

export async function getChapterAudio(scriptureId, bookName, chapter) {
  const bookSlug = BOOK_SLUGS[bookName]
  if (!bookSlug) return null

  const pathPrefix = SCRIPTURE_PATH[scriptureId]
  if (!pathPrefix) return null

  const uri = `/scriptures/${pathPrefix}/${bookSlug}/${chapter}`
  const cacheKey = uri

  if (audioCache.has(cacheKey)) return audioCache.get(cacheKey)

  try {
    const url = `https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/content?lang=eng&uri=${uri}`
    const res = await fetch(url)
    if (!res.ok) return null

    const json = await res.json()
    const audioArr = json?.meta?.audio

    if (!audioArr || audioArr.length === 0) {
      audioCache.set(cacheKey, null)
      return null
    }

    // The API returns 2 entries: index 0 = male, index 1 = female (consistent across all chapters)
    const result = {
      male:   audioArr[0]?.mediaUrl ?? null,
      female: audioArr[1]?.mediaUrl ?? audioArr[0]?.mediaUrl ?? null,
    }

    audioCache.set(cacheKey, result)
    return result
  } catch {
    return null
  }
}
