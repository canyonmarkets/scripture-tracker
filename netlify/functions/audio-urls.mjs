/**
 * Proxy for the Church of Jesus Christ audio API.
 * Fetches server-side to avoid CORS issues on the browser.
 * Usage: /.netlify/functions/audio-urls?uri=/scriptures/bofm/1-ne/1
 */
export async function handler(event) {
  const uri = event.queryStringParameters?.uri
  if (!uri) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing uri param' }) }
  }

  try {
    const apiUrl = `https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/content?lang=eng&uri=${uri}`
    const res = await fetch(apiUrl)
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Church API error', status: res.status }) }
    }

    const json = await res.json()
    const audioArr = json?.meta?.audio

    if (!audioArr || audioArr.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'No audio for this chapter' }) }
    }

    // Index 0 = female, index 1 = male (confirmed from API)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
      body: JSON.stringify({
        female: audioArr[0]?.mediaUrl ?? null,
        male:   audioArr[1]?.mediaUrl ?? audioArr[0]?.mediaUrl ?? null,
      }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }
  }
}
