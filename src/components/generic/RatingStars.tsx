import type { ReactElement } from "react"

const StarPath =
  "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"

type Props = {
  rating: number
  onPick: (stars: number) => void
  disabled?: boolean
}

export const RatingStars = ({ rating, onPick, disabled }: Props): ReactElement => {
  const clamped = Math.min(5, Math.max(0, rating))

  return (
    <div className="flex justify-center gap-0.5" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = clamped >= n
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            aria-label={n === 1 && clamped === 1 ? "Clear rating" : `${n} stars`}
            aria-pressed={filled}
            className={`group h-7 w-7 shrink-0 rounded p-0.5 outline-none disabled:opacity-40 ${
              disabled ? "cursor-default" : "cursor-pointer"
            }`}
            onClick={() => {
              if (n === 1 && clamped === 1) onPick(0)
              else onPick(n)
            }}
          >
            <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
              <path
                d={StarPath}
                vectorEffect="non-scaling-stroke"
                className={`transition-colors duration-150 ease-out ${
                  filled
                    ? "fill-neutral-500 stroke-neutral-600/55 stroke-[0.45] group-hover:fill-neutral-400 group-hover:stroke-neutral-500/55"
                    : "fill-transparent stroke-neutral-500 stroke-[1.05] group-hover:fill-neutral-600/45 group-hover:stroke-neutral-400"
                }`}
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
