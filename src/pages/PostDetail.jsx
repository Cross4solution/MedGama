import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout';
import { MapPin } from 'lucide-react';

export default function PostDetail() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  // Öncelik: ExploreTimeline'dan gelen state
  const item = state?.item;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="mb-4 text-sm text-gray-600 hover:text-gray-900">← Back</button>
        {!item ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-gray-600">
            <p>Post not found. Please open a card from Explore Timeline.</p>
          </div>
        ) : (
          <article className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b flex items-center gap-3">
              <img src={item.avatar || '/images/portrait-candid-male-doctor_720.jpg'} alt={item.title} className="w-10 h-10 rounded-full object-cover border" />
              <div className="min-w-0">
                <h1 className="font-semibold text-gray-900 truncate" title={item.title}>{item.title}</h1>
                <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.city}</p>
              </div>
              {item.specialty && (
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">{item.specialty}</span>
              )}
            </div>
            {/* Body */}
            {item.img && (
              <div className="h-64 bg-gray-50 overflow-hidden">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5">
              <p className="text-base leading-7 text-gray-800 whitespace-pre-wrap">{item.text}</p>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
