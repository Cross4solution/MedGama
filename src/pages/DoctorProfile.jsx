import React from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/layout';
import Modal from '../components/common/Modal';
import TimelineCard from 'components/timeline/TimelineCard';
import { Check, MapPin, Stethoscope, Users, Mail } from 'lucide-react';

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

function useMockDoctor(profileId) {
  // Minimal mock with stable fields
  const docIndex = Number((profileId || '').replace('doc-', '')) || 1;
  const specialties = ['Cardiology','Orthopedics','Neurology','Dermatology','Plastic Surgery'];
  const name = ['Acibadem','Memorial','Ege University','Anadolu Health','Medicana'][docIndex % 5];
  const specialty = specialties[docIndex % specialties.length];
  const actor = {
    id: profileId,
    role: 'doctor',
    name,
    title: specialty,
    avatarUrl: '/images/portrait-candid-male-doctor_720.jpg',
  };
  // generate 5 posts
  const posts = Array.from({ length: 5 }).map((_, i) => ({
    id: `${profileId}-post-${i+1}`,
    actor,
    text: `Update #${i+1}: ${name} - ${specialty} department shared a brief note about improved patient care and outcomes. This is a demo placeholder to mimic LinkedIn-like posts for doctor profiles.`,
    likes: 10 + i * 3,
    comments: 1 + (i % 3),
    media: i % 2 === 0 ? [{ url: '/images/doctor-explaining_720.jpg' }] : [],
    timeAgo: `${i+1} gün`,
  }));
  // followers dummy
  const followers = Array.from({ length: 8 }).map((_, i) => ({
    id: `f-${i+1}`,
    name: `User ${i+1}`,
    avatarUrl: '/images/portrait-candid-male-doctor_720.jpg',
  }));
  return { actor, posts, followers };
}

export default function DoctorProfile() {
  const { id } = useParams();
  const { actor, posts, followers } = useMockDoctor(id);
  const { following, setFollowing } = useFollow(id);
  const [showFollowers, setShowFollowers] = React.useState(false);
  const [tab, setTab] = React.useState('posts'); // posts | about | connections

  React.useEffect(() => {
    document.title = `${actor.name} – ${actor.title} | MedGama`;
  }, [actor.name, actor.title]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cover + Header */}
        <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
          {/* Cover */}
          <div className="h-28 sm:h-32 bg-gradient-to-r from-teal-600 via-teal-500 to-teal-400" />
          {/* Profile row */}
          <div className="px-4 sm:px-6 -mt-10 pb-4">
            <div className="flex items-end gap-4">
              <img src={actor.avatarUrl} alt={actor.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white object-cover" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{actor.name}</h1>
                <div className="mt-0.5 text-sm text-gray-600 flex items-center gap-2 truncate">
                  <Stethoscope className="w-4 h-4 text-teal-700" /> {actor.title}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {followers.length} takipçi</span>
                  <span>•</span>
                  <span>{posts.length} gönderi</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFollowing(v => !v)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${following ? 'bg-gray-100 text-gray-900' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                >
                  {following ? 'Takipten Çık' : 'Takip Et'}
                </button>
                <button type="button" onClick={() => setShowFollowers(true)} className="px-3 py-2 rounded-lg text-sm border">Takipçiler</button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4">
          <div className="flex items-center gap-2 border-b">
            <button onClick={() => setTab('posts')} className={`px-3 py-2 text-sm ${tab==='posts' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-gray-600 hover:text-gray-800'}`}>Gönderiler</button>
            <button onClick={() => setTab('about')} className={`px-3 py-2 text-sm ${tab==='about' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-gray-600 hover:text-gray-800'}`}>Hakkında</button>
            <button onClick={() => setTab('connections')} className={`px-3 py-2 text-sm ${tab==='connections' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-gray-600 hover:text-gray-800'}`}>Bağlantılar</button>
          </div>

          {/* Posts */}
          {tab === 'posts' && (
            <div className="mt-3 space-y-3">
              {posts.map(p => (
                <TimelineCard key={p.id} item={p} disabledActions={true} view={'list'} />
              ))}
            </div>
          )}

          {/* About */}
          {tab === 'about' && (
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <section className="lg:col-span-2 rounded-xl border bg-white shadow-sm p-4">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Hakkında</h2>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-teal-600 mt-0.5" /> {actor.title} alanında 10+ yıl deneyim.</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-teal-600 mt-0.5" /> Uluslararası yayınlar ve çok disiplinli ekip çalışması.</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-teal-600 mt-0.5" /> Hasta memnuniyeti ve klinik sonuçlarda sürdürülebilir iyileşme odaklı.</li>
                </ul>
              </section>
              <aside className="rounded-xl border bg-white shadow-sm p-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">İletişim</h3>
                <div className="text-sm text-gray-700 flex items-center gap-2"><MapPin className="w-4 h-4 text-teal-700" /> İstanbul, TR</div>
                <div className="text-sm text-gray-700 flex items-center gap-2"><Mail className="w-4 h-4 text-teal-700" /> info@example.com</div>
              </aside>
            </div>
          )}

          {/* Connections */}
          {tab === 'connections' && (
            <div className="mt-3 rounded-xl border bg-white shadow-sm p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Takipçiler</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {followers.map(f => (
                  <div key={f.id} className="flex items-center gap-2 border rounded-lg p-2">
                    <img src={f.avatarUrl} alt={f.name} className="w-8 h-8 rounded-full border" />
                    <span className="text-sm text-gray-800 truncate">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
