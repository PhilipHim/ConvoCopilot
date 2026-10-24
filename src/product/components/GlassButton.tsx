import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'

/**
 * Liquid glass Start/Stop control.
 * Effect adapted from kokonutui LiquidButton (MIT). Glass filter and inset rim shadow.
 */

const GLASS_SHADOW =
  'shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)]'

const BUTTON_GLASS_FILTER_SCALE = 70

type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

function GlassFilter({ id, scale }: { id: string; scale: number }) {
  return (
    <svg aria-hidden className="hidden" focusable="false">
      <defs>
        <filter
          colorInterpolationFilters="sRGB"
          height="200%"
          id={id}
          width="200%"
          x="-50%"
          y="-50%"
        >
          <feTurbulence
            baseFrequency="0.05 0.05"
            numOctaves="1"
            result="turbulence"
            seed="1"
            type="fractalNoise"
          />
          <feGaussianBlur
            in="turbulence"
            result="blurredNoise"
            stdDeviation="2"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            result="displaced"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="B"
          />
          <feGaussianBlur in="displaced" result="finalBlur" stdDeviation="4" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}

export function GlassButton({
  children,
  className = '',
  ...props
}: GlassButtonProps) {
  const filterId = useId().replace(/:/g, '')

  return (
    <>
      <button
        type="button"
        className={`relative inline-flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-white/40 bg-white/35 font-medium text-ink backdrop-blur-md transition-transform duration-200 active:scale-[0.97] hover:scale-105 disabled:cursor-wait disabled:opacity-55 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${className}`}
        {...props}
      >
        <span
          className={`pointer-events-none absolute inset-0 rounded-[inherit] ${GLASS_SHADOW}`}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-0 isolate -z-10 overflow-hidden rounded-[inherit]"
          style={{ backdropFilter: `url("#${filterId}")` }}
          aria-hidden
        />
        <span className="relative z-10">{children}</span>
      </button>
      <GlassFilter id={filterId} scale={BUTTON_GLASS_FILTER_SCALE} />
    </>
  )
}
