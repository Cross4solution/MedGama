import { notFound } from 'next/navigation';
import MedStreamProfile from '@/screens/MedStreamProfile';
import { fetchJson, clamp, absoluteUrl, altLanguages } from '@/lib/seo-server';

// Twitter-style MedStream profile: /@username
// This dynamic segment only handles handles that start with "@"; anything else 404s.
async function getProfile(username) {
  const data = await fetchJson(`/api/medstream/u/${encodeURIComponent(username)}`, 300);
  return data?.user ? data : null;
}

export async function generateMetadata({ params }) {
  const { handle } = await params;
  if (!handle || !handle.startsWith('@')) return {};
  const username = handle.slice(1);
  const d = await getProfile(username);
  if (!d) return { title: `@${username}`, robots: { index: false, follow: false } };

  const u = d.user;
  const title = `${u.fullname} (@${u.username})`;
  const description = clamp(u.bio || `${u.fullname} — MedaGama MedStream profili.`);
  const rawImage = u.cover_image || u.avatar || undefined;
  const image = typeof rawImage === 'string' ? absoluteUrl(rawImage) : undefined;

  return {
    title,
    description,
    alternates: altLanguages(`/@${u.username}`),
    openGraph: {
      title: `${title} | MedStream`,
      description,
      url: `/@${u.username}`,
      type: 'profile',
      ...(image && { images: [{ url: image, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${title} | MedStream`,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function Page({ params }) {
  const { handle } = await params;
  // Accept @handle (and tolerate %40 encoding). Non-@ single segments fall through
  // to the profile screen, which renders a friendly "not found" if no such handle.
  const decoded = decodeURIComponent(handle || '');
  if (!decoded || (!decoded.startsWith('@') && !decoded.startsWith('%40'))) {
    notFound();
  }
  return <MedStreamProfile />;
}
