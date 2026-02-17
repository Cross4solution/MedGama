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
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [viewer, setViewer] = useState(null); // { type: 'photo'|'video', url: string }
  const photoRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const emojiBtnRef = React.useRef(null);
  const emojiPanelRef = React.useRef(null);
  const avatar = '/images/portrait-candid-male-doctor_720.jpg';
  const name = user?.name || 'Guest';

  // Kategorilere ayrılmış emoji listesi
  const emojiCategories = {
    'Yüz İfadeleri': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'],
    'El İşaretleri': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄'],
    'Kalp ve Duygular': ['💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💤', '💋', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊'],
    'Spor ve Oyunlar': ['🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄', '🎴', '🎯', '🎳', '🎮', '🕹️', '🎰', '🧩'],
    'Kutlama ve Parti': ['🎉', '🎊', '🎈', '🎁', '🎂', '🍰', '🧁', '🍾', '🥂', '🍻', '🥳', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄', '🎴', '🎯', '🎳', '🎮', '🕹️', '🎰', '🧩']
  };

  const [selectedCategory, setSelectedCategory] = useState('Yüz İfadeleri');

  // Seçilen fotoğraflar için küçük önizlemeler (memory leak olmaması için URL.revokeObjectURL uygulanır)
  React.useEffect(() => {
    const urls = (selectedPhotos || []).map((file) => ({ url: URL.createObjectURL(file), name: file.name }));
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((u) => { try { URL.revokeObjectURL(u.url); } catch {} }); 
    };
  }, [selectedPhotos]);

  // Seçilen videolar için küçük önizlemeler
  React.useEffect(() => {
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
    // Post created via API in PostCreateModal — newPost contains the server response
  }

  return (
    <div className="bg-white rounded-xl p-4 border shadow-sm">
      {/* Top: Avatar + input-like button or textarea */}
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
          Make a Post...
        </button>
      </div>

      {/* Bottom: actions + post button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
        <div className="flex items-center space-x-2 sm:space-x-4 relative">
          {/* Hidden inputs for direct select */}
          <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={(e)=> setSelectedPhotos(Array.from(e.target.files||[]))} />
          <input ref={videoRef} type="file" accept="video/*" multiple className="hidden" onChange={(e)=> setSelectedVideos(Array.from(e.target.files||[]))} />

          <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 py-0.5 px-1.5 rounded-md hover:bg-gray-50" type="button" onClick={() => { setInitialAction('photo'); setOpen(true); }}>
            <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            <span className="text-xs sm:text-sm">Photo</span>
          </button>
          <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 py-0.5 px-1.5 rounded-md hover:bg-gray-50" type="button" onClick={() => { setInitialAction('video'); setOpen(true); }}>
            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            <span className="text-xs sm:text-sm">Video</span>
          </button>
          <button ref={emojiBtnRef} className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 py-0.5 px-1.5 rounded-md hover:bg-gray-50" type="button" onClick={() => { setShowEmoji(v=>!v); }}>
            <Smile className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            <span className="text-xs sm:text-sm">Emoji</span>
          </button>
          {showEmoji && (
            <div
              ref={emojiPanelRef}
              className="z-50 overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg fixed bottom-4 left-2 w-[min(92vw,420px)] max-h-[60vh] transform sm:absolute sm:bottom-auto sm:left-0 sm:top-full sm:mt-2 sm:w-[400px] sm:max-h-[300px] sm:translate-x-0 sm:transform-none"
            >
              {/* Kategori Tabları - İkonlarla */}
              <div className="flex border-b border-gray-200 bg-white rounded-t-xl">
                {Object.entries(emojiCategories).map(([category]) => {
                  const categoryIcons = {
                    'Yüz İfadeleri': '😀',
                    'El İşaretleri': '👋',
                    'Kalp ve Duygular': '❤️',
                    'Spor ve Oyunlar': '🏆',
                    'Kutlama ve Parti': '🎉'
                  };
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`flex-1 px-2 py-2 text-center transition-all duration-200 ${
                        selectedCategory === category
                          ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                      title={category}
                    >
                      <div className="text-lg">{categoryIcons[category]}</div>
                    </button>
                  );
                })}
              </div>
              
              {/* Emoji Grid */}
              <div className="p-3 max-h-[220px] overflow-y-auto">
                <div className="grid grid-cols-6 gap-1">
                  {emojiCategories[selectedCategory]?.map((emoji, i) => (
                    <button
                      key={i}
                      type="button"
                      className="hover:bg-blue-100 hover:scale-110 rounded-lg p-1 text-center transition-all duration-200 transform hover:shadow-md"
                      onClick={() => { 
                        setShowEmoji(false); 
                        setInitialAction('emoji'); 
                        setOpen(true); 
                      }}
                      title={emoji}
                    >
                      <span className="text-lg">{emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Alt Bilgi */}
              <div className="px-3 py-1 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                <p className="text-xs text-gray-500 text-center">
                  {emojiCategories[selectedCategory]?.length} emoji
                </p>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto text-xs sm:text-sm font-medium"
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
    </div>
  );
}
