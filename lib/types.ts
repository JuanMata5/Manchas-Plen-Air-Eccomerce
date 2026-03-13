export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export type ProductImage = {
  id: string
  product_id: string
  cloudinary_public_id: string
  url: string
  width: number | null
  height: number | null
  is_primary: boolean
  display_order: number | null
  created_at: string
}

export type Product = {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  price_ars: number
  price_usd: number | null
  stock: number
  max_per_order: number
  image_url: string | null
  images: string[] | null
  is_active: boolean
  is_featured: boolean
  product_type?: 'ticket' | 'workshop' | 'merchandise'
  event_date?: string | null
  event_location?: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at?: string
  categories?: Category
  product_images?: ProductImage[]
}

export type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  dni: string | null
  is_admin: boolean
  created_at: string
}

export type OrderStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'cancelled'
  | 'refunded'

export type PaymentMethod = 'mercadopago' | 'transfer'

export type Order = {
  id: string
  user_id: string | null
  status: OrderStatus
  payment_method: PaymentMethod | null
  payment_ref: string | null       // MP preference_id
  mp_payment_id: string | null     // MP confirmed payment id
  transfer_ref: string | null      // original transfer_ref from DB
  bank_transfer_ref: string | null // added column
  subtotal_ars: number
  discount_ars: number
  total_ars: number
  buyer_name: string
  buyer_email: string
  buyer_phone: string | null
  buyer_dni: string | null
  notes: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
  tickets?: Ticket[]
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price_ars: number
  subtotal_ars: number
  created_at: string
  products?: Product
}

export type Ticket = {
  id: string
  order_id: string
  product_id: string | null
  order_item_id: string | null
  qr_code: string
  holder_name: string
  holder_email: string
  holder_dni: string | null
  is_used: boolean
  used_at: string | null
  created_at: string
}

export type Coupon = {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_uses: number | null
  uses_count: number
  min_order_ars: number
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  created_at: string
}

// Cart types (client-side only)
export type CartItem = {
  product: Product
  quantity: number
}

export type Cart = {
  items: CartItem[]
}
