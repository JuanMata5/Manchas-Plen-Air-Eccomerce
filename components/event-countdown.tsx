'use client'

import { useEffect, useMemo, useState } from 'react'

type TimeLeft = {
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(targetIso: string): TimeLeft {
  const now = Date.now()
  const target = new Date(targetIso).getTime()
  const totalMs = Math.max(target - now, 0)

  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60)
  const seconds = Math.floor((totalMs / 1000) % 60)

  return { totalMs, days, hours, minutes, seconds }
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

export function EventCountdown({
  targetIso,
  title = 'Faltan para el evento',
}: {
  targetIso: string
  title?: string
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(targetIso))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(targetIso))
    }, 1000)

    return () => clearInterval(timer)
  }, [targetIso])

  const isFinished = useMemo(() => timeLeft.totalMs <= 0, [timeLeft.totalMs])

  if (isFinished) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <p className="text-xs uppercase tracking-widest text-emerald-700 font-semibold">Evento en curso</p>
        <p className="mt-1 text-sm text-emerald-800">La Convencion Plein Air ya esta en marcha. Ultimas entradas disponibles.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-background/70 p-4">
      <p className="text-xs uppercase tracking-widest text-primary font-semibold">{title}</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        <div className="rounded-lg border border-border bg-card p-2 text-center">
          <p className="font-serif text-2xl font-bold text-foreground">{timeLeft.days}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dias</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2 text-center">
          <p className="font-serif text-2xl font-bold text-foreground">{twoDigits(timeLeft.hours)}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Horas</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2 text-center">
          <p className="font-serif text-2xl font-bold text-foreground">{twoDigits(timeLeft.minutes)}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Min</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2 text-center">
          <p className="font-serif text-2xl font-bold text-foreground">{twoDigits(timeLeft.seconds)}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Seg</p>
        </div>
      </div>
    </div>
  )
}
