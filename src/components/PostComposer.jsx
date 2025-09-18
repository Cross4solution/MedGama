import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, Smile } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PostCreateModal from './timeline/PostCreateModal';

export default function PostComposer() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [initialAction, setInitialAction] = useState(''); // 'photo' | 'video' | 'emoji'
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const photoRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const emojiBtnRef = React.useRef(null);
  const emojiPanelRef = React.useRef(null);
  const avatar = '/images/portrait-candid-male-doctor_720.jpg';
  const name = user?.name || 'Guest';

  // Seçilen fotoğraflar için küçük önizlemeler (memory leak olmaması için URL.revokeObjectURL uygulanır)
  useEffect(() => {
    const urls = (selectedPhotos || []).map((file) => ({ url: URL.createObjectURL(file), name: file.name }));
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((u) => { try { URL.revokeObjectURL(u.url); } catch {} });
    };
  }, [selectedPhotos]);

  function handlePost(newPost) {
    // TODO: integrate with timeline data store (same as TimelineShareBox)
    // eslint-disable-next-line no-console
    console.log('New post from PatientHome:', newPost);
  }

  return (
    <div className="bg-white rounded-xl p-4 border shadow-sm">
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
        {/* Top: Avatar + input-like button */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
            <img
              alt={name}
              className="w-full h-full object-cover object-center"
              src={avatar}
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-1 text-left p-3 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 hover:bg-gray-100"
          >
            Ask a doctor or share your experience...
          </button>
        </div>

        {/* Bottom: actions + post button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
          <div className="flex items-center space-x-6 relative">
            {/* Hidden inputs for direct select */}
            <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={(e)=> setSelectedPhotos(Array.from(e.target.files||[]))} />
            <input ref={videoRef} type="file" accept="video/*" multiple className="hidden" onChange={(e)=> setSelectedVideos(Array.from(e.target.files||[]))} />

            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600" type="button" onClick={() => { photoRef.current?.click(); }}>
              <ImageIcon className="w-5 h-5" aria-hidden="true" />
              <span>Photo</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600" type="button" onClick={() => { videoRef.current?.click(); }}>
              <Video className="w-5 h-5" aria-hidden="true" />
              <span>Video</span>
            </button>
            <button ref={emojiBtnRef} className="flex items-center space-x-2 text-gray-600 hover:text-blue-600" type="button" onClick={() => { setShowEmoji(v=>!v); }}>
              <Smile className="w-5 h-5" aria-hidden="true" />
              <span>Emoji</span>
            </button>
            {showEmoji && (
              <div ref={emojiPanelRef} className="absolute left-0 top-full mt-2 z-50 border rounded-xl bg-white shadow-lg ring-1 ring-black/5 p-2 w-[280px]">
                <div className="grid grid-cols-10 gap-1 text-xl select-none">
                  {['😀','😂','😍','👍','👏','🎉','🙏','🔥','😎','🤔','😢','😮','❤️','💙','💯','✅','⭐','✨'].map((e,i)=> (
                    <button key={i} type="button" className="hover:bg-gray-50 rounded" onClick={() => { setShowEmoji(false); setInitialAction('emoji'); setOpen(true); }}>{e}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto"
          >
            Post
          </button>
        </div>
        <PostCreateModal
          open={open}
          onClose={() => setOpen(false)}
          user={user}
          onPost={handlePost}
          initialAction={initialAction}
          onResetInitialAction={() => setInitialAction('')}
        />
        {(selectedPhotos.length>0 || selectedVideos.length>0) && (
          <div className="mt-2">
            <div className="text-xs text-gray-500">
              {selectedPhotos.length>0 && <span className="mr-3">{selectedPhotos.length} photo selected</span>}
              {selectedVideos.length>0 && <span>{selectedVideos.length} video selected</span>}
            </div>
            {photoPreviews.length > 0 && (
              <div className="mt-2 grid grid-cols-6 sm:grid-cols-8 gap-2">
                {photoPreviews.slice(0,8).map((p, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border bg-gray-50">
                    <img src={p.url} alt={p.name || `photo-${idx+1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                {photoPreviews.length > 8 && (
                  <div className="w-16 h-16 rounded-md border bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                    +{photoPreviews.length - 8}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
