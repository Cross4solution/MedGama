import React from 'react';
import { useParams } from 'react-router-dom';
import Modal from '../components/common/Modal';
import { ThumbsUp } from 'lucide-react';

function useFollow(profileId) {
  const key = `follow_${profileId}`;
  const [following, setFollowing] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(key) || 'false'); } catch { return false; }
  });
  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(following));
  }, [following]);
  return { following, setFollowing };
}

function useMockPatient(profileId) {
  const idx = Number((profileId || '').replace('pat-', '')) || 1;
  const name = `Patient ${idx}`;
  const actor = {
    id: profileId,
    role: 'patient',
    name,
    title: 'Shared experiences',
    avatarUrl: '/images/portrait-candid-male-doctor_720.jpg',
  };
  const posts = Array.from({ length: 4 }).map((_, i) => ({
    id: `${profileId}-post-${i+1}`,
    actor,
    text: `Review #${i+1}: Very satisfied with the treatment. Staff was kind and professional. This is a demo placeholder to mimic patient posts.`,
    likes: 6 + i * 2,
    comments: 1 + (i % 2),
    media: i % 2 ? [{ url: '/images/petr-magera-huwm7malj18-unsplash_720.jpg' }] : [],
    timeAgo: `${i+1} gün`,
  }));
  const followers = Array.from({ length: 6 }).map((_, i) => ({
    id: `pf-${i+1}`,
    name: `User ${i+1}`,
    avatarUrl: '/images/portrait-candid-male-doctor_720.jpg',
  }));
  return { actor, posts, followers };
}

export default function PatientProfile() {
  const { id } = useParams();
  const { actor, posts, followers } = useMockPatient(id);
  const { following, setFollowing } = useFollow(id);
  const [showFollowers, setShowFollowers] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-xl bg-white border shadow-sm p-4 flex items-center gap-4">
          <img src={actor.avatarUrl} alt={actor.name} className="w-20 h-20 rounded-full object-cover border" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 truncate">{actor.name}</h1>
            <p className="text-sm text-gray-600 truncate">{actor.title}</p>
            <div className="mt-1 text-xs text-gray-500">Patient • Public</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFollowing(v => !v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${following ? 'bg-gray-100 text-gray-900' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {following ? 'Takipten Çık' : 'Takip Et'}
            </button>
            <button type="button" onClick={() => setShowFollowers(true)} className="px-3 py-2 rounded-lg text-sm border">Takipçiler</button>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm text-gray-500 mb-2">Gönderiler</div>
          <div className="space-y-3">
            {posts.map(p => (
              <article key={p.id} className="rounded-xl border bg-white shadow-sm p-3">
                <div className="flex items-start gap-3">
                  <img src={p.actor.avatarUrl} alt={p.actor.name} className="w-10 h-10 rounded-full border" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{p.actor.name}</div>
                    <div className="text-xs text-gray-500">{p.timeAgo}</div>
                  </div>
                </div>
                <p className="mt-2 text-[15px] leading-6 text-gray-800">{p.text}</p>
                {p.media?.[0]?.url && (
                  <img src={p.media[0].url} alt="" className="mt-2 w-full max-h-[420px] object-cover rounded" />
                )}
                <div className="mt-3 text-sm text-gray-500 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2"><ThumbsUp className="w-4 h-4" />{p.likes}</div>
                  <div><button className="hover:underline">{p.comments} yorum</button></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <Modal open={showFollowers} onClose={() => setShowFollowers(false)} title="Takipçiler">
        <ul className="divide-y">
          {followers.map(f => (
            <li key={f.id} className="py-2 flex items-center gap-3">
              <img src={f.avatarUrl} alt={f.name} className="w-8 h-8 rounded-full border" />
              <span className="text-sm text-gray-800">{f.name}</span>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
