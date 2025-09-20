import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, Smile } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FabricEditor from './editor/FabricEditor';
import PostCreateModal from './timeline/PostCreateModal';

export default function PostComposer() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [initialAction, setInitialAction] = useState(''); // 'photo' | 'video' | 'emoji'
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [viewer, setViewer] = useState(null); // { type: 'photo'|'video', url: string }
  const photoRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const emojiBtnRef = React.useRef(null);
  const emojiPanelRef = React.useRef(null);
  const avatar = '/images/portrait-candid-male-doctor_720.jpg';
  const name = user?.name || 'Guest';
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorImageUrl, setEditorImageUrl] = useState('');
  const [editorIndex, setEditorIndex] = useState(-1);
  const [editorSize, setEditorSize] = useState({ w: 820, h: 480 });

  // Seçilen fotoğraflar için küçük önizlemeler (memory leak olmaması için URL.revokeObjectURL uygulanır)
  useEffect(() => {
    const urls = (selectedPhotos || []).map((file) => ({ url: URL.createObjectURL(file), name: file.name }));
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((u) => { try { URL.revokeObjectURL(u.url); } catch {} });
    };
  }, [selectedPhotos]);

  // Fullscreen modal için FabricEditor boyutlarını viewport'a göre ayarla (scrollsuz sığsın)
  useEffect(() => {
    if (!editorOpen) return;
    const computeSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const outerPadding = 24; // modal iç padding
      const headerHeight = 56; // üst bar yüksekliği
      const toolbarApprox = 120; // FabricEditor sol toolbar genişlik + boşluklar
      const w = Math.max(500, Math.floor(vw - (outerPadding * 2) - toolbarApprox));
      const h = Math.max(360, Math.floor(vh - (outerPadding * 2) - headerHeight));
      setEditorSize({ w, h });
    };
    computeSize();
    window.addEventListener('resize', computeSize);
    return () => window.removeEventListener('resize', computeSize);
  }, [editorOpen]);

  // Seçilen videolar için küçük önizlemeler
  useEffect(() => {
    const urls = (selectedVideos || []).map((file) => ({ url: URL.createObjectURL(file), name: file.name }));
    setVideoPreviews(urls);
    return () => {
      urls.forEach((u) => { try { URL.revokeObjectURL(u.url); } catch {} });
    };
  }, [selectedVideos]);

  const removePhotoAt = (idx) => {
    setSelectedPhotos(arr => arr.filter((_, i) => i !== idx));
  };
  const removeVideoAt = (idx) => {
    setSelectedVideos(arr => arr.filter((_, i) => i !== idx));
  };

  function handlePost(newPost) {
    // TODO: integrate with timeline data store (same as TimelineShareBox)
    // eslint-disable-next-line no-console
    console.log('New post from PatientHome:', newPost);
  }

  const dataURLtoFile = async (dataUrl, fileName = 'edited.png') => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: blob.type || 'image/png' });
  };

  const openEditorForPhoto = (idx) => {
    const p = photoPreviews[idx];
    if (!p) return;
    setEditorIndex(idx);
    setEditorImageUrl(p.url);
    setEditorOpen(true);
  };

  const handleEditorExport = async (dataUrl) => {
    try {
      // replace preview url
      setPhotoPreviews(prev => prev.map((p, i) => i === editorIndex ? { ...p, url: dataUrl } : p));
      // also replace File in selectedPhotos
      const file = await dataURLtoFile(dataUrl, selectedPhotos[editorIndex]?.name || 'edited.png');
      setSelectedPhotos(prev => prev.map((f, i) => i === editorIndex ? file : f));
    } finally {
      setEditorOpen(false);
      setEditorIndex(-1);
      setEditorImageUrl('');
    }
  };

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
            {(photoPreviews.length > 0 || videoPreviews.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {photoPreviews.map((p, idx) => (
                  <div key={`p${idx}`} className="relative w-20 h-20 rounded-lg overflow-hidden border bg-gray-50">
                    <button type="button" onClick={() => setViewer({ type: 'photo', url: p.url })} className="absolute inset-0">
                      <img src={p.url} alt={p.name || `photo-${idx+1}`} className="w-full h-full object-cover" />
                    </button>
                    <div className="absolute left-1.5 bottom-1.5 flex gap-1">
                      <button type="button" onClick={() => openEditorForPhoto(idx)} className="px-1.5 py-0.5 text-[10px] rounded bg-white/90 border border-gray-200 text-gray-700 shadow">Düzenle</button>
                    </div>
                    <button type="button" aria-label="Remove photo" onClick={() => removePhotoAt(idx)} className="absolute -top-1 -right-1 bg-white/90 border border-gray-200 text-gray-600 rounded-full p-1 shadow">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                ))}
                {videoPreviews.map((v, idx) => (
                  <div key={`v${idx}`} className="relative w-24 h-20 rounded-lg overflow-hidden border bg-black/5">
                    <button type="button" onClick={() => setViewer({ type: 'video', url: v.url })} className="absolute inset-0">
                      <video src={v.url} className="w-full h-full object-cover" muted playsInline />
                    </button>
                    <button type="button" aria-label="Remove video" onClick={() => removeVideoAt(idx)} className="absolute -top-1 -right-1 bg-white/90 border border-gray-200 text-gray-600 rounded-full p-1 shadow">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {viewer && (
        <div className="fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setViewer(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative max-w-3xl w-full">
              <button type="button" onClick={() => setViewer(null)} className="absolute -top-3 -right-3 bg-white/90 border border-gray-200 rounded-full p-2 shadow" aria-label="Close preview">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
              <div className="bg-black rounded-lg overflow-hidden">
                {viewer.type === 'photo' ? (
                  <img src={viewer.url} alt="preview" className="w-full h-auto max-h-[80vh] object-contain" />
                ) : (
                  <video src={viewer.url} className="w-full h-auto max-h-[80vh]" controls autoPlay />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {editorOpen && (
        <div className="fixed inset-0 z-[95]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditorOpen(false)} />
          {/* Centered modal container */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-xl overflow-hidden">
              {/* Header bar with close */}
              <div className="h-12 flex items-center justify-between px-4 border-b">
                <div className="font-semibold text-gray-900">Photo Editor</div>
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  aria-label="Close editor"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              {/* Content: fixed moderate size, no scroll */}
              <div className="p-3">
                <FabricEditor
                  imageUrl={editorImageUrl}
                  width={980}
                  height={520}
                  onClose={() => setEditorOpen(false)}
                  onExport={handleEditorExport}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
