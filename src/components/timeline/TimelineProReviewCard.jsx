import React from 'react';
import { Heart, MessageCircle, Share2, User } from 'lucide-react';
import ShareMenu from '../ShareMenu';
import TimelineButton from './TimelineButton';
import TimelineActionsRow from './TimelineActionsRow';

export default function TimelineProReviewCard({ professionalReview }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-800">{professionalReview.title}</h4>
                <span className="inline-flex items-center gap-1 border font-medium rounded-full text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 ">
                  <span>PRO Review</span>
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{professionalReview.author}</span>
                <span>•</span>
                <span>{professionalReview.timestamp}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 pt-4">
        <h3 className="font-semibold text-gray-800 mb-3">{professionalReview.subtitle}</h3>
        <p className="text-gray-700 mb-4">{professionalReview.description}</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {professionalReview.images?.map((src, idx) => (
            <img key={idx} src={src} alt={`Review ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {professionalReview.metrics?.map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-sm text-gray-600">{m.label}</p>
              <p className="text-lg font-semibold text-purple-600">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 pt-0 border-t border-gray-100">
        <TimelineActionsRow
          left={
            <>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-red-500">
                <Heart className="w-5 h-5" />
                <span>{professionalReview.engagement?.likes ?? 156}</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500">
                <MessageCircle className="w-5 h-5" />
                <span>{professionalReview.engagement?.comments ?? 24}</span>
              </button>
              <ShareMenu title="Share" showNative={false} />
            </>
          }
          right={<TimelineButton className="w-full sm:w-auto">View Details</TimelineButton>}
        />
      </div>
    </div>
  );
}
