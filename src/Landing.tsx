import { Link } from 'react-router-dom'
import { CocoMark } from './components/CocoMark'

export function Landing() {
  return (
    <div className="min-h-svh bg-[#f4efe8] text-[#1c1c1c]">
      <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col px-5 py-8 sm:px-8">
        <header className="flex items-center gap-2.5">
          <CocoMark className="h-9 w-9" />
          <span className="font-display text-lg leading-none">COCO · Keep talking</span>
        </header>

        <h1 className="mt-16 max-w-xl font-display text-5xl leading-[0.95] text-[#1c1c1c] sm:text-6xl">
          Learn a language without leaving the{' '}
          <span className="text-[#0c0dd7]">conversation.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-snug">
          You're learning a language. Speaking is where it falls apart. You stumble. You forget the word, right there in the conversation.
        </p>
        <p className="mt-4 max-w-xl text-lg leading-snug">
          Headphones in. The app is running. Two ways through it. We give you the next word from the context. Or you say the word you still have, in your own language, and it comes back translated. You say it yourself.
        </p>

        <Link
          to="/demo"
          className="btn-blue mt-8 inline-flex w-fit px-5 py-3 text-sm font-medium"
        >
          Try it
        </Link>
        <PayButton />

        <section className="mt-16">
          <h2 className="font-display text-3xl leading-none">In the moment</h2>
          <ol className="mt-6 space-y-4 text-lg">
            <li>The sentence is already clear. Coco puts up the next word.</li>
            <li>Or you say the missing word in your own language. It comes back translated.</li>
            <li>You say it yourself.</li>
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-3xl leading-none">What we used</h2>
          <ul className="mt-6 space-y-4 text-lg">
            <li>
              <span className="font-medium">Browser speech.</span> Hold the mic, say the word. It comes back translated.
            </li>
            <li>
              <span className="font-medium">Claude.</span> Chooses the word, as a backend call. On this demo the list is fixed, so a bad connection does not kill the moment.
            </li>
            <li>
              <span className="font-medium">Stripe.</span> Founding Member, €4.99 a month. One checkout. Not per minute, not per word.
            </li>
            <li>
              <span className="font-medium">Supabase.</span> Later. The words and the level, saved.
            </li>
          </ul>
        </section>

        <section className="mt-12 mb-10">
          <h2 className="font-display text-3xl leading-none">The ear piece</h2>
          <p className="mt-6 max-w-xl text-lg leading-snug">
            Today this is headphones and the app. We want a small piece on one ear. Mic, speaker, one button. It connects to the app on your phone. The phone hears the word and sends the answer back. You keep talking.
          </p>
        </section>

        <section className="mt-12 mb-16">
          <h2 className="font-display text-3xl leading-none">Demo</h2>
          <video
            className="mt-6 w-full max-w-xl rounded-2xl bg-black"
            src="/demo.mp4"
            controls
            playsInline
            preload="metadata"
          />
        </section>
      </div>
    </div>
  )
}

function PayButton() {
  const url =
    (import.meta.env.VITE_STRIPE_PAYMENT_LINK_URL as string | undefined) ||
    'https://buy.stripe.com/fZu00k94eaLK5wv0tg7Zu00'
  if (!url) {
    return (
      <p className="mt-4 text-sm text-[#5b6572]">Founding Member, €4.99 / month.</p>
    )
  }
  return (
    <a
      href={url}
      className="mt-4 inline-flex w-fit rounded-full bg-[#d01212] px-5 py-3 text-sm font-medium text-white"
    >
      Founding Member, €4.99 / month
    </a>
  )
}
