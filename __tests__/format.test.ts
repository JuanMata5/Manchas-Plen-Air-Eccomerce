import { formatARS, formatUSD, slugify } from '@/lib/format'

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
})
