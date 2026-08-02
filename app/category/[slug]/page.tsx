import { CategoryView } from './CategoryView';

export default function CategoryPage({ params }: { params: { slug: string } }) {
  return <CategoryView slug={params.slug} />;
}
