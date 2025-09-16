import React, { useState } from 'react';
import { Image as ImageIcon, Folder } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PostCreateModal from './timeline/PostCreateModal';

export default function PostComposer() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const avatar = '/images/portrait-candid-male-doctor_720.jpg';
  const name = user?.name || 'Guest';

  function handlePost(newPost) {
    // TODO: integrate with timeline data store (same as TimelineShareBox)
    // eslint-disable-next-line no-console
    console.log('New post from PatientHome:', newPost);
  }

  return (
    <div className="bg-white rounded-xl p-4 border shadow-sm">
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
        {/* Top: Avatar + input-like button */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
            <img
              alt={name}
              className="w-full h-full object-cover object-center"
              src={avatar}
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-1 text-left p-3 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 hover:bg-gray-100"
          >
            Ask a doctor or share your experience...
          </button>
        </div>

        {/* Bottom: actions + post button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
          <div className="flex items-center space-x-6">
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600" type="button" onClick={() => setOpen(true)}>
              <ImageIcon className="w-5 h-5" aria-hidden="true" />
              <span>Image</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600" type="button" onClick={() => setOpen(true)}>
              <Folder className="w-5 h-5" aria-hidden="true" />
              <span>File</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto"
          >
            Post
          </button>
        </div>
        <PostCreateModal open={open} onClose={() => setOpen(false)} user={user} onPost={handlePost} />
      </div>
    </div>
  );
}
