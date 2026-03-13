import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://manchas-plen-air-eccomerce.vercel.app'
  const adminDb = createAdminClient()

  const { data: products } = await adminDb
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true)

  const productUrls = (products ?? []).map((product) => ({
    url: `${baseUrl}/tienda/${product.slug}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/tienda`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auth/login`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/auth/register`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...productUrls,
  ]
}
