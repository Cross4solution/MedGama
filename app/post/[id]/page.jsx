import PostDetail from '@/screens/PostDetail';
import { fetchJson, clamp, absoluteUrl, altLanguages } from '@/lib/seo-server';

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
  if (!p) return { title: 'Gönderi', alternates: altLanguages(`/post/${id}`) };

  const author =
    p.author?.fullname || p.clinic?.fullname || p.hospital?.fullname || 'MedaGama';
  const content = (p.content || '').replace(/\s+/g, ' ').trim();
  const title = content ? clamp(content, 70) : `${author} paylaşımı`;
  const description = clamp(content || `${author} tarafından MedaGama MedStream paylaşımı.`);
  const rawImage =
    p.media_url ||
    (Array.isArray(p.media) ? p.media[0]?.url || p.media[0] : undefined) ||
    undefined;
  const image = typeof rawImage === 'string' ? absoluteUrl(rawImage) : undefined;

  return {
    title,
    description,
    alternates: altLanguages(`/post/${id}`),
    openGraph: {
      title: `${title} | MedaGama`,
      description,
      url: `/post/${id}`,
      type: 'article',
      ...(image && { images: [{ url: image, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${title} | MedaGama`,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default function Page() {
  return <PostDetail />;
}
