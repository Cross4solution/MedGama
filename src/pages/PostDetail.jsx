import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { MapPin, MessageCircle, ThumbsUp, Send, Repeat, X } from 'lucide-react';

export default function PostDetail() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [showComments, setShowComments] = React.useState(false);

  // ExploreTimeline/TimelineCard üzerinden gelen state öncelikli
  const item = state?.item;

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-600">
          <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900">← Geri</button>
          <div className="rounded-2xl border bg-white p-8">Post bulunamadı. Lütfen Explore Timeline üzerinden bir karta tıklayın.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[90]">
      <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-[minmax(260px,1fr)_minmax(360px,560px)]">
        {/* Left: Image viewer */}
        <div className="relative flex items-center justify-center bg-black">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-10 text-white/80 hover:text-white"
            aria-label="Kapat"
          >
            <X className="w-6 h-6" />
          </button>
          <img src={item.media?.[0]?.url || item.img} alt={item.title} className="max-h-[85vh] w-auto object-contain" />
        </div>

        {/* Right: Content panel */}
        <div className="bg-white h-full overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b flex items-center gap-3">
            <img src={item.actor?.avatarUrl || item.avatar || '/images/portrait-candid-male-doctor_720.jpg'} alt={item.title} className="w-10 h-10 rounded-full object-cover border" />
            <div className="min-w-0">
              <h1 className="font-semibold text-gray-900 truncate" title={item.title}>{item.actor?.name || item.title}</h1>
              <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.city}</p>
            </div>
            {item.specialty && (
              <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">{item.specialty}</span>
            )}
          </div>

          {/* Text */}
          <div className="p-4">
            <p className="text-[15px] leading-7 text-gray-800 whitespace-pre-wrap">{item.text}</p>
          </div>

          {/* Actions */}
          <div className="px-3 md:px-4 py-2 border-y grid grid-cols-4">
            <button type="button" className="inline-flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <ThumbsUp className="w-4 h-4" /> <span>Like</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              onClick={() => setShowComments(s => !s)}
            >
              <MessageCircle className="w-4 h-4" /> <span>Comment</span>
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <Repeat className="w-4 h-4" /> <span>Share</span>
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <Send className="w-4 h-4" /> <span>Send</span>
            </button>
          </div>

          {/* Comments (collapsible, LinkedIn-like) */}
          {showComments && (
            <div className="p-4">
              {/* New comment input */}
              <div className="flex items-start gap-2">
                <img src={item.actor?.avatarUrl || '/images/portrait-candid-male-doctor_720.jpg'} alt="Your avatar" className="w-8 h-8 rounded-full object-cover border" />
                <input placeholder="Write a comment…" className="flex-1 border rounded-full px-3 py-2 text-sm" />
              </div>

              {/* Threaded comments */}
              <div className="mt-4 space-y-4 text-sm">
                {/* Parent */}
                <div className="flex items-start gap-3">
                  <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Zehra Korkmaz" className="w-9 h-9 rounded-full object-cover border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">Zehra Korkmaz</span>
                      <span className="text-[11px] text-gray-500">1 week</span>
                    </div>
                    <p className="text-gray-800 mt-0.5">Very informative, thanks.</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <button type="button" className="hover:text-gray-700">Like</button>
                      <button type="button" className="hover:text-gray-700">Reply</button>
                      <span>1 reply</span>
                    </div>

                    {/* Reply */}
                    <div className="mt-3 pl-4 border-l">
                      <div className="flex items-start gap-3">
                        <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Dr. Bora Eren" className="w-8 h-8 rounded-full object-cover border" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">Dr. Bora Eren</span>
                            <span className="text-[11px] text-gray-500">1 week</span>
                          </div>
                          <p className="text-gray-800 mt-0.5"><span className="font-semibold">Zehra Korkmaz</span> glad it helped 🙏</p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                            <button type="button" className="hover:text-gray-700">Like</button>
                            <button type="button" className="hover:text-gray-700">Reply</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Another parent */}
                <div className="flex items-start gap-3">
                  <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Onur Demirtaş" className="w-9 h-9 rounded-full object-cover border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">Onur Demirtaş</span>
                      <span className="text-[11px] text-gray-500">5 days</span>
                    </div>
                    <p className="text-gray-800 mt-0.5">Great update 👏</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <button type="button" className="hover:text-gray-700">Like</button>
                      <button type="button" className="hover:text-gray-700">Reply</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
