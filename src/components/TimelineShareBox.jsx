import React from 'react';
import { Image, Folder } from 'lucide-react';
import TimelineActionsRow from './TimelineActionsRow';
import TimelineButton from './TimelineButton';

export default function TimelineShareBox() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
          <img
            alt="User"
            src="/images/stylish-good-looking-ambitious-smiling-brunette-woman-with-curly-hairstyle-cross-hands-chest-confident-professional-pose-smiling-standing-casually-summer-outfit-talking-friend-white-wall_720.jpg"
            className="w-full h-full object-cover object-center scale-110"
            style={{ objectPosition: '25% 50%' }}
          />
        </div>
        <input
          placeholder="Ask a doctor or share your experience..."
          className="flex-1 p-3 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
        />
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
        right={<TimelineButton className="w-full sm:w-auto">Share</TimelineButton>}
      />
    </div>
  );
}
