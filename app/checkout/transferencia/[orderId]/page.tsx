import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Building2, Copy } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatARS } from '@/lib/format'
import { CopyButton } from '@/components/copy-button'
import { ReceiptUpload } from '@/components/receipt-upload'

interface PageProps {
  params: Promise<{ orderId: string }>
}

// --- DATOS REALES --- 
const BANK_DATA_ARS = {
  bank: 'Banco Ciudad',
  holder: 'Liliana Viviana Paola Nievas',
  cuit: '27-21473468-6',
  cbu: '0290002511000000179412',
  alias: 'TROTE.DAMA.FUENTE',
}

const BANK_DATA_USD = {
  bank: 'Banco Ciudad',
  holder: 'Liliana Viviana Paola Nievas',
  cuit: '27-21473468-6',
  account_number: '000000020400017941',
  alias: 'TROTE.DAMA.FUENTE',
  cbu: '0290002511000000179412',
}

export default async function BankTransferPage({ params }: PageProps) {
  const { orderId } = await params
  const adminDb = createAdminClient()

  const { data: order } = await adminDb
    .from('orders')
    .select('id, total_ars, bank_transfer_ref, buyer_name, buyer_email, status')
    .eq('id', orderId)
    .single()

  if (!order) notFound()

  const receiptUrl = (order as any).receipt_url ?? null

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-12 flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-serif font-bold text-3xl text-foreground">Datos de transferencia</h1>
          <p className="text-muted-foreground leading-relaxed">
            Realiza la transferencia con el importe exacto. Tu orden quedara reservada por{' '}
            <strong>48 horas</strong>.
          </p>
        </div>

        {/* --- DATOS CUENTA EN PESOS (ARS) --- */}
        <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-foreground">Datos para transferencia en Pesos (ARS)</h2>
          <Separator />
          <BankRow label="Banco" value={BANK_DATA_ARS.bank} />
          <BankRow label="Titular" value={BANK_DATA_ARS.holder} />
          <BankRow label="CUIT" value={BANK_DATA_ARS.cuit} />
          <BankRow label="CBU" value={BANK_DATA_ARS.cbu} copyable />
          <BankRow label="Alias" value={BANK_DATA_ARS.alias} copyable />
          <Separator />
          <BankRow
            label="Monto exacto"
            value={formatARS(order.total_ars)}
            highlight
          />
          <BankRow
            label="Referencia"
            value={order.bank_transfer_ref ?? order.id.slice(0, 8).toUpperCase()}
            copyable
            highlight
          />
        </div>
        
        {/* --- DATOS CUENTA EN DÓLARES (USD) --- */}
        <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
            <h2 className="font-semibold text-foreground">Datos para transferencia en Dólares (USD)</h2>
            <p className="text-sm text-muted-foreground -mt-2">
                Para transferencias en USD, por favor contáctanos para confirmar el monto final.
            </p>
            <Separator />
            <BankRow label="Banco" value={BANK_DATA_USD.bank} />
            <BankRow label="Titular" value={BANK_DATA_USD.holder} />
            <BankRow label="CUIT" value={BANK_DATA_USD.cuit} />
            <BankRow label="Caja de Ahorro U$S" value={BANK_DATA_USD.account_number} copyable />
            <BankRow label="CBU" value={BANK_DATA_USD.cbu} copyable />
            <BankRow label="Alias" value={BANK_DATA_USD.alias} copyable />
        </div>


        <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground flex flex-col gap-2">
          <p className="font-medium text-foreground">Importante</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Incluye la referencia en el concepto/descripcion de la transferencia.</li>
            <li>Una vez acreditado el pago recibirás tus entradas por email.</li>
            <li>
              Si tenes dudas escribinos a{' '}
              <a href="mailto:hola@plenair.com.ar" className="text-primary underline">
                hola@plenair.com.ar
              </a>
            </li>
          </ul>
        </div>

        {/* Receipt upload */}
        <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-foreground">Comprobante de pago</h2>
          <Separator />
          <ReceiptUpload orderId={order.id} existingUrl={receiptUrl} />
        </div>

        <Button asChild variant="outline">
          <Link href="/cuenta/mis-ordenes">Ir a Mis Órdenes</Link>
        </Button>
      </main>
      <Footer />
    </>
  )
}

function BankRow({
  label,
  value,
  copyable,
  highlight,
}: {
  label: string
  value: string
  copyable?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-medium tabular-nums text-right ${
            highlight ? 'text-primary font-bold text-base' : 'text-foreground'
          }`}
        >
          {value}
        </span>
        {copyable && <CopyButton value={value} />}
      </div>
    </div>
  )
}
