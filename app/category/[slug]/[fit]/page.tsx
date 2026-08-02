import { CategoryView } from '../CategoryView';

export default function CategoryFitPage({ params }: { params: { slug: string; fit: string } }) {
  return <CategoryView slug={params.slug} fit={params.fit} />;
}
