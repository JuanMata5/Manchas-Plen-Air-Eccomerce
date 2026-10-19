import { ProductPageView } from '../../../components/product-page-view'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: { slug: string }
}

export default function Page({ params }: PageProps) {
  return <ProductPageView slug={params.slug} />
}
