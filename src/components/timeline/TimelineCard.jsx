import React from 'react';
import { Heart, MessageCircle, MapPin, Share2, Bookmark } from 'lucide-react';

export default function TimelineCard({ item, disabledActions, view = 'grid', onOpen }) {
  const avatarUrl = item.avatar || '/images/portrait-candid-male-doctor_720.jpg';
  return (
    <article
      className={`group rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
    >
      {view === 'list' ? (
        <div className="flex flex-col md:flex-row">
          <div className="relative md:w-56 h-56 md:h-auto overflow-hidden">
            <img src={item.img} alt={item.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.005]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-black/0" />
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">{item.specialty}</span>
            </div>
          </div>
          <div className="flex-1 p-5">
            <div className="flex items-center gap-3">
              <img src={avatarUrl} alt={item.title} className="w-10 h-10 rounded-full object-cover border" />
              <div className="min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate" title={item.title}>{item.title}</h3>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5"><MapPin className="w-3.5 h-3.5 text-teal-600" /> {item.city}</p>
              </div>
            </div>
            <p className="mt-3 text-[15px] leading-6 text-gray-800 line-clamp-3">{item.text}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-500 text-xs">
                <span className="inline-flex items-center gap-1" aria-label="likes"><Heart className="w-4 h-4" />{item.likes}</span>
                <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
                <span className="inline-flex items-center gap-1" aria-label="comments"><MessageCircle className="w-4 h-4" />{item.comments}</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 shadow-sm">
                <button type="button" disabled={disabledActions} aria-label={disabledActions ? 'Login to like' : 'Like'} className={`p-1.5 rounded-full transition ${disabledActions ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 hover:text-teal-700'}`} onClick={(e)=>e.stopPropagation()}>
                  <Heart className="w-4 h-4" />
                </button>
                <button type="button" disabled={disabledActions} aria-label={disabledActions ? 'Login to comment' : 'Comment'} className={`p-1.5 rounded-full transition ${disabledActions ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 hover:text-teal-700'}`} onClick={(e)=>e.stopPropagation()}>
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button type="button" aria-label="Share" className="p-1.5 rounded-full transition text-gray-600 hover:bg-gray-100 hover:text-teal-700" onClick={(e)=>e.stopPropagation()}>
                  <Share2 className="w-4 h-4" />
                </button>
                <button type="button" aria-label="Save" className="p-1.5 rounded-full transition text-gray-600 hover:bg-gray-100 hover:text-teal-700" onClick={(e)=>e.stopPropagation()}>
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={`relative h-60 overflow-hidden`}>
            <img src={item.img} alt={item.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/0 to-black/0" />
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {item.specialty}
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3">
              <img src={avatarUrl} alt={item.title} className="w-12 h-12 rounded-full object-cover border" />
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate" title={item.title}>{item.title}</h3>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" /> {item.city}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[15px] leading-6 text-gray-800 line-clamp-3">{item.text}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-500 text-xs">
                <span className="inline-flex items-center gap-1" aria-label="likes"><Heart className="w-4 h-4" />{item.likes}</span>
                <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
                <span className="inline-flex items-center gap-1" aria-label="comments"><MessageCircle className="w-4 h-4" />{item.comments}</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 shadow-sm">
                <button type="button" disabled={disabledActions} aria-label={disabledActions ? 'Login to like' : 'Like'} className={`p-1.5 rounded-full transition ${disabledActions ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 hover:text-teal-700'}`} onClick={(e)=>e.stopPropagation()}>
                  <Heart className="w-4 h-4" />
                </button>
                <button type="button" disabled={disabledActions} aria-label={disabledActions ? 'Login to comment' : 'Comment'} className={`p-1.5 rounded-full transition ${disabledActions ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 hover:text-teal-700'}`} onClick={(e)=>e.stopPropagation()}>
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button type="button" aria-label="Share" className="p-1.5 rounded-full transition text-gray-600 hover:bg-gray-100 hover:text-teal-700" onClick={(e)=>e.stopPropagation()}>
                  <Share2 className="w-4 h-4" />
                </button>
                <button type="button" aria-label="Save" className="p-1.5 rounded-full transition text-gray-600 hover:bg-gray-100 hover:text-teal-700" onClick={(e)=>e.stopPropagation()}>
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </article>
  );
}
