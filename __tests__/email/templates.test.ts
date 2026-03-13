import { orderConfirmationTemplate, paymentConfirmedTemplate, adminNotificationTemplate } from '@/lib/email/templates'

describe('Email Templates', () => {
  describe('orderConfirmationTemplate', () => {
    it('should render confirmation email with order details', () => {
      const template = orderConfirmationTemplate({
        orderReference: 'ORD-12345',
        buyerName: 'Juan Pérez',
        buyerEmail: 'juan@example.com',
        items: [
          { name: 'Entrada General', quantity: 2, price: 15000 },
        ],
        total: 30000,
        paymentMethod: 'mercadopago',
        orderDate: '2026-03-12',
      })

      expect(template).toContain('Orden Confirmada')
      expect(template).toContain('Juan Pérez')
      expect(template).toContain('Entrada General')
      expect(template).toContain('30.000')
      expect(template).toContain('ORD-12345')
    })

    it('should include bank data for transfer method', () => {
      const template = orderConfirmationTemplate({
        orderReference: 'ORD-12345',
        buyerName: 'Juan Pérez',
        buyerEmail: 'juan@example.com',
        items: [{ name: 'Test', quantity: 1, price: 100 }],
        total: 100,
        paymentMethod: 'transfer',
        bankData: {
          bankName: 'Banco X',
          cbu: '0123456789012345678901',
          alias: 'test.alias',
          holder: 'Test SA',
          cuit: '20-123456-7',
        },
        orderDate: '2026-03-12',
      })

      expect(template).toContain('Datos para transferencia')
      expect(template).toContain('Banco X')
      expect(template).toContain('test.alias')
    })
  })

  describe('paymentConfirmedTemplate', () => {
    it('should render payment confirmed email', () => {
      const template = paymentConfirmedTemplate({
        orderReference: 'ORD-12345',
        buyerName: 'Juan Pérez',
        total: 30000,
        paymentDate: '2026-03-12T10:00:00Z',
        ticketCount: 2,
        eventName: 'Plen Air',
      })

      expect(template).toContain('¡Pago Exitoso!')
      expect(template).toContain('Juan Pérez')
      expect(template).toContain('30.000')
      expect(template).toContain('2 entradas')
    })
  })

  describe('adminNotificationTemplate', () => {
    it('should render admin notification email', () => {
      const template = adminNotificationTemplate({
        orderReference: 'ORD-12345',
        buyerName: 'Juan Pérez',
        buyerEmail: 'juan@example.com',
        items: [
          { name: 'Entrada General', quantity: 2 },
        ],
        total: 30000,
        paymentMethod: 'mercadopago',
        timestamp: '2026-03-12T10:00:00Z',
      })

      expect(template).toContain('Nueva Orden')
      expect(template).toContain('Juan Pérez')
      expect(template).toContain('juan@example.com')
      expect(template).toContain('Entrada General')
    })
  })
})
