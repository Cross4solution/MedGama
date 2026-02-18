import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getCountryNames } from '../data/cityLoader';
import countryCodes from '../data/countryCodes';
import TimelineFilterSidebar from 'components/timeline/TimelineFilterSidebar';
import TimelineControls from 'components/timeline/TimelineControls';
import ActiveFilterChips from 'components/timeline/ActiveFilterChips';
import TimelineCard from 'components/timeline/TimelineCard';
import SkeletonCard from 'components/timeline/SkeletonCard';
import SPECIALTIES from '../data/specialties';
import { medStreamAPI } from '../lib/api';
import { resizeImages } from '../utils/imageResize';

// Basit mock feed üretici: guest için random, user için follow-first + location mix simülasyonu

// Removed EN-only datasets for procedure/symptom autocomplete (panel dropped)

function useExploreFeed({ mode = 'guest', countryName = '', specialtyFilter = '', textQuery = '', page = 1, pageSize = 12, sort = 'top', tab = 'for-you', refreshKey = 0, injectedPosts = [] }) {
  // API'den gelen postlar
  const [apiPosts, setApiPosts] = useState([]);
  const [apiLoaded, setApiLoaded] = useState(false);

  useEffect(() => {
    medStreamAPI.posts({ per_page: 50 }).then((res) => {
      const list = res?.data || [];
      if (list.length) {
        setApiPosts(list.map((p) => ({
          id: p.id,
          type: 'doctor_update',
          title: p.author?.fullname || 'Doctor',
          subtitle: '',
          city: '',
          img: p.media_url || '/images/petr-magera-huwm7malj18-unsplash_720.jpg',
          text: p.content || '',
          likes: p.engagementCounter?.like_count || 0,
          comments: p.engagementCounter?.comment_count || 0,
          specialty: '',
          countryCode: '',
          actor: {
            id: p.author_id,
            role: p.author?.role_id || 'doctor',
            name: p.author?.fullname || 'Doctor',
            title: '',
            avatarUrl: p.author?.avatar || '/images/portrait-candid-male-doctor_720.jpg',
          },
          socialContext: '',
          timeAgo: p.created_at ? new Date(p.created_at).toLocaleDateString() : '',
          visibility: 'public',
          media: p.media_url ? [{ url: p.media_url }] : [{ url: '/images/petr-magera-huwm7malj18-unsplash_720.jpg' }],
        })));
      }
      setApiLoaded(true);
    }).catch(() => setApiLoaded(true));
  }, [refreshKey]);

  // Kaynak data — mock fallback
  const base = useMemo(() => {
    const specialties = SPECIALTIES;
    const clinics = ['Anadolu Health Center','Memorial','Ege University','Acibadem','Medicana','Florence Nightingale'];
    const cities = ['Istanbul, TR','Ankara, TR','Izmir, TR','Berlin, DE','Munich, DE','London, GB','New York, US'];
    const items = [];
    for (let i = 0; i < 120; i++) {
      const sp = specialties[i % specialties.length];
      const cl = clinics[i % clinics.length];
      const ct = cities[i % cities.length];
      // Tüm içerikleri doktor veya klinik güncellemesi yapıyoruz
      const isDoctor = i % 2 === 0; // Yarısı doktor, yarısı klinik güncellemesi
      const isClinic = !isDoctor;
      
      const doctorUpdates = [
        'We are pleased to announce that our clinic has successfully performed over 500 minimally invasive cardiac procedures this year with a 99% success rate.',
        'Our research team has published a new study on advanced treatment methods in the Journal of Medical Innovation.',
        'We are proud to introduce our new state-of-the-art cardiac catheterization lab for more accurate diagnoses.'
      ];
      
      const clinicUpdates = [
        'We are excited to announce the opening of our new cardiology wing with cutting-edge technology.',
        'Our hospital has been recognized as a Center of Excellence for Cardiac Care.',
        'We are proud to introduce our new patient-centered care program for personalized treatment plans.'
      ];
      
      const updateText = isDoctor 
        ? doctorUpdates[i % doctorUpdates.length]
        : clinicUpdates[i % clinicUpdates.length];
      // build media list (1-4 images) for LinkedIn-like grid
      const mediaPool = [
        { url: '/images/petr-magera-huwm7malj18-unsplash_720.jpg' },
        { url: '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg' },
        { url: '/images/care-team-with-patient_720.jpg' },
        { url: '/images/doctor-explaining_720.jpg' },
      ];
      const mediaCount = 1 + (i % 4); // 1..4
      const media = mediaPool.slice(0, mediaCount);

      items.push({
        id: `it-${i+1}`,
        type: isDoctor ? 'doctor_update' : 'clinic_update',
        title: isDoctor ? `Dr. ${['Ahmet','Ayşe','Mehmet','Elif','Can'][i%5]}` : `${cl}`,
        subtitle: sp,
        city: ct,
        img: i % 2 === 0 ? '/images/petr-magera-huwm7malj18-unsplash_720.jpg' : '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg',
        text: updateText,
        likes: 20 + (i % 100),
        comments: 2 + (i % 15),
        specialty: sp,
        countryCode: ct.split(', ')[1],
        // LinkedIn-like additions
        actor: {
          id: isDoctor ? `doc-${(i%20)+1}` : `clinic-${(i%20)+1}`,
          role: isDoctor ? 'doctor' : 'clinic',
          name: isDoctor ? ("Dr. " + ['Ahmet','Ayşe','Mehmet','Elif','Can'][i%5]) : cl,
          title: sp,
          avatarUrl: '/images/portrait-candid-male-doctor_720.jpg',
        },
        socialContext: i % 5 === 0 ? 'MedGama bunu beğendi' : (i % 7 === 0 ? 'Bir bağlantın bunu beğendi' : ''),
        timeAgo: (1 + (i % 6)) + ' gün',
        visibility: 'public',
        media,
      });
    }
    return items;
  }, []);

  // API verileri varsa onları kullan, yoksa mock — injected posts always on top
  // Don't show mock data while API is still loading (prevents flash on navigation)
  const baseSource = !apiLoaded ? [] : (apiPosts.length > 0 ? apiPosts : base);
  const source = injectedPosts.length > 0 ? [...injectedPosts, ...baseSource] : baseSource;

  const filtered = useMemo(() => {
    // Separate injected (local) posts from the rest — they always stay on top
    const injectedIds = new Set(injectedPosts.map(p => p.id));
    const pinned = source.filter(x => injectedIds.has(x.id));
    let list = source.filter(x => !injectedIds.has(x.id));

    // Ülke adı -> ülke koduna çeviri (countryCodes)
    const codeLower = countryName ? (countryCodes[countryName] || '').toLowerCase() : '';
    if (codeLower) list = list.filter(x => (x.countryCode || '').toLowerCase() === codeLower);
    if (specialtyFilter) list = list.filter(x => x.specialty === specialtyFilter);
    if (textQuery) {
      const q = textQuery.toLowerCase();
      list = list.filter(x => (x.title + ' ' + x.subtitle + ' ' + x.text).toLowerCase().includes(q));
    }
    // Tab ve mode etkisi
    if (tab === 'for-you') {
      if (mode === 'user') {
        const followed = list.filter((_, idx) => idx % 3 !== 0);
        const others = list.filter((_, idx) => idx % 3 === 0);
        list = [...followed, ...others];
      }
    } else if (tab === 'latest') {
      list = [...list].reverse();
    }
    // Sıralama
    if (sort === 'top') {
      list = [...list].sort((a,b) => (b.likes + b.comments) - (a.likes + a.comments));
    } else if (sort === 'recent') {
      list = [...list];
    }
    // Pinned (injected) posts always first
    return [...pinned, ...list];
  }, [source, injectedPosts, countryName, specialtyFilter, textQuery, mode, sort, tab]);

  const paged = useMemo(() => {
    const start = 0;
    const end = page * pageSize;
    return filtered.slice(start, end);
  }, [filtered, page, pageSize]);

  const hasMore = paged.length < filtered.length;

  return { items: paged, hasMore, total: filtered.length };
}

// Card ve Skeleton bileşenleri ayrı dosyalara taşındı

export default function ExploreTimeline() {
  const { user, country } = useAuth();
  const disabledActions = false; // allow interactions for all users
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [countryName, setCountryName] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('top'); // top | recent
  const [tab, setTab] = useState('for-you'); // for-you | latest
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);
  const PLACEHOLDER_IMG = '/images/petr-magera-huwm7malj18-unsplash_720.jpg';
  const sanitizeBlobUrls = (post) => {
    const clean = { ...post };
    if (clean.img && clean.img.startsWith('blob:')) clean.img = PLACEHOLDER_IMG;
    if (Array.isArray(clean.media)) {
      clean.media = clean.media
        .filter(m => m.url && !m.url.startsWith('blob:'));
    }
    delete clean._uploading;
    delete clean._uploadFailed;
    return clean;
  };

  const [localPosts, setLocalPosts] = useState(() => {
    try {
      const saved = sessionStorage.getItem('explore_local_posts');
      if (!saved) return [];
      return JSON.parse(saved).filter(p => !p._uploading);
    } catch { return []; }
  });

  // Persist localPosts to sessionStorage — sanitize blob URLs, skip uploading
  useEffect(() => {
    try {
      const persistable = localPosts
        .filter(p => !p._uploading)
        .map(sanitizeBlobUrls);
      if (persistable.length > 0) {
        sessionStorage.setItem('explore_local_posts', JSON.stringify(persistable));
      } else {
        sessionStorage.removeItem('explore_local_posts');
      }
    } catch {}
  }, [localPosts]);

  // Composer state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerPhotos, setComposerPhotos] = useState([]);
  const [composerVideos, setComposerVideos] = useState([]);
  const [composerPhotoUrls, setComposerPhotoUrls] = useState([]);
  const [composerVideoUrls, setComposerVideoUrls] = useState([]);
  const [composerPapers, setComposerPapers] = useState([]);
  const [composerPaperNames, setComposerPaperNames] = useState([]);
  const hasMedia = composerPhotos.length > 0 || composerVideos.length > 0 || composerPapers.length > 0;
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100
  const [uploadError, setUploadError] = useState('');
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const paperInputRef = useRef(null);
  // Emoji picker state
  const [showEmojiInline, setShowEmojiInline] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(0);
  const emojiAnchorModalRef = useRef(null);
  const emojiModalRef = useRef(null);
  const EMOJI_CATEGORIES = [
    { icon: '😀', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','🥰','😍','🤩','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟'] },
    { icon: '👋', emojis: ['👋','👏','🙌','🤝','👍','👎','✊','🤛','🤜','🤞','✌️','🤟','🤘','👌','🤌','🤏','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👐','💪','🦾','🙏','✍️','🤳','💅'] },
    { icon: '❤️', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','🫶','🫀','💋','💌','💐','🌹','🌷','🌸','🌺','🌻','🌼','💮'] },
    { icon: '🏆', emojis: ['🏆','🥇','🥈','🥉','🏅','🎖️','⭐','🌟','💫','✨','🔥','💯','🎯','🚀','💡','📈','📊','🧠','💎','👑','🎓','📚','🔬','🩺','💊','🏥','⚕️','🧬','🔭','📝','✅','🎗️'] },
    { icon: '🎉', emojis: ['🎉','🎊','🎈','🎁','🎀','🎂','🍰','🥂','🍾','🎶','🎵','🎤','🎧','🎬','📸','🎨','🎭','🎪','🎡','🎢','🎠','🌈','☀️','🌙','⭐','🌍','🏖️','🏔️','🌊','🍀','🦋','🕊️'] },
  ];
  const EMOJI_LIST = EMOJI_CATEGORIES[emojiCategory]?.emojis || EMOJI_CATEGORIES[0].emojis;

  const insertEmoji = (e) => {
    setComposerText((t) => (t ? t + ' ' + e : e));
  };

  // BUG5: Close emoji picker when clicking outside
  useEffect(() => {
    if (!showEmojiModal) return;
    const handler = (e) => {
      if (emojiModalRef.current && !emojiModalRef.current.contains(e.target) &&
          emojiAnchorModalRef.current && !emojiAnchorModalRef.current.contains(e.target)) {
        setShowEmojiModal(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmojiModal]);

  // Build preview URLs for composer photos/videos
  useEffect(() => {
    const urls = composerPhotos.map(f => URL.createObjectURL(f));
    setComposerPhotoUrls(urls);
    return () => urls.forEach(u => { try { URL.revokeObjectURL(u); } catch {} });
  }, [composerPhotos]);

  useEffect(() => {
    const urls = composerVideos.map(f => URL.createObjectURL(f));
    setComposerVideoUrls(urls);
    return () => urls.forEach(u => { try { URL.revokeObjectURL(u); } catch {} });
  }, [composerVideos]);

  const [composerPosting, setComposerPosting] = useState(false);

  // File size limits (bytes)
  const MAX_PHOTO_SIZE = 10 * 1024 * 1024;   // 10 MB
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024;   // 100 MB
  const MAX_PAPER_SIZE = 20 * 1024 * 1024;    // 20 MB

  const formatSize = (bytes) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  async function handleComposerPost() {
    if (composerPosting) return;
    const trimmed = composerText.trim();
    if (!trimmed && !hasMedia) return;

    // Validate file sizes before upload
    for (const f of composerPhotos) {
      if (f.size > MAX_PHOTO_SIZE) {
        setUploadError(`Photo "${f.name}" is too large (${formatSize(f.size)}). Max: 10 MB.`);
        return;
      }
    }
    for (const f of composerVideos) {
      if (f.size > MAX_VIDEO_SIZE) {
        setUploadError(`Video "${f.name}" is too large (${formatSize(f.size)}). Max: 100 MB.`);
        return;
      }
    }
    for (const f of composerPapers) {
      if (f.size > MAX_PAPER_SIZE) {
        setUploadError(`File "${f.name}" is too large (${formatSize(f.size)}). Max: 20 MB.`);
        return;
      }
    }

    setComposerPosting(true);
    setUploadProgress(0);
    setUploadError('');

    // Determine post type
    const postType = composerVideos.length > 0 ? 'video'
      : composerPhotos.length > 0 ? 'image'
      : composerPapers.length > 0 ? 'document'
      : 'text';

    // Build optimistic local post with ALL local preview URLs
    const localId = 'local-' + Date.now();
    const allMedia = [
      ...composerPhotoUrls.map(url => ({ url, type: 'image' })),
      ...composerVideoUrls.map(url => ({ url, type: 'video' })),
    ];
    const coverImg = allMedia[0]?.url || '/images/petr-magera-huwm7malj18-unsplash_720.jpg';
    const optimisticPost = {
      id: localId,
      type: 'doctor_update',
      title: user?.name || 'Doctor',
      subtitle: '',
      city: '',
      img: coverImg,
      text: trimmed,
      likes: 0,
      comments: 0,
      specialty: '',
      countryCode: '',
      actor: {
        id: user?.id || 'unknown',
        role: user?.role || 'doctor',
        name: user?.name || 'Doctor',
        title: '',
        avatarUrl: user?.avatar || '/images/portrait-candid-male-doctor_720.jpg',
      },
      socialContext: '',
      timeAgo: 'Just now',
      visibility: 'public',
      media: allMedia.length > 0 ? allMedia : [],
      _uploading: true,
    };

    // Grab file references before composer closes and state resets
    // Client-side resize photos before upload (max 2048px, WebP, ~80% quality)
    const photosToUpload = await resizeImages([...composerPhotos]);
    const videosToUpload = [...composerVideos];
    const papersToUpload = [...composerPapers];

    // Show optimistic post in feed immediately
    setLocalPosts(prev => [optimisticPost, ...prev]);
    setIsComposerOpen(false);

    // Upload to backend with real files
    try {
      const res = await medStreamAPI.createPost({
        content: trimmed || undefined,
        post_type: postType,
        photos: photosToUpload,
        videos: videosToUpload,
        papers: papersToUpload,
        onProgress: (pct) => setUploadProgress(pct),
      });

      // Replace optimistic post with server version
      const serverPost = res?.data || res;
      if (serverPost?.id) {
        const serverMedia = serverPost.media_url ? [{ url: serverPost.media_url }] : (serverPost.media || []);
        setLocalPosts(prev => prev.map(p => p.id === localId ? {
          ...optimisticPost,
          id: serverPost.id,
          img: serverPost.media_url || optimisticPost.img,
          media: serverMedia.length > 0 ? serverMedia : optimisticPost.media,
          _uploading: false,
        } : p));
      } else {
        // API returned OK but no structured post — just mark as done
        setLocalPosts(prev => prev.map(p => p.id === localId ? { ...p, _uploading: false } : p));
      }

      // Refresh feed to get full server data
      setFeedRefreshKey(k => k + 1);
    } catch (err) {
      console.error('[ExploreTimeline] Post upload failed:', err?.status, err?.message);
      let errorMsg = err?.message || 'Upload failed. Post saved locally.';
      if (err?.status === 413) {
        errorMsg = 'File too large for server. Please reduce video/image size and try again. (Max: video 50MB, photo 10MB)';
      } else if (err?.status === 422) {
        errorMsg = err?.data?.message || 'Invalid file format. Please check your files.';
      }
      setUploadError(errorMsg);
      // Mark optimistic post as failed but keep it visible
      setLocalPosts(prev => prev.map(p => p.id === localId ? { ...p, _uploading: false, _uploadFailed: true } : p));
    }
    setComposerPosting(false);
    setUploadProgress(0);
  }

  // Cleanup composer state when modal closes
  useEffect(() => {
    if (!isComposerOpen) {
      setComposerPhotos([]);
      setComposerVideos([]);
      setComposerPapers([]);
      setComposerPaperNames([]);
      setComposerText('');
      setShowEmojiModal(false);
      setEmojiCategory(0);
    }
  }, [isComposerOpen]);

  // Removed: EN-only Procedure/Symptom state and helpers (panel dropped)

  const { items, hasMore, total } = useExploreFeed({
    mode: user ? 'user' : 'guest',
    countryName,
    specialtyFilter: specialty,
    textQuery: query,
    page,
    pageSize: 12,
    sort,
    tab,
    refreshKey: feedRefreshKey,
    injectedPosts: localPosts,
  });

  // seçenekler
  const countryOptions = getCountryNames();
  const specialtyOptions = SPECIALTIES;

  // Konum izni (opsiyonel) - tek seferlik izin akışı ve localStorage ile kalıcılık
  const [geo, setGeo] = useState(null);
  const GEO_KEY = 'explore_geo_consent'; // 'granted' | 'denied'
  const GEO_POS_KEY = 'explore_geo_pos'; // JSON: { lat, lon }

  const askGeo = useCallback(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const g = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setGeo(g);
        try {
          localStorage.setItem(GEO_KEY, 'granted');
          localStorage.setItem(GEO_POS_KEY, JSON.stringify(g));
        } catch {}
      },
      () => {
        setGeo({ error: true });
        try { localStorage.setItem(GEO_KEY, 'denied'); } catch {}
      }
    );
  }, []);

  const handleCountryChange = useCallback((val) => {
    if (val === 'Andorra') {
      const ok = window.confirm('Are you there now? Press OK to set Turkey.');
      if (ok) return setCountryName('Turkey');
    }
    setCountryName(val);
  }, []);

  useEffect(() => {
    // Filtre değişince sayfayı başa al
    setPage(1);
  }, [query, specialty, countryName, sort, tab]);

  // Girişliyse, AuthContext.country (örn. 'TR') değerine göre ülke adını otomatik ön seç
  useEffect(() => {
    if (!country || countryName) return;
    const entry = Object.entries(countryCodes).find(([, code]) => (code || '').toLowerCase() === String(country).toLowerCase());
    if (entry) setCountryName(entry[0]);
  }, [country, countryName]);

  // Görünüm sabit: LinkedIn benzeri tek sütun liste

  // Sayfa yüklenince: daha önceki kararı oku; yalnızca kararsızsa sor
  useEffect(() => {
    try {
      const consent = localStorage.getItem(GEO_KEY);
      if (consent === 'granted') {
        const raw = localStorage.getItem(GEO_POS_KEY);
        if (raw) {
          try { setGeo(JSON.parse(raw)); } catch { askGeo(); }
        } else {
          // izin verilmiş ama konum yoksa sessizce yeniden almayı dene (tarayıcı tekrar sormaz)
          askGeo();
        }
      } else if (consent === 'denied') {
        // kullanıcı reddetmiş, otomatik tekrar sorma
      } else {
        // hiç karar yoksa bir kez sor
        askGeo();
      }
    } catch {
      // storage erişimi yoksa varsayılan davranış: bir kez sor
      askGeo();
    }
  }, []);

  // Sonsuz kaydırma: IntersectionObserver
  useEffect(() => {
    if (!hasMore) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsLoadingMore(true);
        // küçük bir gecikme ile daha akıcı his
        setTimeout(() => {
          setPage((p) => p + 1);
          setIsLoadingMore(false);
        }, 300);
      }
    }, { rootMargin: '200px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, items.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 pt-0">
      <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 via-white to-gray-50 fixed top-0 left-0 -z-10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-12 relative">
        {/* Hidden pickers for composer */}
        <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e)=>{
          const files = Array.from(e?.target?.files || []);
          if (files.length) {
            setComposerPhotos(prev => {
              const merged = [...prev];
              files.forEach(f => { if (!merged.some(p => p.name === f.name && p.size === f.size)) merged.push(f); });
              return merged;
            });
          }
          try { e.target.value = ''; } catch {}
        }} />
        <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e)=>{
          const files = Array.from(e?.target?.files || []);
          if (files.length) {
            setComposerVideos(prev => {
              const merged = [...prev];
              files.forEach(f => { if (!merged.some(p => p.name === f.name && p.size === f.size)) merged.push(f); });
              return merged;
            });
          }
          try { e.target.value = ''; } catch {}
        }} />
        <input ref={paperInputRef} type="file" accept="application/pdf,.doc,.docx" multiple className="hidden" onChange={(e)=>{
          const files = Array.from(e?.target?.files || []);
          if (files.length) {
            setComposerPapers(prev => {
              const merged = [...prev];
              files.forEach(f => { if (!merged.some(p => p.name === f.name && p.size === f.size)) merged.push(f); });
              return merged;
            });
            setComposerPaperNames(prev => {
              const names = [...prev];
              files.forEach(f => { if (!names.includes(f.name)) names.push(f.name); });
              return names;
            });
          }
          try { e.target.value = ''; } catch {}
        }} />
        {/* Başlık + Sekmeler + Sıralama */}
        <div className="mb-2">
          <TimelineControls
            user={user}
            sort={sort}
            onSortChange={setSort}
            onUseLocation={askGeo}
            geo={geo}
            showSort={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Filters (LEFT) */}
          <TimelineFilterSidebar
            query={query}
            onQueryChange={setQuery}
            countryName={countryName}
            onCountryChange={handleCountryChange}
            specialty={specialty}
            onSpecialtyChange={setSpecialty}
            countryOptions={countryOptions}
            specialtyOptions={specialtyOptions}
            user={user}
          />

          {/* Feed (RIGHT) */}
          <section className="order-1 lg:order-2">
            <div className="max-w-[555px] mx-auto lg:mx-0 lg:ml-6">
              {/* Composer (doctors/clinics only) */}
              {(() => {
                const isDoctor = !!(user && (user.role === 'doctor' || (user?.specialty || user?.hospital || user?.access)));
                const isClinic = !!(user && (user.role === 'clinic'));
                if (!isDoctor && !isClinic) return null;
                return (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 ring-2 ring-teal-100 ring-offset-1">
                        <img alt="Guest" loading="lazy" className="w-full h-full object-cover object-center" src="/images/portrait-candid-male-doctor_720.jpg" />
                      </div>
                      <button type="button" onClick={()=>setIsComposerOpen(true)} className="flex-1 text-left px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-200/60 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-gray-500 hover:bg-gray-100/80 hover:border-gray-300/60 transition-all duration-200 text-sm">
                        Make a Post...
                      </button>
                    </div>
                    <div className="border-t border-gray-100 mt-4 pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-0.5 sm:gap-1 flex-1 min-w-0 overflow-x-auto">
                          <button onClick={()=>{ setIsComposerOpen(true); setTimeout(()=>imageInputRef.current?.click(),0); }} className="inline-flex items-center gap-1 sm:gap-1.5 text-gray-600 hover:text-emerald-600 py-2 px-2 sm:px-3 rounded-lg hover:bg-emerald-50/60 transition-all duration-200 flex-shrink-0" type="button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-emerald-500" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                            <span className="text-sm font-medium hidden sm:inline">Photo</span>
                          </button>
                          <button onClick={()=>{ setIsComposerOpen(true); setTimeout(()=>videoInputRef.current?.click(),0); }} className="inline-flex items-center gap-1 sm:gap-1.5 text-gray-600 hover:text-sky-600 py-2 px-2 sm:px-3 rounded-lg hover:bg-sky-50/60 transition-all duration-200 flex-shrink-0" type="button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-sky-500" aria-hidden="true"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path><rect x="2" y="6" width="14" height="12" rx="2"></rect></svg>
                            <span className="text-sm font-medium hidden sm:inline">Video</span>
                          </button>
                          <button onClick={()=>{ setIsComposerOpen(true); setShowEmojiModal(true); }} className="inline-flex items-center gap-1 sm:gap-1.5 text-gray-600 hover:text-amber-600 py-2 px-2 sm:px-3 rounded-lg hover:bg-amber-50/60 transition-all duration-200 flex-shrink-0" type="button" aria-label="Add emoji">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-amber-500" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" x2="9.01" y1="9" y2="9"></line><line x1="15" x2="15.01" y1="9" y2="9"></line></svg>
                            <span className="text-sm font-medium hidden sm:inline">Emoji</span>
                          </button>
                          <button onClick={()=>{ setIsComposerOpen(true); setTimeout(()=>paperInputRef.current?.click(),0); }} className="inline-flex items-center gap-1 sm:gap-1.5 text-gray-600 hover:text-indigo-600 py-2 px-2 sm:px-3 rounded-lg hover:bg-indigo-50/60 transition-all duration-200 flex-shrink-0" type="button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-indigo-500" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg>
                            <span className="text-sm font-medium hidden sm:inline">Research</span>
                          </button>
                        </div>
                        <button type="button" onClick={()=>setIsComposerOpen(true)} className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex-shrink-0">Post</button>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {/* Aktif filtre chipleri */}
              <ActiveFilterChips
                items={[
                  countryName && { label: `Country: ${countryName}`, onClear: () => setCountryName('') },
                  specialty && { label: `Specialization: ${specialty}`, onClear: () => setSpecialty('') },
                  query && { label: `Search: “${query}”`, onClear: () => setQuery('') },
                ].filter(Boolean)}
              />
              {/* Upload progress / error banners */}
              {composerPosting && (
                <div className="mb-3 rounded-xl border border-teal-200 bg-teal-50/80 p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-teal-800">Uploading your post...</p>
                      {uploadProgress > 0 && (
                        <div className="mt-1.5 w-full bg-teal-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-teal-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-teal-600 tabular-nums">{uploadProgress > 0 ? `${uploadProgress}%` : ''}</span>
                  </div>
                </div>
              )}
              {uploadError && !composerPosting && (
                <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50/80 p-3 flex items-center justify-between">
                  <p className="text-sm text-rose-700">{uploadError}</p>
                  <button onClick={() => setUploadError('')} className="text-xs font-medium text-rose-500 hover:text-rose-700 ml-3">Dismiss</button>
                </div>
              )}
              <div className="space-y-4">
                {items.map((it) => (
                  <TimelineCard key={it.id} item={it} disabledActions={disabledActions} view={'list'} onOpen={() => navigate(`/post/${encodeURIComponent(it.id)}`, { state: { item: it } })} />
                ))}
                {isLoadingMore && [1,2,3].map((i)=>(<SkeletonCard key={`sk-${i}`} />))}
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium">Showing <span className="text-gray-600 font-semibold">{items.length}</span> of <span className="text-gray-600 font-semibold">{total}</span></p>
                {hasMore && (
                  <>
                    <button onClick={() => setPage(p => p + 1)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200">Load more</button>
                    <span ref={loadMoreRef} className="sr-only">Observer</span>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Composer Modal */}
        {isComposerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-black/50" onClick={()=>setIsComposerOpen(false)}></div>
            <div role="dialog" aria-modal="true" aria-label="Create post" tabIndex={-1} className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-visible animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
                <h3 className="text-lg font-bold text-gray-900">Create post</h3>
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close" onClick={()=>setIsComposerOpen(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-5 h-5" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                </button>
              </div>
              <div className="px-4 sm:px-5 pt-4">
                <div className="flex items-center gap-3">
                  <img alt="Guest" loading="lazy" className="w-10 h-10 rounded-full object-cover border" src="/images/portrait-candid-male-doctor_720.jpg" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user?.name || 'Guest'}</div>
                    <span className="inline-flex items-center gap-1 text-xs text-teal-800 bg-teal-50 border border-teal-100 px-2 py-1 rounded-md">{user?.role === 'clinic' ? 'Clinic' : 'Doctor'}</span>
                  </div>
                </div>
              </div>
              <div className="px-4 sm:px-5 pt-3">
                <textarea rows={hasMedia ? 3 : 5} placeholder={`What's on your mind, ${user?.name || 'Guest'}?`} value={composerText} onChange={(e)=>setComposerText(e.target.value)} className={`w-full text-[17px] leading-7 placeholder:text-gray-400 text-gray-900 outline-none resize-none ${hasMedia ? 'min-h-[80px]' : 'min-h-[140px]'}`}></textarea>
              </div>
              {/* Media Preview */}
              {hasMedia && (
                <div className="px-4 sm:px-5 pb-2">
                  <div className="rounded-xl border border-gray-200/80 bg-gray-50/50 p-2.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Attachments ({composerPhotoUrls.length + composerVideoUrls.length + composerPapers.length})</span>
                      <button type="button" onClick={()=>{ setComposerPhotos([]); setComposerVideos([]); setComposerPapers([]); setComposerPaperNames([]); }} className="text-[11px] font-medium text-rose-500 hover:text-rose-600 transition-colors">Remove all</button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {composerPhotoUrls.map((src, i) => (
                        <div key={`cp${i}`} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200/60 shadow-sm bg-white">
                          <img src={src} alt={`photo-${i+1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={()=>setComposerPhotos(arr=>arr.filter((_,idx)=>idx!==i))} className="absolute top-1 right-1 w-5 h-5 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </div>
                      ))}
                      {composerVideoUrls.map((src, i) => (
                        <div key={`cv${i}`} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200/60 shadow-sm bg-gray-900">
                          <video src={src} className="w-full h-full object-cover" muted playsInline />
                          <button type="button" onClick={()=>setComposerVideos(arr=>arr.filter((_,idx)=>idx!==i))} className="absolute top-1 right-1 w-5 h-5 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ))}
                      {composerPaperNames.map((name, i) => (
                        <div key={`cpaper${i}`} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200/60 shadow-sm bg-indigo-50 flex flex-col items-center justify-center p-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-indigo-500 mb-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                          <span className="text-[9px] font-medium text-indigo-700 text-center leading-tight line-clamp-2 px-1">{name}</span>
                          <button type="button" onClick={()=>{ setComposerPapers(arr=>arr.filter((_,idx)=>idx!==i)); setComposerPaperNames(arr=>arr.filter((_,idx)=>idx!==i)); }} className="absolute top-1 right-1 w-5 h-5 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={()=>imageInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-400 bg-white hover:bg-teal-50/30 flex flex-col items-center justify-center gap-0.5 transition-all group">
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                        <span className="text-[9px] font-medium text-gray-400 group-hover:text-teal-600">Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="px-4 sm:px-5 pt-2 pb-4">
                <div className="rounded-2xl border bg-white relative overflow-visible">
                  <div className="px-4 py-3 text-sm text-gray-600 border-b">Add to your post</div>
                  <div className="p-3">
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      <button onClick={()=>imageInputRef.current?.click()} className="h-10 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 inline-flex items-center gap-2 text-gray-700" aria-label="Add photo">
                        <span className="w-6 h-6 grid place-items-center rounded bg-emerald-50"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image w-4 h-4 text-emerald-600" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg></span>
                        <span className="text-sm">Photo</span>
                      </button>
                      <button onClick={()=>videoInputRef.current?.click()} className="h-10 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 inline-flex items-center gap-2 text-gray-700" aria-label="Add video">
                        <span className="w-6 h-6 grid place-items-center rounded bg-sky-50"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-video w-4 h-4 text-sky-600" aria-hidden="true"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path><rect x="2" y="6" width="14" height="12" rx="2"></rect></svg></span>
                        <span className="text-sm">Video</span>
                      </button>
                      <button ref={emojiAnchorModalRef} onClick={()=>setShowEmojiModal((v)=>!v)} className="h-10 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 inline-flex items-center gap-2 text-gray-700" aria-label="Add emoji">
                        <span className="w-6 h-6 grid place-items-center rounded"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-smile w-4 h-4 sm:w-5 sm:h-5 text-gray-800" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" x2="9.01" y1="9" y2="9"></line><line x1="15" x2="15.01" y1="9" y2="9"></line></svg></span>
                        <span className="text-sm">Emoji</span>
                      </button>
                      <button onClick={()=>paperInputRef.current?.click()} className="h-10 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 inline-flex items-center gap-2 text-gray-700" aria-label="Add research paper">
                        <span className="w-6 h-6 grid place-items-center rounded bg-indigo-50"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text w-4 h-4 text-indigo-600" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg></span>
                        <span className="text-sm whitespace-nowrap">Research Paper</span>
                      </button>
                    </div>
                    {showEmojiModal && (
                      <div ref={emojiModalRef} className="mt-3 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl shadow-lg w-full max-h-[300px] overflow-hidden">
                        <div className="flex border-b border-gray-200 bg-white rounded-t-xl">
                          {EMOJI_CATEGORIES.map((cat, idx)=>(
                            <button key={idx} type="button" onClick={()=>setEmojiCategory(idx)} className={`flex-1 px-2 py-2 text-center transition-all duration-200 ${emojiCategory===idx?'bg-blue-500 text-white border-b-2 border-blue-500':'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`} title="Category">
                              <div className="text-lg">{cat.icon}</div>
                            </button>
                          ))}
                        </div>
                        <div className="p-3 max-h-[220px] overflow-y-auto">
                          <div className="grid grid-cols-6 gap-1">
                            {EMOJI_LIST.map((em, i)=> (
                              <button key={`me-${emojiCategory}-${i}`} type="button" onClick={()=>{ insertEmoji(em); }} className="hover:bg-blue-100 hover:scale-110 rounded-lg p-1 text-center transition-all duration-200 transform hover:shadow-md" title={em}>
                                <span className="text-lg">{em}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-gray-50 border-t border-gray-200 rounded-b-xl"><p className="text-xs text-gray-500 text-center">{EMOJI_LIST.length} emoji</p></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {composerPosting && uploadProgress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                  {composerPosting && (
                    <p className="text-xs text-gray-500 text-center">
                      {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Preparing upload...'}
                    </p>
                  )}
                  <button onClick={handleComposerPost} disabled={(!composerText && !hasMedia) || composerPosting} className={`w-full py-2.5 rounded-xl text-white font-semibold transition-all duration-200 ${((!composerText && !hasMedia) || composerPosting) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-sm hover:shadow-md'}`}>{composerPosting ? 'Uploading...' : 'Post'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Inline emoji picker is now anchored under the Emoji button (rendered inline above) */}
    </div>
  );
}
