import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function readBody(req: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function reson8Hear(): Plugin {
  return {
    name: 'reson8-hear',
    configureServer(server) {
      server.middlewares.use('/api/hear', async (req, res) => {
        const response = res as ServerResponse
        if (req.method !== 'POST') {
          response.statusCode = 405
          response.end()
          return
        }
        const env = loadEnv(server.config.mode, process.cwd(), '')
        const key = env.RESON8_API_KEY
        if (!key) {
          response.statusCode = 500
          response.end(JSON.stringify({ text: '' }))
          return
        }
        const audio = await readBody(req)
        const language = new URL(req.url || '', 'http://local').searchParams.get('language') || 'de'
        const upstream = await fetch(
          `https://api.reson8.dev/v1/speech-to-text/prerecorded?language=${encodeURIComponent(language)}`,
          {
            method: 'POST',
            headers: {
              Authorization: `ApiKey ${key}`,
              'Content-Type': 'application/octet-stream',
            },
            body: audio,
          },
        )
        const payload = (await upstream.json().catch(() => ({}))) as { text?: string }
        response.statusCode = upstream.ok ? 200 : upstream.status
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({ text: payload.text || '' }))
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), reson8Hear()],
  server: { port: 5179, strictPort: true },
})
