'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ArrowLeft, BadgeCheck, MapPin, CalendarDays, Loader2 } from 'lucide-react';
import { useParams, useNavigate, Link } from '@/compat/router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { medStreamAPI } from '../lib/api';
import resolveStorageUrl from '../utils/resolveStorageUrl';
import TimelineCard from '../components/timeline/TimelineCard';
import SEOHead from '../components/seo/SEOHead';

// API post → TimelineCard item (kept in sync with ExploreTimeline normalization)
function mapPostToItem(p) {
  const ec = p.engagement_counter || p.engagementCounter || {};
  const clinicName = p.clinic?.fullname || '';
  const authorRole = p.author?.role_id || 'doctor';
  return {
    id: p.id,
    author_id: p.author_id,
    type: authorRole === 'clinicOwner' ? 'clinic_update' : 'doctor_update',
    title: p.author?.fullname || 'Doctor',
    subtitle: clinicName,
    text: p.content || '',
    likes: ec.like_count || 0,
    comments: ec.comment_count || 0,
    actor: {
      id: p.author_id,
      role: authorRole,
      username: p.author?.username || null,
      name: p.author?.fullname || 'Doctor',
      title: clinicName || (authorRole === 'doctor' ? 'Doctor' : ''),
      avatarUrl: resolveStorageUrl(p.author?.avatar),
    },
    created_at: p.created_at || null,
    timeAgo: p.time_ago || (p.created_at ? new Date(p.created_at).toLocaleDateString() : ''),
    visibility: 'public',
    media_processing: !!p.media_processing,
    media: Array.isArray(p.media) ? p.media : [],
    is_liked: !!p.is_liked,
    is_bookmarked: !!p.is_bookmarked,
  };
}

function joinedLabel(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

const TABS = [
  { key: 'posts', labelKey: 'medstreamProfile.tabPosts' },
  { key: 'media', labelKey: 'medstreamProfile.tabMedia' },
];

export default function MedStreamProfile() {
  const params = useParams();
  // Next dynamic segment is [handle] (e.g. "@dr_ayse"); also tolerate :username
  const rawHandle = params.handle || params.username || '';
  const username = decodeURIComponent(rawHandle).replace(/^@/, '');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user: authUser } = useAuth();

  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [tab, setTab] = useState('posts');
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });

  // Load profile
  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: null, data: null });
    medStreamAPI.profile(username)
      .then((res) => {
        if (!alive) return;
        const d = res?.data || res;
        setState({ loading: false, error: null, data: d });
        setFollowing(!!d?.is_following);
        setCounts(d?.counts || { followers: 0, following: 0 });
      })
      .catch((err) => {
        if (!alive) return;
        setState({ loading: false, error: err?.status === 404 ? 'notfound' : 'error', data: null });
      });
    return () => { alive = false; };
  }, [username]);

  // Load author posts once profile resolved
  const authorId = state.data?.user?.id;
  useEffect(() => {
    if (!authorId) return;
    let alive = true;
    setPostsLoading(true);
    medStreamAPI.posts({ author_id: authorId, per_page: 30, sort: 'recent' })
      .then((res) => {
        if (!alive) return;
        const list = res?.data?.data || res?.data || [];
        setPosts(Array.isArray(list) ? list.map(mapPostToItem) : []);
      })
      .catch(() => { if (alive) setPosts([]); })
      .finally(() => { if (alive) setPostsLoading(false); });
    return () => { alive = false; };
  }, [authorId]);

  const onToggleFollow = useCallback(async () => {
    if (!authUser) { navigate('/login'); return; }
    if (!authorId || followBusy) return;
    setFollowBusy(true);
    const next = !following;
    setFollowing(next);
    setCounts((c) => ({ ...c, followers: Math.max(0, c.followers + (next ? 1 : -1)) }));
    try {
      await medStreamAPI.toggleFollow(authorId);
    } catch {
      // revert on failure
      setFollowing(!next);
      setCounts((c) => ({ ...c, followers: Math.max(0, c.followers + (next ? -1 : 1)) }));
    } finally {
      setFollowBusy(false);
    }
  }, [authUser, authorId, following, followBusy, navigate]);

  const shown = useMemo(() => {
    if (tab === 'media') return posts.filter((p) => (p.media || []).length > 0);
    return posts;
  }, [posts, tab]);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (state.error === 'notfound') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-2xl">@</div>
        <h1 className="text-lg font-bold text-gray-800">{t('medstreamProfile.notFoundTitle')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('medstreamProfile.notFoundDesc', { username })}</p>
        <Link to="/medstream" className="mt-5 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700">{t('medstreamProfile.backToMedStream')}</Link>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-lg font-bold text-gray-800">{t('medstreamProfile.loadErrorTitle')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('medstreamProfile.loadErrorDesc')}</p>
      </div>
    );
  }

  const u = state.data.user;
  const canPost = state.data.can_post;
  const isSelf = authUser?.id && authUser.id === u.id;
  const avatar = resolveStorageUrl(u.avatar) || '/images/default/default-avatar.svg';
  const roleLabel = ({
    doctor: t('medstreamProfile.roleDoctor'),
    clinic: t('medstreamProfile.roleClinic'),
    clinicOwner: t('medstreamProfile.roleClinic'),
    hospital: t('medstreamProfile.roleHospital'),
  }[u.role_id]) || '';

  return (
    <div className="max-w-[680px] mx-auto bg-white min-h-screen border-x border-gray-100">
      <SEOHead
        title={`${u.fullname} (@${u.username}) — MedStream`}
        description={u.bio || t('medstreamProfile.seoDescription', { name: u.fullname })}
      />

      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-5 px-4 h-14 bg-white/90 backdrop-blur border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100" aria-label={t('common.back')}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-1 font-bold text-[15px] truncate">
            {u.fullname}
            {u.is_verified && <BadgeCheck className="w-4 h-4 text-sky-500 flex-shrink-0" />}
          </div>
          <div className="text-xs text-gray-500">{t('medstreamProfile.postCount', { count: posts.length })}</div>
        </div>
      </div>

      {/* Cover */}
      <div className="relative">
        <div className="h-40 sm:h-48 w-full bg-gradient-to-br from-teal-500 via-emerald-500 to-sky-600 overflow-hidden">
          {u.cover_image && (
            <img src={resolveStorageUrl(u.cover_image)} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        {/* Avatar */}
        <div className="absolute left-4 -bottom-12 sm:-bottom-14">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-white overflow-hidden bg-gray-100">
            <img src={avatar} alt={u.fullname} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }} />
          </div>
        </div>
      </div>

      {/* Follow / edit button */}
      <div className="flex justify-end px-4 pt-3 h-14">
        {isSelf ? (
          <Link to="/profile" className="px-4 py-1.5 rounded-full border border-gray-300 text-sm font-semibold hover:bg-gray-50">{t('medstreamProfile.editProfile')}</Link>
        ) : (
          <button
            onClick={onToggleFollow}
            disabled={followBusy}
            className={`px-5 py-1.5 rounded-full text-sm font-bold transition-colors disabled:opacity-60 ${
              following ? 'bg-white border border-gray-300 text-gray-900 hover:border-red-300 hover:text-red-600' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {following ? t('medstreamProfile.following') : t('medstreamProfile.follow')}
          </button>
        )}
      </div>

      {/* Identity */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-extrabold text-gray-900">{u.fullname}</h1>
          {u.is_verified && <BadgeCheck className="w-5 h-5 text-sky-500" />}
        </div>
        <div className="text-gray-500 text-[15px]">@{u.username}</div>

        {u.bio && <p className="mt-3 text-[15px] text-gray-800 whitespace-pre-line">{u.bio}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
          {roleLabel && (
            <span className="inline-flex items-center gap-1 text-teal-700 font-medium">{roleLabel}</span>
          )}
          {u.country && (
            <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{u.country}</span>
          )}
          {u.created_at && (
            <span className="inline-flex items-center gap-1"><CalendarDays className="w-4 h-4" />{t('medstreamProfile.joinedOn', { date: joinedLabel(u.created_at) })}</span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-5 text-sm">
          <span><span className="font-bold text-gray-900">{counts.following ?? 0}</span> <span className="text-gray-500">{t('medstreamProfile.followingCount')}</span></span>
          <span><span className="font-bold text-gray-900">{counts.followers ?? 0}</span> <span className="text-gray-500">{t('medstreamProfile.followersCount')}</span></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 sticky top-14 bg-white/95 backdrop-blur z-10">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`flex-1 py-3.5 text-sm font-semibold relative hover:bg-gray-50 ${tab === tabItem.key ? 'text-gray-900' : 'text-gray-500'}`}
          >
            {t(tabItem.labelKey)}
            {tab === tabItem.key && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-teal-600" />}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="divide-y divide-gray-100">
        {postsLoading ? (
          <div className="py-16 flex justify-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : shown.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-gray-600">
              {tab === 'media' ? t('medstreamProfile.noMediaYet') : t('medstreamProfile.noPostsYet')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {canPost ? t('medstreamProfile.emptyOwnAccount') : t('medstreamProfile.emptyOtherAccount')}
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {shown.map((it) => (
              <TimelineCard
                key={it.id}
                item={it}
                view="list"
                onOpen={() => navigate(`/post/${encodeURIComponent(it.id)}`, { state: { item: it } })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
