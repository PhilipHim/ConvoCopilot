export default async function handler(request) {
  if (request.method !== 'POST') {
    return Response.json({ text: '' }, { status: 405 })
  }

  const language = new URL(request.url).searchParams.get('language') || 'de'
  const audio = await request.arrayBuffer()
  const upstream = await fetch(
    `https://api.reson8.dev/v1/speech-to-text/prerecorded?language=${encodeURIComponent(language)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `ApiKey ${process.env.RESON8_API_KEY}`,
        'Content-Type': 'application/octet-stream',
      },
      body: audio,
    },
  )
  const payload = await upstream.json().catch(() => ({}))
  return Response.json(
    { text: payload.text || '' },
    { status: upstream.ok ? 200 : upstream.status },
  )
}
