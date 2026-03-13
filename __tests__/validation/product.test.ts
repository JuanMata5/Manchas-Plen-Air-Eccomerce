import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Solo letras, números y guiones'),
  price_ars: z.number().positive('Precio ARS debe ser positivo'),
  stock: z.number().int().min(0),
})

describe('Product Validation (Zod)', () => {
  it('should validate valid product data', () => {
    const validProduct = {
      name: 'Entrada General',
      slug: 'entrada-general',
      price_ars: 15000,
      stock: 100,
    }

    const result = productSchema.safeParse(validProduct)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Entrada General')
    }
  })

  it('should reject product with name too short', () => {
    const invalidProduct = {
      name: 'AB',
      slug: 'entrada-general',
      price_ars: 15000,
      stock: 100,
    }

    const result = productSchema.safeParse(invalidProduct)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('al menos 3 caracteres')
    }
  })

  it('should reject invalid slug', () => {
    const invalidProduct = {
      name: 'Entrada General',
      slug: 'Entrada General', // spaces and uppercase not allowed
      price_ars: 15000,
      stock: 100,
    }

    const result = productSchema.safeParse(invalidProduct)
    expect(result.success).toBe(false)
  })

  it('should reject negative price', () => {
    const invalidProduct = {
      name: 'Entrada General',
      slug: 'entrada-general',
      price_ars: -100,
      stock: 100,
    }

    const result = productSchema.safeParse(invalidProduct)
    expect(result.success).toBe(false)
  })

  it('should reject negative stock', () => {
    const invalidProduct = {
      name: 'Entrada General',
      slug: 'entrada-general',
      price_ars: 15000,
      stock: -10,
    }

    const result = productSchema.safeParse(invalidProduct)
    expect(result.success).toBe(false)
  })
})
