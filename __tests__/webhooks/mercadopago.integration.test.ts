// Ensure global Request/Response exist for next/server import
;(global as any).Request = (global as any).Request || class {}
;(global as any).Response = (global as any).Response || class {}

// We'll require the route dynamically after mocks are set up to avoid next/server import timing issues

// Mocks: crearemos un admin client en memoria y sustituiremos createAdminClient
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}))

jest.mock('@/lib/email/resend', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendBulkEmail: jest.fn().mockResolvedValue(true),
}))

jest.mock('@/lib/pdf/ticket-generator', () => ({
  generateMultipleTicketsPDF: jest.fn().mockResolvedValue(Buffer.from('pdf')),
}))

jest.mock('@/lib/pdf/booking-generator', () => ({
  generateDepositConfirmationPDF: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  generateFullPaymentConfirmationPDF: jest.fn().mockResolvedValue(Buffer.from('pdf')),
}))

const { createAdminClient } = require('@/lib/supabase/admin')

class MockDB {
  tables: any
  constructor() {
    this.tables = {
      orders: [],
      order_items: [],
      tickets: [],
      products: [],
      travel_bookings: [],
      coupons: [],
      webhook_logs: [],
    }
  }

  from(table: string) {
    const self = this
    const filters: any[] = []
    return {
      select(selectCols?: string) {
        this._select = selectCols
        return this
      },
      eq(field: string, val: any) {
        filters.push((row: any) => row[field] === val)
        return this
      },
      in(field: string, vals: any[]) {
        filters.push((row: any) => vals.includes(row[field]))
        return this
      },
      order() { return this },
      single: async function () {
        const rows = self.tables[table].filter((r: any) => filters.every((f: any) => f(r)))
        return { data: rows[0] ?? null }
      },
      insert: async function (payload: any) {
        const items = Array.isArray(payload) ? payload : [payload]
        for (const it of items) {
          // assign id for tickets if needed
          if (table === 'tickets' && !it.id) {
            it.id = self.tables[table].length + 1
          }
          self.tables[table].push(it)
        }
        return { data: payload }
      },
      update: async function (payload: any) {
        let updated: any[] = []
        for (let i = 0; i < self.tables[table].length; i++) {
          const row = self.tables[table][i]
          if (filters.every((f: any) => f(row))) {
            self.tables[table][i] = { ...row, ...payload }
            updated.push(self.tables[table][i])
          }
        }
        return { data: updated }
      },
      rpc: async function (fnName: string, params: any) {
        if (fnName === 'increment_coupon_usage') {
          const id = params?.p_coupon_id
          for (let i = 0; i < self.tables.coupons.length; i++) {
            if (self.tables.coupons[i].id === id) {
              const cur = Number(self.tables.coupons[i].uses_count ?? self.tables.coupons[i].current_uses ?? 0)
              self.tables.coupons[i].uses_count = cur + 1
              return { data: null }
            }
          }
        }
        return { data: null }
      },
    }
  }
}

function makeReq(body: any) {
  return { json: async () => body }
}

describe('MercadoPago webhook integration', () => {
  let mockDb: MockDB

  beforeEach(() => {
    mockDb = new MockDB()
    ;(createAdminClient as jest.Mock).mockReturnValue(mockDb)
    // reset fetch mock
    ;(global as any).fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('processes full payment: updates order, creates tickets, confirms bookings and increments coupon once', async () => {
    // Setup DB
    mockDb.tables.orders.push({ id: 'ord1', total_ars: 1000, amount_paid_ars: 0, balance_due_ars: 1000, coupon_id: 'c1', mp_payment_id: null, payment_option: 'full', buyer_email: 'u@e.com' })
    mockDb.tables.order_items.push({ id: 1, order_id: 'ord1', product_id: 'p1', quantity: 2 })
    mockDb.tables.products.push({ id: 'p1', name: 'Prod 1' })
    mockDb.tables.coupons.push({ id: 'c1', uses_count: 0 })

    // travel booking to confirm
    mockDb.tables.travel_bookings.push({ id: 'b1', order_id: 'ord1', balance_due: 0 })

    // Mock MP fetch
    ;(global as any).fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'pay1', status: 'approved', transaction_amount: 1000, external_reference: 'ord1' }) })

    const { POST } = require('@/app/api/webhooks/mercadopago/route')
    const res = await POST(makeReq({ type: 'payment', data: { id: 'pay1' } }))
    expect(res).toBeDefined()

    // Order updated
    const ord = mockDb.tables.orders.find((o: any) => o.id === 'ord1')
    expect(ord.amount_paid_ars).toBe(1000)
    expect(ord.balance_due_ars).toBe(0)
    expect(ord.status).toBe('paid')
    expect(ord.mp_payment_id).toBe('pay1')

    // Tickets created
    expect(mockDb.tables.tickets.length).toBe(2)

    // Coupon incremented
    const coupon = mockDb.tables.coupons.find((c: any) => c.id === 'c1')
    expect(coupon.uses_count).toBe(1)

    // Email sent once
    const { sendEmail } = require('@/lib/email/resend')
    expect(sendEmail).toHaveBeenCalled()
  })

  it('processes partial payment: updates amounts and does not create tickets or increment coupon', async () => {
    mockDb.tables.orders.push({ id: 'ord2', total_ars: 1250, amount_paid_ars: 0, balance_due_ars: 1250, coupon_id: 'c2', mp_payment_id: null, payment_option: 'full', buyer_email: 'u@e.com' })
    mockDb.tables.order_items.push({ id: 2, order_id: 'ord2', product_id: 'p2', quantity: 1 })
    mockDb.tables.products.push({ id: 'p2', name: 'Prod 2' })
    mockDb.tables.coupons.push({ id: 'c2', uses_count: 0 })
    mockDb.tables.travel_bookings.push({ id: 'tb1', order_id: 'ord2', balance_due: 1250 })

    ;(global as any).fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'pay2', status: 'approved', transaction_amount: 300, external_reference: 'ord2' }) })

    const { POST } = require('@/app/api/webhooks/mercadopago/route')
    await POST(makeReq({ type: 'payment', data: { id: 'pay2' } }))

    const ord = mockDb.tables.orders.find((o: any) => o.id === 'ord2')
    expect(ord.amount_paid_ars).toBe(300)
    expect(ord.balance_due_ars).toBe(950)
    expect(ord.status).toBe('payment_pending')

    // No tickets created (not fully paid)
    expect(mockDb.tables.tickets.filter((t: any) => t.order_id === 'ord2').length).toBe(0)

    // Coupon not incremented
    const coupon = mockDb.tables.coupons.find((c: any) => c.id === 'c2')
    expect(coupon.uses_count).toBe(0)
  })

  it('handles duplicate webhook (same paymentId) idempotently', async () => {
    mockDb.tables.orders.push({ id: 'ord3', total_ars: 500, amount_paid_ars: 0, balance_due_ars: 500, coupon_id: null, mp_payment_id: null, payment_option: 'full', buyer_email: 'u@e.com' })
    mockDb.tables.order_items.push({ id: 3, order_id: 'ord3', product_id: 'p3', quantity: 1 })
    mockDb.tables.products.push({ id: 'p3', name: 'Prod 3' })

    ;(global as any).fetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'pay3', status: 'approved', transaction_amount: 500, external_reference: 'ord3' }) })

    const { POST } = require('@/app/api/webhooks/mercadopago/route')
    await POST(makeReq({ type: 'payment', data: { id: 'pay3' } }))
    // second duplicate
    await POST(makeReq({ type: 'payment', data: { id: 'pay3' } }))

    const ord = mockDb.tables.orders.find((o: any) => o.id === 'ord3')
    // Amount should be counted only once
    expect(ord.amount_paid_ars).toBe(500)
    expect(mockDb.tables.tickets.filter((t: any) => t.order_id === 'ord3').length).toBe(1)
  })

  it('handles non-existent order gracefully', async () => {
    ;(global as any).fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'payX', status: 'approved', transaction_amount: 100, external_reference: 'nope' }) })
    const { POST } = require('@/app/api/webhooks/mercadopago/route')
    const res = await POST(makeReq({ type: 'payment', data: { id: 'payX' } }))
    expect(res).toBeDefined()
    // no crash, just returns
  })
})
