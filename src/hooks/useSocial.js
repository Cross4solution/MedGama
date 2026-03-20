import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { socialAPI } from '../lib/api';

/**
 * useSocial — manages follow & favorite state for a target (doctor / clinic).
 *
 * Uses API when available, falls back to localStorage for offline / demo mode.
 *
 * @param {'doctor'|'clinic'} targetType
 * @param {string|null}       targetId
 * @param {object}            initial  — { isFollowing, isFavorited, followerCount }
 * @param {object}            targetMeta — { name, codename, avatar, ... }
 * @param {object}            callbacks — { onFavoriteChange: (favorited) => void }
 */
export default function useSocial(targetType, targetId, initial = {}, targetMeta = {}, callbacks = {}) {
  const { user, token } = useAuth();
  const { increment: favIncrement, decrement: favDecrement } = useFavorites();
  const isLoggedIn = !!(user && (token || localStorage.getItem('auth_state')));

  // ── Local storage key helpers ──
  const readLS = (action) => {
    try { return JSON.parse(localStorage.getItem(`social_${action}_${targetType}_${targetId}`)); } catch { return null; }
  };
  const writeLS = useCallback((action, val) => {
    try { localStorage.setItem(`social_${action}_${targetType}_${targetId}`, JSON.stringify(val)); } catch {}
  }, [targetType, targetId]);

  // ── State ──
  const [isFollowing, setIsFollowing] = useState(initial.isFollowing ?? readLS('follow') ?? false);
  const [isFavorited, setIsFavorited] = useState(initial.isFavorited ?? readLS('favorite') ?? false);
  const [followerCount, setFollowerCount] = useState(initial.followerCount ?? 0);
  const [followLoading, setFollowLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Sync initial values when they change (e.g. after API fetch)
  useEffect(() => {
    if (initial.isFollowing !== undefined) setIsFollowing(initial.isFollowing);
    if (initial.isFavorited !== undefined) setIsFavorited(initial.isFavorited);
    if (initial.followerCount !== undefined) setFollowerCount(initial.followerCount);
  }, [initial.isFollowing, initial.isFavorited, initial.followerCount]);

  // ── Follow / Unfollow ──
  const toggleFollow = useCallback(async () => {
    if (!targetId || followLoading) return;
    setFollowLoading(true);
    const wasFollowing = isFollowing;

    // Optimistic update
    setIsFollowing(!wasFollowing);
    setFollowerCount((c) => wasFollowing ? Math.max(0, c - 1) : c + 1);
    writeLS('follow', !wasFollowing);

    try {
      if (isLoggedIn) {
        await socialAPI.toggleFollow(targetType, targetId);
      }
    } catch {
      // Revert on error
      setIsFollowing(wasFollowing);
      setFollowerCount((c) => wasFollowing ? c + 1 : Math.max(0, c - 1));
      writeLS('follow', wasFollowing);
    } finally {
      setFollowLoading(false);
    }
  }, [targetId, isFollowing, followLoading, isLoggedIn, targetType, writeLS]);

  // ── Favorite / Unfavorite ──
  const toggleFavorite = useCallback(async () => {
    if (!targetId || favoriteLoading) return;
    setFavoriteLoading(true);
    const wasFavorited = isFavorited;

    // Optimistic update
    setIsFavorited(!wasFavorited);
    writeLS('favorite', !wasFavorited);
    // Sidebar count sync
    if (wasFavorited) favDecrement(); else favIncrement();

    // Also maintain a localStorage list of favorited clinics for offline access
    if (targetType === 'clinic') {
      try {
        const LS_KEY = 'medgama_saved_clinics';
        const saved = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
        if (!wasFavorited) {
          // Adding favorite — store clinic meta
          const exists = saved.some(c => c.id === targetId);
          if (!exists) {
            saved.push({
              id: targetId,
              name: targetMeta.name || '',
              codename: targetMeta.codename || '',
              avatar: targetMeta.avatar || '',
              address: targetMeta.address || '',
              rating: targetMeta.rating || 0,
              reviewCount: targetMeta.reviewCount || 0,
              specialty: targetMeta.specialty || '',
            });
            localStorage.setItem(LS_KEY, JSON.stringify(saved));
          }
        } else {
          // Removing favorite
          const filtered = saved.filter(c => c.id !== targetId);
          localStorage.setItem(LS_KEY, JSON.stringify(filtered));
        }
      } catch {}
    }

    try {
      if (isLoggedIn) {
        await socialAPI.toggleFavorite(targetType, targetId);
      }
      // Notify caller of successful change
      callbacks.onFavoriteChange?.(!wasFavorited);
    } catch {
      // Revert on error
      setIsFavorited(wasFavorited);
      writeLS('favorite', wasFavorited);
      // Revert sidebar count
      if (wasFavorited) favIncrement(); else favDecrement();
    } finally {
      setFavoriteLoading(false);
    }
  }, [targetId, isFavorited, favoriteLoading, isLoggedIn, targetType, targetMeta, writeLS, callbacks, favIncrement, favDecrement]);

  return {
    isFollowing,
    isFavorited,
    followerCount,
    followLoading,
    favoriteLoading,
    toggleFollow,
    toggleFavorite,
  };
}
