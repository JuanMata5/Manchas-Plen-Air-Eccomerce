type ProductBadgeInput = {
  stock?: number | null
  badge?: string | null
}

export function getProductAvailabilityBadge({ stock, badge }: ProductBadgeInput): string | null {
  const available = Number(stock ?? 0)

  if (available > 0 && available <= 12) {
    return available === 1 ? 'Última entrada' : `Últimas ${available} entradas`
  }

  if (!badge) return null

  return /^últimas?\s+\d+/i.test(badge.trim()) ? null : badge
}
