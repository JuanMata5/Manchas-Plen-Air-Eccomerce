import { formatARS, formatUSD, slugify } from '@/lib/format'
import { buildTravelUpdatePayload } from '@/lib/travel-admin'

describe('Format Utilities', () => {
  describe('formatARS', () => {
    it('should format ARS currency correctly', () => {
      expect(formatARS(1000)).toContain('$')
      expect(formatARS(1000)).toContain('1')
    })

    it('should format large amounts with thousands separator', () => {
      const formatted = formatARS(1000000)
      expect(formatted).toContain('$')
    })

    it('should handle zero', () => {
      const formatted = formatARS(0)
      expect(formatted).toContain('$')
    })

    it('should not have decimal places', () => {
      const formatted = formatARS(1500.99)
      expect(formatted).not.toContain(',')
    })
  })

  describe('formatUSD', () => {
    it('should format USD currency correctly', () => {
      const formatted = formatUSD(50)
      expect(formatted).toContain('$')
    })

    it('should handle zero', () => {
      const formatted = formatUSD(0)
      expect(formatted).toContain('$')
    })
  })

  describe('slugify', () => {
    it('should convert text to slug format', () => {
      expect(slugify('Entrada General 2025')).toBe('entrada-general-2025')
    })

    it('should handle accents', () => {
      expect(slugify('Taller de Técnicas Avanzadas')).toBe('taller-de-tecnicas-avanzadas')
    })

    it('should handle multiple spaces', () => {
      expect(slugify('Producto  Con   Espacios')).toBe('producto-con-espacios')
    })

    it('should remove special characters', () => {
      expect(slugify('Producto (Premium)')).toBe('producto-premium')
    })

    it('should lowercase everything', () => {
      expect(slugify('UPPERCASE TEXT')).toBe('uppercase-text')
    })

    it('should not start or end with dash', () => {
      const result = slugify('-test-')
      expect(result).not.toMatch(/^-/)
      expect(result).not.toMatch(/-$/)
    })
  })

  describe('buildTravelUpdatePayload', () => {
    it('should remove the id field and keep DB column names', () => {
      const payload = buildTravelUpdatePayload({
        title: 'Viaje test',
        slug: 'viaje-test',
        price_total: 1500,
        price_reservation: 250,
        optionGroups: [{ id: 'g1', name: 'Hotel', category: 'accommodation', type: 'radio', options: [] }],
        paymentModes: [{ id: 'p1', name: 'Tarjeta', priceModifier: 0 }],
        id: 'uuid-123',
      } as any)

      expect(payload).not.toHaveProperty('id')
      expect(payload).toHaveProperty('option_groups')
      expect(payload).toHaveProperty('payment_modes')
      expect(payload).not.toHaveProperty('optionGroups')
      expect(payload).not.toHaveProperty('paymentModes')
    })
  })
})
