import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { NotebookCover } from '@/components/ui/NotebookCover'
import { StickyNote } from '@/components/ui/StickyNote'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
  /** Two-column desk layout (login / register). */
  showArt?: boolean
}

const DESK_NOTEBOOKS = [
  {
    color: 'indigo' as const,
    title: 'Data Structures',
    subtitle: 'MCA Sem I',
    who: 'Prof. Vikram Deshmukh',
    drop: 'nb-drop-1',
    ribbon: false,
  },
  {
    color: 'maroon' as const,
    title: 'Software Engg.',
    subtitle: 'MCA Sem II',
    who: 'Dr. Rohan Kulkarni',
    drop: 'nb-drop-2',
    ribbon: true,
  },
  {
    color: 'teal' as const,
    title: 'Advanced Java',
    subtitle: 'MCA Sem II, Div A',
    who: 'Prof. Ananya Krishnan',
    drop: 'nb-drop-3',
    ribbon: true,
  },
]

/** Split auth layout: form on the left, dotted desk with notebooks on the right. */
export function AuthShell({ title, subtitle, children, footer, showArt = false }: AuthShellProps) {
  return (
    <main className="min-h-screen min-h-dvh bg-bg">
      <div
        className={
          showArt
            ? 'grid min-h-screen min-h-dvh bg-surface sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]'
            : 'mx-auto flex min-h-screen min-h-dvh max-w-md flex-col justify-center p-4'
        }
      >
        <div
          className={
            showArt
              ? 'flex min-h-screen min-h-dvh flex-col px-6 py-10 sm:px-12 lg:px-[72px] lg:py-12'
              : 'flex flex-col gap-4'
          }
        >
          <Link
            to="/"
            className="inline-flex w-fit shrink-0 items-center gap-2.5 text-[17px] font-bold tracking-[-0.02em] text-ink no-underline"
          >
            <span className="notebook-mark" aria-hidden="true" />
            CampusConnect
          </Link>

          <div
            className={
              showArt
                ? 'flex min-h-0 flex-1 flex-col justify-center py-8'
                : 'rounded-xl border border-border bg-surface p-6'
            }
          >
            <div className={showArt ? 'w-full max-w-[380px]' : undefined}>
              <h1
                className={
                  showArt
                    ? 'font-serif text-[42px] font-normal leading-none tracking-[-0.015em] sm:text-[52px]'
                    : 'text-[28px] font-semibold tracking-[-0.02em]'
                }
              >
                {title}
              </h1>
              <p className="mt-3 text-[15px] text-muted sm:text-base">{subtitle}</p>
              <div className="mt-8 flex flex-col gap-4">{children}</div>
              <p className="mt-6 text-body text-muted">{footer}</p>
            </div>
          </div>
        </div>

        {showArt && (
          <aside
            className="login-art hidden min-h-screen min-h-dvh flex-col border-l border-border p-8 sm:flex lg:p-12"
            aria-hidden="true"
          >
            <div className="relative min-h-0 flex-1">
              <div className="login-desk absolute inset-0">
                {DESK_NOTEBOOKS.map((nb) => (
                  <NotebookCover
                    key={nb.title}
                    size="stack"
                    color={nb.color}
                    title={nb.title}
                    subtitle={nb.subtitle}
                    ribbon={nb.ribbon}
                    className={`nb-drop ${nb.drop}`}
                  >
                    <p className="relative m-0 text-[12px] text-white/85">{nb.who}</p>
                  </NotebookCover>
                ))}
              </div>
              <StickyNote
                caption="Advanced Java"
                className="absolute bottom-4 right-2 z-[3] w-[160px] rotate-[4deg] lg:right-4"
              >
                Lab 5 is up. Bring laptops Monday.
              </StickyNote>
            </div>

            <blockquote className="relative z-[1] mt-6 max-w-[440px] shrink-0 font-serif text-[26px] leading-[1.15] tracking-[-0.01em] lg:text-[30px]">
              Every class, its notes and every deadline, on one desk.
              <cite className="mt-3 block font-sans text-[13px] not-italic text-muted">
                CampusConnect for the MCA department
              </cite>
            </blockquote>
          </aside>
        )}
      </div>
    </main>
  )
}
