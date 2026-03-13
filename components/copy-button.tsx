'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface CopyButtonProps {
  value: string
}

export function CopyButton({ value }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('Copiado al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Copiar"
    >
      {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}
