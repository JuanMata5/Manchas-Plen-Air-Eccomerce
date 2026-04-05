import { ProductPageView } from '../../../components/product-page-view';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return <ProductPageView slug="vivi-di-donato-arte-acuarela" />;
}