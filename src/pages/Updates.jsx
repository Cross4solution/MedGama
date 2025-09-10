import React, { useState } from 'react';
import { TimelineShareBox, TimelineFeed } from '../components/timeline';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/layout';

export default function Updates() {
  const { user } = useAuth();
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <div>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Page header action - left aligned New Post */}
      <div className="flex items-center mb-4">
        <button onClick={() => setComposerOpen(true)} className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700">
          New Post +
        </button>
      </div>

      {/* Modal Composer */}
      {composerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setComposerOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-gray-200">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="font-medium">Create Post</div>
                <button onClick={() => setComposerOpen(false)} className="text-gray-500 hover:text-gray-700 text-sm">Close</button>
              </div>
              <div className="p-4">
                <TimelineShareBox />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="mt-2">
        <TimelineFeed />
      </div>
      </div>
    </div>
  );
}
