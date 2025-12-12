import React from 'react';
import { CheckCircle, MapPin, Star, Minus, Edit3 } from 'lucide-react';

export default function DoctorHero(props) {
  const {
    doctorName,
    doctorTitle,
    doctorLocation,
    heroImage,
    isFollowing,
    onToggleFollow,
    onOpenGallery,
    medstreamUrl,
    onEditMedstream,
    isEditMode,
    clinicName = '',
    clinicHref = '',
    clinics,
    followerCount,
    showInviteButton,
    onInvite,
  } = props || {};
  const [showCopyToast, setShowCopyToast] = React.useState(false);

  const clinicBadges = Array.isArray(clinics) && clinics.length
    ? clinics
    : (clinicName ? [{ id: clinicHref || clinicName, name: clinicName, href: clinicHref || '#' }] : []);

  const handleMedstreamClick = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!medstreamUrl) return;
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(medstreamUrl);
      } else {
        const el = document.createElement('textarea');
        el.value = medstreamUrl;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setShowCopyToast(true);
    } catch {
    }
  };

  React.useEffect(() => {
    if (!showCopyToast) return undefined;
    const t = window.setTimeout(() => setShowCopyToast(false), 2000);
    return () => window.clearTimeout(t);
  }, [showCopyToast]);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
      {/* Hero image section */}
      <div
        className="relative h-64 md:h-80 cursor-pointer group"
        onClick={onOpenGallery}
      >
        <img
          src={heroImage}
          alt={doctorName}
          className="w-full h-full object-cover group-hover:brightness-95 transition"
        />

        {/* Rating badge */}
        <div className="absolute top-4 right-4 flex items-center bg-white rounded-full px-3 py-1 shadow-md">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
          <span className="font-semibold">4.9</span>
          <span className="text-gray-600 text-sm ml-1">(342)</span>
        </div>
      </div>

      {/* Content section */}
      <div className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-3">
          <div className="flex-1 min-w-0 max-w-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{doctorName}</h1>
              <CheckCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
              {clinicBadges.map((c) => (
                <span
                  key={c.id || c.href || c.name}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] sm:text-xs font-medium text-[#1C6A83] hover:border-[#1C6A83] hover:bg-[#1C6A83]/5 transition"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1C6A83]" />
                  <span>{c.name}</span>
                </span>
              ))}
            </div>
            <p className="text-base sm:text-lg text-gray-700 mb-1.5">{doctorTitle}</p>

            <div className="flex items-center text-gray-600 mb-1.5 gap-3 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{doctorLocation}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mb-2">
              {typeof followerCount === 'number' && followerCount > 0 && (
                <span>
                  <span className="font-semibold">{followerCount.toLocaleString('en-US')}</span>{' '}
                  followers
                </span>
              )}
            </div>

            {medstreamUrl && (
              <div
                className="mt-1 inline-flex items-center text-gray-700 text-sm focus-within:ring-2 focus-within:ring-[#1C6A83]/40 rounded-md cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMedstreamClick(e);
                }}
              >
                <img
                  alt="Medstream link"
                  className="w-5 h-5 mr-2 flex-shrink-0"
                  src="/images/icon/link.svg"
                />
                <span className="truncate font-medium text-left">{medstreamUrl}</span>
                {isEditMode && onEditMedstream && (
                  <button
                    type="button"
                    className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                    aria-label="Edit Medstream URL"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditMedstream();
                    }}
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {showInviteButton && typeof onInvite === 'function' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onInvite();
                }}
                className="border border-[#1C6A83] text-[#1C6A83] bg-white hover:bg-[#1C6A83]/5 px-3 py-2 sm:px-3 sm:py-1 rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
              >
                <span className="text-sm whitespace-nowrap">Invite</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFollow();
              }}
              className={`${isFollowing
                ? 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                : 'bg-blue-600 text-white hover:bg-blue-700 border-transparent'} border px-3 py-2 sm:px-3 sm:py-1 rounded-xl transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 shadow-sm hover:shadow-md w-28 sm:w-24`}
              aria-label={isFollowing ? 'Unfollow' : 'Follow'}
            >
              {isFollowing ? (
                <>
                  <Minus className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm whitespace-nowrap">Unfollow</span>
                </>
              ) : (
                <>
                  <img
                    src="/images/icon/plus-svgrepo-com.svg"
                    alt="Plus"
                    className="w-4 h-4 flex-shrink-0 brightness-0 invert"
                  />
                  <span className="text-sm whitespace-nowrap">Follow</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showCopyToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-xs rounded-xl bg-gray-900/90 text-white px-4 py-3 shadow-lg flex items-center gap-2 text-sm">
          <img src="/images/icon/link.svg" alt="Copied" className="w-4 h-4 flex-shrink-0 opacity-80" />
          <span className="font-medium">Link copied to clipboard</span>
        </div>
      )}
    </div>
  );
}
