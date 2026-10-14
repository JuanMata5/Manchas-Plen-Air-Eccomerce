'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { Category } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  categories: Category[]
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeSlug = searchParams.get('categoria')

  const handleSelect = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) {
      params.set('categoria', slug)
    } else {
      params.delete('categoria')
    }
    router.push(`/tienda?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
      <Button
        variant={!activeSlug ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleSelect(null)}
        className={cn(!activeSlug && 'shadow-sm')}
      >
        Todos
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant={activeSlug === cat.slug ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSelect(cat.slug)}
          className={cn(activeSlug === cat.slug && 'shadow-sm')}
        >
          {cat.name}
        </Button>
      ))}
    </div>
  )
}
