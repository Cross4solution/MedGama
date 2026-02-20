import React from 'react';
import { Heart, MessageCircle, Share2, Clock } from 'lucide-react';
import TimelineActionsRow from './TimelineActionsRow';
import TimelineButton from './TimelineButton';
import Badge from '../Badge';
import { toEnglishTimestamp } from '../../utils/i18n';
import { useAuth } from '../../context/AuthContext';
import useAuthGuard from '../../hooks/useAuthGuard';
import ShareMenu from '../ShareMenu';

export default function TimelinePostCard({ post }) {
  const { user } = useAuth();
  const { guardAction } = useAuthGuard();
  const isPatient = user?.role === 'patient';
  const badgeVariant = (post?.badge?.color && ['teal','blue','purple','amber','green','red','gray'].includes(post.badge.color)) ? post.badge.color : 'blue';
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
      {/* Post Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={post.clinic?.avatar || post.patient?.avatar} alt="Avatar" loading="lazy" className="w-12 h-12 rounded-full object-cover" />
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-800">{post.clinic?.name || post.patient?.name}</h4>
                {post.badge && <Badge label={post.badge.text} variant={badgeVariant} />}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-3 h-3 text-gray-500" />
                <span>{toEnglishTimestamp(post.timestamp)}</span>
              </div>
            </div>
          </div>
          {post.category && (
            <span className="inline-flex items-center gap-1 border font-medium rounded-full text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 ">
              <span>{post.category}</span>
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 pt-4">
        {post.title && <h3 className="font-semibold text-gray-800 mb-2">{post.title}</h3>}
        {post.content && <p className="text-gray-700 mb-4">{post.content}</p>}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span key={tag} className="text-blue-600 hover:underline cursor-pointer">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {post.image && <img src={post.image} alt="Post content" loading="lazy" className="w-full h-64 object-cover" />}

      {/* Post Actions */}
      <div className="p-6 pt-4 border-t border-gray-100">
        <TimelineActionsRow
          left={
            <>
              {isPatient ? (
                <>
                  <button onClick={guardAction(() => {})} className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm border border-gray-200 bg-gray-100 text-gray-900 font-bold transition-none hover:rounded-md">
                    <Heart className="w-5 h-5" strokeWidth={2.5} />
                    <span>{post.engagement.likes}</span>
                  </button>
                  <button onClick={guardAction(() => {})} className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm border border-gray-200 bg-gray-100 text-gray-900 font-bold transition-none hover:rounded-md">
                    <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
                    <span>{post.engagement.comments}</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm border border-gray-200 bg-gray-100 text-gray-900 font-bold transition-none hover:rounded-md">
                    <Heart className="w-5 h-5" strokeWidth={2.5} />
                    <span>{post.engagement.likes}</span>
                  </div>
                  <div className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm border border-gray-200 bg-gray-100 text-gray-900 font-bold transition-none hover:rounded-md">
                    <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
                    <span>{post.engagement.comments}</span>
                  </div>
                  <ShareMenu title="Share" url={typeof window !== 'undefined' ? window.location.href : ''} showNative={false} />
                </>
              )}
            </>
          }
          right={!isPatient && post.hasAppointmentButton ? (
            <TimelineButton className="w-full sm:w-auto" onClick={guardAction(() => {})}>Book Appointment</TimelineButton>
          ) : null}
        />
      </div>
    </div>
  );
}
