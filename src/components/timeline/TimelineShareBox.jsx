import React, { useState } from 'react';
import { Image, Folder } from 'lucide-react';
import TimelineActionsRow from './TimelineActionsRow';
import TimelineButton from './TimelineButton';
import { useAuth } from '../../context/AuthContext';
import PostCreateModal from './PostCreateModal';

export default function TimelineShareBox() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const avatar = '/images/portrait-candid-male-doctor_720.jpg';
  const name = user?.name || 'Guest';

  function handlePost(newPost) {
    // Post created via API in PostCreateModal — newPost contains the server response
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
          <img
            alt={name}
            src={avatar}
            className="w-full h-full object-cover object-center"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-1 text-left p-3 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 hover:bg-gray-100"
        >
         Make a Post...
        </button>
      </div>

      <TimelineActionsRow
        className="mt-4"
        left={
          <>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
              <Image className="w-5 h-5" />
              <span>Image</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
              <Folder className="w-5 h-5" />
              <span>File</span>
            </button>
          </>
        }
        right={<TimelineButton onClick={() => setOpen(true)} className="w-full sm:w-auto">Post</TimelineButton>}
      />

      <PostCreateModal open={open} onClose={() => setOpen(false)} user={user} onPost={handlePost} />
    </div>
  );
}
