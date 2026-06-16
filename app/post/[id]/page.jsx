import PostDetail from '@/screens/PostDetail';
import { fetchJson, clamp } from '@/lib/seo-server';

// Backend: GET /api/medstream/posts/{id} (public, optional auth) → { data: {...post} }
async function getPostData(id) {
  const data = await fetchJson(`/api/medstream/posts/${id}`, 300);
  if (!data) return null;
  const p = data.data || data.post || data;
  if (!p || !p.id) return null;
  return p;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = await getPostData(id);
  if (!p) return { title: 'Gönderi', alternates: { canonical: `/post/${id}` } };

  const author =
    p.author?.fullname || p.clinic?.fullname || p.hospital?.fullname || 'MedaGama';
  const content = (p.content || '').replace(/\s+/g, ' ').trim();
  const title = content ? clamp(content, 70) : `${author} paylaşımı`;
  const description = clamp(content || `${author} tarafından MedaGama MedStream paylaşımı.`);
  const image =
    p.media_url ||
    (Array.isArray(p.media) ? p.media[0]?.url || p.media[0] : undefined) ||
    undefined;

  return {
    title,
    description,
    alternates: { canonical: `/post/${id}` },
    openGraph: {
      title: `${title} | MedaGama`,
      description,
      url: `/post/${id}`,
      type: 'article',
      ...(image && typeof image === 'string' && { images: [image] }),
    },
  };
}

export default function Page() {
  return <PostDetail />;
}
