import React from 'react';
import { Heart, MessageCircle, Share2, Clock } from 'lucide-react';
import TimelineActionsRow from './TimelineActionsRow';
import TimelineButton from './TimelineButton';
import Badge from './Badge';
import { toEnglishTimestamp } from '../utils/i18n';
import { useAuth } from '../context/AuthContext';

export default function TimelinePostCard({ post }) {
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
      {/* Post Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={post.clinic?.avatar || post.patient?.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-800">{post.clinic?.name || post.patient?.name}</h4>
                {post.badge && <Badge text={post.badge.text} color={post.badge.color} />}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-3 h-3" />
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

      {post.image && <img src={post.image} alt="Post content" className="w-full h-64 object-cover" />}

      {/* Post Actions */}
      <div className="p-6 pt-4 border-t border-gray-100">
        <TimelineActionsRow
          left={
            <>
              {isPatient ? (
                <>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-red-500">
                    <Heart className="w-5 h-5" />
                    <span>{post.engagement.likes}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.engagement.comments}</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Heart className="w-5 h-5" />
                    <span>{post.engagement.likes}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.engagement.comments}</span>
                  </div>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500">
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                </>
              )}
            </>
          }
          right={!isPatient && post.hasAppointmentButton ? (
            <TimelineButton className="w-full sm:w-auto">Book Appointment</TimelineButton>
          ) : null}
        />
      </div>
    </div>
  );
}
