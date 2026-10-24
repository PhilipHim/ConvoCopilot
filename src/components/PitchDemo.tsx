import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mic } from 'lucide-react'
import { CocoMark } from './CocoMark'
import { GlassButton } from '../product/components/GlassButton'

type LangId = 'en' | 'de' | 'fr' | 'es'
type Pane = 'demo' | 'example' | 'learning' | 'personal' | 'context'

type MemoryWord = {
  id: string
  said: string
  answer: string
  count: number
}

type Lang = {
  id: LangId
  label: string
  spoken: string
  speech: string
}

type Word = {
  text: string
  keys: string[]
}

type Prompt = {
  id: string
  words: Record<LangId, Word>
  frames: Record<LangId, string>
}

type Line = {
  id: string
  sentence: string
  said: string
  answer: string
  keys: string[]
}

const LANGS: Lang[] = [
  { id: 'en', label: 'English', spoken: 'English', speech: 'en-US' },
  { id: 'de', label: 'Deutsch', spoken: 'German', speech: 'de-DE' },
  { id: 'fr', label: 'Français', spoken: 'French', speech: 'fr-FR' },
  { id: 'es', label: 'Español', spoken: 'Spanish', speech: 'es-ES' },
]

const PROMPTS: Prompt[] = [
  {
    id: 'cozy',
    words: {
      en: { text: 'cozy', keys: ['cozy'] },
      de: { text: 'gemütlich', keys: ['gemutlich'] },
      fr: { text: 'confortable', keys: ['confortable'] },
      es: { text: 'acogedor', keys: ['acogedor'] },
    },
    frames: {
      en: 'The café was really {word}.',
      de: 'Das Café war wirklich {word}.',
      fr: 'Le café était vraiment {word}.',
      es: 'El café era muy {word}.',
    },
  },
  {
    id: 'exhausted',
    words: {
      en: { text: 'exhausted', keys: ['exhausted'] },
      de: { text: 'erschöpft', keys: ['erschopft', 'erschoepft'] },
      fr: { text: 'épuisé', keys: ['epuise'] },
      es: { text: 'agotado', keys: ['agotado'] },
    },
    frames: {
      en: 'After an hour I was {word}.',
      de: 'Nach einer Stunde war ich {word}.',
      fr: "Après une heure, j'étais {word}.",
      es: 'Después de una hora estaba {word}.',
    },
  },
  {
    id: 'interrupt',
    words: {
      en: { text: 'interrupt', keys: ['interrupt'] },
      de: { text: 'unterbrechen', keys: ['unterbrechen', 'unterbricht'] },
      fr: { text: 'interrompre', keys: ['interrompre', 'interromps'] },
      es: { text: 'interrumpir', keys: ['interrumpir', 'interrumpo'] },
    },
    frames: {
      en: 'Sorry, I have to {word}.',
      de: 'Tut mir leid, ich muss {word}.',
      fr: 'Désolé, je dois {word}.',
      es: 'Perdón, tengo que {word}.',
    },
  },
  {
    id: 'arrange',
    words: {
      en: { text: 'arrange', keys: ['arrange'] },
      de: { text: 'vereinbaren', keys: ['vereinbaren', 'vereinbart'] },
      fr: { text: 'convenir', keys: ['convenir', 'convient'] },
      es: { text: 'acordar', keys: ['acordar', 'acordamos'] },
    },
    frames: {
      en: 'Can we {word} a time?',
      de: 'Können wir einen Termin {word}?',
      fr: 'On peut {word} une heure ?',
      es: '¿Podemos {word} una hora?',
    },
  },
  {
    id: 'delayed',
    words: {
      en: { text: 'delayed', keys: ['delayed'] },
      de: { text: 'verspätet', keys: ['verspatet', 'verspaetet'] },
      fr: { text: 'en retard', keys: ['en retard', 'retard'] },
      es: { text: 'retrasado', keys: ['retrasado', 'retraso'] },
    },
    frames: {
      en: 'The train is {word}.',
      de: 'Der Zug ist {word}.',
      fr: 'Le train est {word}.',
      es: 'El tren está {word}.',
    },
  },
  {
    id: 'bill',
    words: {
      en: { text: 'bill', keys: ['bill'] },
      de: { text: 'Rechnung', keys: ['rechnung'] },
      fr: { text: "l'addition", keys: ['addition', 'laddition'] },
      es: { text: 'la cuenta', keys: ['la cuenta', 'cuenta'] },
    },
    frames: {
      en: 'Could I have the {word}?',
      de: 'Kann ich die {word} haben?',
      fr: "Je voudrais {word}, s'il vous plaît.",
      es: '¿Me trae {word}, por favor?',
    },
  },
  {
    id: 'recommend',
    words: {
      en: { text: 'recommend', keys: ['recommend'] },
      de: { text: 'empfehlen', keys: ['empfehlen', 'empfehl'] },
      fr: { text: 'recommander', keys: ['recommander', 'recommand'] },
      es: { text: 'recomendar', keys: ['recomendar', 'recomiend'] },
    },
    frames: {
      en: 'What would you {word}?',
      de: 'Was würdest du {word}?',
      fr: 'Tu peux {word} un café ?',
      es: '¿Puedes {word} un café?',
    },
  },
  {
    id: 'postpone',
    words: {
      en: { text: 'postpone', keys: ['postpone'] },
      de: { text: 'verschieben', keys: ['verschieben', 'verschiebt'] },
      fr: { text: 'reporter', keys: ['reporter', 'reporte'] },
      es: { text: 'aplazar', keys: ['aplazar'] },
    },
    frames: {
      en: 'We need to {word} the meeting.',
      de: 'Wir müssen das Treffen {word}.',
      fr: 'Il faut {word} la réunion.',
      es: 'Tenemos que {word} la reunión.',
    },
  },
]

type SpeechRec = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((ev: SpeechRecEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

type SpeechRecEvent = {
  results: ArrayLike<{
    0?: { transcript?: string }
  }>
}

function langById(id: LangId) {
  return LANGS.find((item) => item.id === id) ?? LANGS[0]
}

function otherLang(id: LangId): LangId {
  return LANGS.find((item) => item.id !== id)?.id ?? 'en'
}

function linesFor(learn: LangId, native: LangId): Line[] {
  return PROMPTS.map((prompt) => {
    const said = prompt.words[native]
    const answer = prompt.words[learn]
    return {
      id: prompt.id,
      sentence: prompt.frames[learn].replace('{word}', said.text),
      said: said.text,
      answer: answer.text,
      keys: said.keys,
    }
  })
}

function recognitionCtor(): (new () => SpeechRec) | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRec
    webkitSpeechRecognition?: new () => SpeechRec
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function fold(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[''`´]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchLine(lines: Line[], transcript: string) {
  const heard = fold(transcript)
  if (!heard) return null
  const ranked = [...lines].sort((a, b) => {
    const longest = (line: Line) => Math.max(...line.keys.map((key) => fold(key).length))
    return longest(b) - longest(a)
  })
  return ranked.find((line) => line.keys.some((key) => heard.includes(fold(key)))) ?? null
}

function voiceFor(speechLang: string) {
  const voices = window.speechSynthesis?.getVoices() ?? []
  const wanted = speechLang.toLowerCase()
  const prefix = wanted.slice(0, 2)
  return (
    voices.find((voice) => voice.lang.toLowerCase().replace('_', '-') === wanted) ??
    voices.find((voice) => voice.lang.toLowerCase().replace('_', '-').startsWith(prefix))
  )
}

function speakIn(word: string, speechLang: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = speechLang
  utterance.rate = 0.92
  const voice = voiceFor(speechLang)
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}

let micPrimed = false

async function primeMic() {
  if (micPrimed) return
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  stream.getTracks().forEach((track) => track.stop())
  micPrimed = true
}

function encodeWav(samples: Float32Array, sampleRate: number) {
  const targetRate = 16000
  const length = Math.max(1, Math.floor((samples.length * targetRate) / sampleRate))
  const pcm = new Int16Array(length)
  for (let i = 0; i < length; i++) {
    const index = Math.min(samples.length - 1, Math.floor((i * sampleRate) / targetRate))
    const sample = Math.max(-1, Math.min(1, samples[index] || 0))
    pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
  }
  const buffer = new ArrayBuffer(44 + pcm.length * 2)
  const view = new DataView(buffer)
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }
  write(0, 'RIFF')
  view.setUint32(4, 36 + pcm.length * 2, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, targetRate, true)
  view.setUint32(28, targetRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, pcm.length * 2, true)
  for (let i = 0; i < pcm.length; i++) view.setInt16(44 + i * 2, pcm[i], true)
  return new Blob([buffer], { type: 'audio/wav' })
}

export function PitchDemo() {
  const [pane, setPane] = useState<Pane>('demo')
  const [learn, setLearn] = useState<LangId>('en')
  const [native, setNative] = useState<LangId>('de')
  const [holding, setHolding] = useState(false)
  const [heard, setHeard] = useState('')
  const [hit, setHit] = useState<Line | null>(null)
  const [memory, setMemory] = useState<MemoryWord[]>([])
  const [micError, setMicError] = useState('')
  const holdingRef = useRef(false)
  const wantHoldRef = useRef(false)
  const heardRef = useRef('')
  const learnRef = useRef<LangId>('en')
  const nativeRef = useRef<LangId>('de')
  const recRef = useRef<SpeechRec | null>(null)
  const captureRef = useRef<{
    ctx: AudioContext
    stream: MediaStream
    chunks: Float32Array[]
    rate: number
  } | null>(null)
  learnRef.current = learn
  nativeRef.current = native

  function clearRound() {
    setHit(null)
    setHeard('')
  }

  function openPane(next: Pane) {
    if (next !== 'demo') endHold()
    setPane(next)
  }

  function pickLearn(next: LangId) {
    setLearn(next)
    if (next === nativeRef.current) setNative(otherLang(next))
    clearRound()
  }

  function pickNative(next: LangId) {
    if (next === learnRef.current) return
    setNative(next)
    clearRound()
  }

  function finish(transcript: string) {
    const lines = linesFor(learnRef.current, nativeRef.current)
    const found = matchLine(lines, transcript)
    setHeard(transcript.trim())
    setHit(found)
    setHolding(false)
    if (found) {
      setMemory((prev) => {
        const existing = prev.find((item) => item.id === found.id)
        if (!existing) {
          return [...prev, { id: found.id, said: found.said, answer: found.answer, count: 1 }]
        }
        return prev.map((item) =>
          item.id === found.id ? { ...item, count: item.count + 1 } : item,
        )
      })
      speakIn(found.answer, langById(learnRef.current).speech)
    }
  }

  function ensureRecognition() {
    const Ctor = recognitionCtor()
    if (!Ctor) return null
    if (!recRef.current) {
      const rec = new Ctor()
      rec.interimResults = true
      rec.continuous = true
      rec.onresult = (event) => {
        let text = ''
        for (let i = 0; i < event.results.length; i++) {
          text += `${event.results[i][0]?.transcript ?? ''} `
        }
        heardRef.current = text
        setHeard(text.trim())
      }
      rec.onend = () => {
        if (holdingRef.current) {
          try {
            rec.start()
          } catch {
            /* Chrome throws if start overlaps stop. */
          }
          return
        }
        finish(heardRef.current)
      }
      rec.onerror = () => {
        if (!holdingRef.current) finish(heardRef.current)
      }
      recRef.current = rec
    }
    recRef.current.lang = langById(nativeRef.current).speech
    return recRef.current
  }

  async function startHold() {
    if (holdingRef.current) return
    wantHoldRef.current = true
    if (!micPrimed) {
      try {
        await primeMic()
        setMicError('Microphone allowed. Hold to speak.')
      } catch {
        setMicError('Allow the microphone, then hold.')
      }
      wantHoldRef.current = false
      return
    }
    setMicError('')
    setHit(null)
    setHeard('')
    heardRef.current = ''
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!wantHoldRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      const ctx = new AudioContext()
      await ctx.resume()
      const source = ctx.createMediaStreamSource(stream)
      const proc = ctx.createScriptProcessor(4096, 1, 1)
      const gain = ctx.createGain()
      gain.gain.value = 0
      const chunks: Float32Array[] = []
      proc.onaudioprocess = (event) => {
        chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)))
      }
      source.connect(proc)
      proc.connect(gain)
      gain.connect(ctx.destination)
      captureRef.current = { ctx, stream, chunks, rate: ctx.sampleRate }
      holdingRef.current = true
      setHolding(true)
    } catch {
      setMicError('Allow the microphone, then hold.')
    }
  }

  async function endHold() {
    wantHoldRef.current = false
    if (!holdingRef.current) return
    holdingRef.current = false
    setHolding(false)
    const capture = captureRef.current
    captureRef.current = null
    if (!capture) return
    capture.stream.getTracks().forEach((track) => track.stop())
    const length = capture.chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const samples = new Float32Array(length)
    let offset = 0
    for (const chunk of capture.chunks) {
      samples.set(chunk, offset)
      offset += chunk.length
    }
    void capture.ctx.close()
    const wav = encodeWav(samples, capture.rate)
    try {
      const response = await fetch(`/api/hear?language=${langById(nativeRef.current).id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'audio/wav' },
        body: wav,
      })
      const payload = (await response.json()) as { text?: string }
      finish(payload.text || '')
    } catch {
      setMicError('Reson8 did not hear that. Hold a little longer.')
    }
  }

  useEffect(() => {
    window.speechSynthesis?.getVoices()
    const warmVoices = () => {
      window.speechSynthesis?.getVoices()
    }
    window.speechSynthesis?.addEventListener('voiceschanged', warmVoices)
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== 'Space' || event.repeat) return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      event.preventDefault()
      startHold()
    }
    function onKeyUp(event: KeyboardEvent) {
      if (event.code !== 'Space') return
      event.preventDefault()
      endHold()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', warmVoices)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      holdingRef.current = false
      try {
        recRef.current?.stop()
      } catch {
        /* already stopped */
      }
      window.speechSynthesis?.cancel()
    }
  }, [])

  const lines = linesFor(learn, native)
  const learnLang = langById(learn)
  const nativeLang = langById(native)
  const nativeChoices = LANGS.filter((item) => item.id !== learn)

  return (
    <div className="product-app min-h-svh bg-paper text-ink">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 text-ink">
            <CocoMark className="h-9 w-9" />
            <span className="font-display text-lg leading-none">Demo</span>
          </Link>
          <nav className="flex rounded-full bg-[#fffdf9] p-1" aria-label="Demo sections">
            {(
              [
                ['demo', 'Panic'],
                ['context', 'Context'],
                ['example', 'Example'],
                ['learning', 'Learning'],
                ['personal', 'Personal'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => openPane(id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition sm:px-4 ${
                  pane === id ? 'bg-[#0c0dd7] text-white' : 'text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </header>

        {pane === 'demo' || pane === 'learning' ? (
          <div className="mt-6 flex flex-col gap-3">
            <LangRow label="I want to learn" value={learn} options={LANGS} onPick={pickLearn} />
            <LangRow
              label="My language"
              value={native}
              options={nativeChoices}
              onPick={pickNative}
            />
          </div>
        ) : null}

        {pane === 'example' ? <ExampleClips /> : null}
        {pane === 'learning' ? (
          <LearningPane learn={learn} native={native} learnSpeech={learnLang.speech} spoken={learnLang.spoken} />
        ) : null}
        {pane === 'personal' ? (
          <PersonalPane
            memory={memory}
            onReplay={(word) => speakIn(word, learnLang.speech)}
          />
        ) : null}
        {pane === 'context' ? <ContextPane /> : null}

        {pane === 'demo' ? (
          <>
        <p className="mt-8 max-w-2xl text-lg leading-snug text-ink">
          Headphones on. Hold the mic, say the blue word in {nativeLang.spoken}, then say it yourself in {learnLang.spoken}.
        </p>

        <div className="mt-8 grid flex-1 items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <ol className="space-y-3">
            {lines.map((line) => {
              const active = hit?.id === line.id
              const at = line.sentence.toLowerCase().indexOf(line.said.toLowerCase())
              const before = at >= 0 ? line.sentence.slice(0, at) : line.sentence
              const match = at >= 0 ? line.sentence.slice(at, at + line.said.length) : ''
              const after = at >= 0 ? line.sentence.slice(at + line.said.length) : ''
              return (
                <li
                  key={line.id}
                  className={`rounded-2xl border px-4 py-3 text-base leading-relaxed ${
                    active ? 'border-[#0c0dd7] bg-white' : 'border-line/80 bg-[#fffdf9]'
                  }`}
                >
                  {before}
                  {match ? <span className="font-semibold text-[#0c0dd7]">{match}</span> : null}
                  {after}
                </li>
              )
            })}
          </ol>

          <div className="flex flex-col items-center justify-center gap-8 lg:sticky lg:top-8 lg:pt-6">
            <p className="font-display min-h-[4.5rem] text-center text-5xl leading-none tracking-tight sm:text-6xl">
              {hit ? hit.answer : holding ? 'Listening' : 'Your word'}
            </p>
            <GlassButton
              aria-pressed={holding}
              onPointerDown={() => {
                void startHold()
              }}
              onPointerUp={() => {
                void endHold()
              }}
              onPointerCancel={() => {
                void endHold()
              }}
            >
              <Mic className="h-8 w-8" aria-hidden />
              <span className="sr-only">{holding ? 'Release to stop' : 'Hold to speak'}</span>
            </GlassButton>
            <p className="max-w-xs text-center text-sm text-muted">
              {micError ||
                (heard
                  ? `Heard: ${heard}`
                  : 'Tap once to allow the mic. Then hold, or hold the space bar.')}
            </p>
          </div>
        </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

function LangRow({
  label,
  value,
  options,
  onPick,
}: {
  label: string
  value: LangId
  options: Lang[]
  onPick: (id: LangId) => void
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-36 shrink-0 text-sm font-medium text-muted">{label}</span>
      <div className="flex flex-wrap rounded-full bg-[#fffdf9] p-1">
        {options.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(item.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition sm:px-4 ${
              value === item.id ? 'bg-[#0c0dd7] text-white' : 'text-ink'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const CLIPS = [
  {
    src: '/clips/outside.mp4',
    poster: '/clips/outside.jpg',
    caption:
      'She is using Coco with a headphone in her ear. The missing word comes in quietly, and she says it herself.',
  },
  {
    src: '/clips/ear.mp4',
    poster: '/clips/ear.jpg',
    caption:
      'He is using Coco the same way. Headphone in, the word is whispered, and he keeps the sentence going.',
  },
]

function ExampleClips() {
  return (
    <section className="mt-8">
      <p className="max-w-2xl text-lg leading-snug text-ink">
        Two examples of how this looks in a real conversation.
      </p>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {CLIPS.map((clip) => (
          <figure key={clip.src} className="overflow-hidden rounded-2xl bg-[#fffdf9]">
            <video
              src={clip.src}
              poster={clip.poster}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-black object-cover"
            />
            <figcaption className="px-4 py-4 text-sm leading-relaxed text-ink">
              {clip.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

const CONTEXT_SCENES = [
  {
    say: 'The train is',
    keys: ['train'],
    line: 'The train is …',
    sets: [
      ['delayed', 'cancelled', 'full'],
      ['late', 'crowded', 'here'],
    ],
  },
  {
    say: 'We finished dinner, could I have the',
    keys: ['dinner', 'finished', 'have the'],
    line: 'We finished dinner. Could I have the …',
    note: 'The plates are empty. You want to pay.',
    sets: [
      ['bill', 'receipt', 'check'],
      ['menu', 'water', 'table'],
    ],
  },
  {
    say: 'In the restaurant I have to',
    keys: ['have to', 'restaurant'],
    line: 'In the restaurant I have to …',
    sets: [
      ['wait', 'order', 'pay'],
      ['leave', 'sit', 'ask'],
    ],
  },
]

function ContextPane() {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [setIndex, setSetIndex] = useState(0)
  const [phase, setPhase] = useState<'say' | 'wait' | 'words'>('say')
  const [holding, setHolding] = useState(false)
  const [heard, setHeard] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [miss, setMiss] = useState('')
  const holdingRef = useRef(false)
  const wantHoldRef = useRef(false)
  const captureRef = useRef<{
    ctx: AudioContext
    stream: MediaStream
    chunks: Float32Array[]
    rate: number
  } | null>(null)
  const scene = CONTEXT_SCENES[sceneIndex]
  const words = scene.sets[setIndex] ?? scene.sets[0]

  async function startListen() {
    if (holdingRef.current) return
    wantHoldRef.current = true
    if (!micPrimed) {
      try {
        await primeMic()
        setMiss('Microphone allowed. Hold and say the line.')
      } catch {
        setMiss('Allow the microphone, then hold.')
      }
      wantHoldRef.current = false
      return
    }
    setMiss('')
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    if (!wantHoldRef.current) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }
    const ctx = new AudioContext()
    await ctx.resume()
    const source = ctx.createMediaStreamSource(stream)
    const proc = ctx.createScriptProcessor(4096, 1, 1)
    const gain = ctx.createGain()
    gain.gain.value = 0
    const chunks: Float32Array[] = []
    proc.onaudioprocess = (event) => {
      chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)))
    }
    source.connect(proc)
    proc.connect(gain)
    gain.connect(ctx.destination)
    captureRef.current = { ctx, stream, chunks, rate: ctx.sampleRate }
    holdingRef.current = true
    setHolding(true)
  }

  async function stopListen() {
    wantHoldRef.current = false
    if (!holdingRef.current) return
    holdingRef.current = false
    setHolding(false)
    const capture = captureRef.current
    captureRef.current = null
    if (!capture) return
    capture.stream.getTracks().forEach((track) => track.stop())
    const length = capture.chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const samples = new Float32Array(length)
    let offset = 0
    for (const chunk of capture.chunks) {
      samples.set(chunk, offset)
      offset += chunk.length
    }
    void capture.ctx.close()
    const wav = encodeWav(samples, capture.rate)
    const response = await fetch('/api/hear?language=en', {
      method: 'POST',
      headers: { 'Content-Type': 'audio/wav' },
      body: wav,
    })
    const payload = (await response.json()) as { text?: string }
    const text = (payload.text || '').trim()
    setHeard(text)
    const heardFold = fold(text)

    if (phase === 'words') {
      const hit = words.find((word) => heardFold.includes(fold(word)))
      if (hit) {
        setPicked(hit)
        speakIn(hit, 'en-US')
      }
      return
    }

    const matched = scene.keys.some((key) => heardFold.includes(fold(key)))
    if (!matched) {
      setMiss('Say the start of the sentence, then let go.')
      return
    }
    setPhase('wait')
    window.setTimeout(() => setPhase('words'), 1000)
  }

  function nextSet() {
    setPicked(null)
    setSetIndex((n) => (n + 1) % scene.sets.length)
  }

  function nextScene() {
    setSceneIndex((n) => (n + 1) % CONTEXT_SCENES.length)
    setSetIndex(0)
    setPhase('say')
    setPicked(null)
    setHeard('')
    setMiss('')
  }

  return (
    <section className="mt-8 max-w-xl">
      <p className="mt-6 text-lg leading-snug text-ink">
        Hold and say the line. One second later, three words.
      </p>
      <div className="mt-8 grid flex-1 items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <ol className="space-y-3">
          {CONTEXT_SCENES.map((item, index) => (
            <li key={item.line}>
              <button
                type="button"
                onClick={() => {
                  setSceneIndex(index)
                  setSetIndex(0)
                  setPhase('say')
                  setPicked(null)
                  setHeard('')
                  setMiss('')
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-base leading-relaxed ${
                  index === sceneIndex ? 'border-[#0c0dd7] bg-white' : 'border-line/80 bg-[#fffdf9]'
                }`}
              >
                {item.line}
                {'note' in item && item.note ? (
                  <span className="mt-1 block text-sm text-muted">{item.note}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ol>
        <div className="flex flex-col items-center justify-center gap-8 lg:sticky lg:top-8 lg:pt-6">
          <p className="font-display min-h-[4.5rem] text-center text-5xl leading-none tracking-tight sm:text-6xl">
            {picked || (phase === 'wait' ? '…' : phase === 'words' ? words.join('  ') : scene.say)}
          </p>
          {phase === 'words' && !picked ? (
            <div className="flex flex-wrap justify-center gap-2">
              {words.map((word) => (
                <span key={word} className="rounded-full bg-[#fffdf9] px-4 py-2 text-sm font-medium">
                  {word}
                </span>
              ))}
            </div>
          ) : null}
          <GlassButton
            aria-pressed={holding}
            onPointerDown={() => {
              void startListen()
            }}
            onPointerUp={() => {
              void stopListen()
            }}
            onPointerCancel={() => {
              void stopListen()
            }}
          >
            <Mic className="h-8 w-8" aria-hidden />
            <span className="sr-only">{holding ? 'Release to stop' : 'Hold to speak'}</span>
          </GlassButton>
          <p className="max-w-xs text-center text-sm text-muted">
            {miss || (heard ? `Heard: ${heard}` : 'Tap once to allow the mic. Then hold.')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {picked ? (
              <button
                type="button"
                onClick={() => speakIn(picked, 'en-US')}
                className="rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-medium"
              >
                Hear {picked} again
              </button>
            ) : null}
            {phase === 'words' ? (
              <button
                type="button"
                onClick={nextSet}
                className="rounded-full border border-[#1c2430] bg-white px-5 py-2.5 text-sm font-medium"
              >
                Show three other words
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

const SEEDED: MemoryWord[] = [
  { id: 'cozy', said: 'gemütlich', answer: 'cozy', count: 4 },
  { id: 'exhausted', said: 'erschöpft', answer: 'exhausted', count: 2 },
  { id: 'bill', said: 'Rechnung', answer: 'bill', count: 3 },
  { id: 'termin', said: 'Termin', answer: 'appointment', count: 3 },
]

function stageFor(item: MemoryWord) {
  if (item.id === 'bill') return 'Says it alone'
  if (item.count >= 3) return 'Loses it under pressure'
  return 'Understands it. Cannot retrieve it'
}

function PersonalPane({
  memory,
  onReplay,
}: {
  memory: MemoryWord[]
  onReplay: (word: string) => void
}) {
  const words = SEEDED.map((seed) => {
    const live = memory.find((item) => item.id === seed.id)
    return live ? { ...seed, count: seed.count + live.count } : seed
  })
  const extra = memory.filter((item) => !SEEDED.some((seed) => seed.id === item.id))
  const all = [...words, ...extra]
  const sessionRescues = memory.reduce((sum, item) => sum + item.count, 0)
  const last = memory[memory.length - 1]

  return (
    <section className="mt-8 w-full max-w-3xl">
      <h1 className="font-display text-4xl leading-none sm:text-5xl">Philip</h1>
      <p className="mt-2 text-sm text-muted">Your language in. The one you are learning, back.</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value="12" label="Conversations" />
        <Stat value={String(18 + sessionRescues)} label="Rescues" />
        <Stat value="46" label="Speaking min" />
        <Stat value={String(sessionRescues)} label="This session" />
      </div>

      <div className="mt-4 rounded-2xl border border-line/80 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-muted">Speaking activity</p>
            <p className="mt-1 text-sm text-muted">Minutes per day, last year</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted">
            <span>Less</span>
            <span className="heat-cell" data-level="0" />
            <span className="heat-cell" data-level="1" />
            <span className="heat-cell" data-level="2" />
            <span className="heat-cell" data-level="3" />
            <span className="heat-cell" data-level="4" />
            <span>More</span>
          </div>
        </div>
        <SpeakingHeat />
      </div>

      <div className="mt-4 rounded-2xl border border-line/80 bg-[#fffdf9] p-5 sm:p-6">
        <p className="text-sm font-medium text-muted">Level</p>
        <p className="font-display mt-2 text-3xl leading-none text-[#0c0dd7]">Between B1 and B2</p>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
          You keep a conversation going. The gaps are single words, not whole sentences. On a call on your iPhone, Coco uses this same read.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-line/80 bg-[#fffdf9] p-5 sm:p-6">
        <p className="text-sm font-medium text-muted">Words from real talks</p>
        <ul className="mt-4 space-y-3">
          {all.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-4">
              <span className="text-lg text-ink">
                {item.said} → {item.answer}
              </span>
              <span className="text-right text-sm text-muted">
                {stageFor(item)}
                {item.count > 1 ? `, ${item.count} times` : ''}
              </span>
            </li>
          ))}
        </ul>
        {last ? (
          <button
            type="button"
            onClick={() => onReplay(last.answer)}
            className="btn-blue mt-6 px-5 py-2.5 text-sm font-medium"
          >
            Hear {last.answer} again
          </button>
        ) : null}
      </div>
    </section>
  )
}

function SpeakingHeat() {
  const weeks = buildHeatYear()
  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <div key={day.key} className="heat-cell" data-level={day.level} title={day.label} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function buildHeatYear() {
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 364)
  start.setDate(start.getDate() - start.getDay())
  const days: { key: string; label: string; level: 0 | 1 | 2 | 3 | 4 }[] = []
  const cursor = new Date(start)
  while (cursor <= today) {
    const n = cursor.getDate() + cursor.getMonth() * 3
    const weekend = cursor.getDay() === 0 || cursor.getDay() === 6
    let level: 0 | 1 | 2 | 3 | 4 = 0
    if (!weekend && n % 11 !== 0) {
      if (n % 7 === 0) level = 4
      else if (n % 3 === 0) level = 3
      else if (n % 2 === 0) level = 2
      else level = 1
    }
    days.push({
      key: cursor.toISOString().slice(0, 10),
      label: cursor.toDateString(),
      level,
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  const weeks = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line/80 bg-[#fffdf9] p-4">
      <p className="font-display text-3xl leading-none text-[#0c0dd7]">{value}</p>
      <p className="mt-2 text-sm text-muted">{label}</p>
    </div>
  )
}

function LearningPane({
  learn,
  native,
  learnSpeech,
  spoken,
}: {
  learn: LangId
  native: LangId
  learnSpeech: string
  spoken: string
}) {
  const lines = linesFor(learn, native)
  const [step, setStep] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<'idle' | 'ok' | 'bad'>('idle')
  const [revealed, setRevealed] = useState(false)
  const current = lines[step] ?? null
  const done = !current

  useEffect(() => {
    setStep(0)
    setAnswer('')
    setFeedback('idle')
    setRevealed(false)
  }, [learn, native])

  function check(event?: FormEvent) {
    event?.preventDefault()
    if (!current || feedback === 'ok') return
    if (fold(answer) === fold(current.answer)) {
      setFeedback('ok')
      window.setTimeout(() => {
        setStep((value) => value + 1)
        setAnswer('')
        setFeedback('idle')
        setRevealed(false)
      }, 700)
      return
    }
    setFeedback('bad')
  }

  return (
    <section className="mt-8 max-w-xl">
      <p className="text-lg leading-snug text-ink">
        After the conversation, the word you needed comes back. Type it in {spoken}, then say it yourself.
      </p>
      {done ? (
        <div className="mt-8">
          <p className="text-lg text-ink">You can say them.</p>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="btn btn-blue mt-6 px-6 py-3 text-sm font-medium"
          >
            Practice again
          </button>
        </div>
      ) : (
        <form onSubmit={check} className="mt-8 rounded-2xl border border-line/80 bg-[#fffdf9] p-6">
          <p className="text-sm text-muted">
            {step + 1} / {lines.length}
          </p>
          <p className="font-display mt-4 text-4xl leading-none text-[#0c0dd7]">{current.said}</p>
          <label className="mt-6 block text-sm font-medium text-muted" htmlFor="learn-word">
            {spoken}
          </label>
          <input
            id="learn-word"
            value={answer}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Type it"
            onChange={(event) => {
              setAnswer(event.target.value)
              setFeedback('idle')
            }}
            className="mt-2 w-full border-b border-line bg-transparent py-3 text-lg text-ink outline-none focus:border-ink"
          />
          {feedback === 'ok' ? <p className="mt-3 text-sm text-ink">That one.</p> : null}
          {feedback === 'bad' ? <p className="mt-3 text-sm text-ink">Not that spelling.</p> : null}
          {revealed ? <p className="mt-3 text-lg font-medium text-ink">{current.answer}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" className="btn btn-blue px-5 py-2.5 text-sm font-medium">
              Check
            </button>
            <button
              type="button"
              onClick={() => speakIn(current.answer, learnSpeech)}
              className="rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-medium"
            >
              Hear it
            </button>
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="px-2 py-2.5 text-sm font-medium text-muted"
            >
              Show the {spoken} word
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
