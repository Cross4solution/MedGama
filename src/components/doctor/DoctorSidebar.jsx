import React from 'react';
import { Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function DoctorSidebar() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  return (
    <div className="lg:w-80 space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-3">
        <button className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2">
          <Video className="w-5 h-5" />
          <span>Online Consultation</span>
        </button>
        <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
          <img
            src="/images/icon/calender-svgrepo-com.svg"
            alt="Calendar"
            className="w-5 h-5 brightness-0 invert"
          />
          <span>Book Appointment</span>
        </button>
        <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2">
          <img
            src="/images/icon/chat-round-line-svgrepo-com.svg"
            alt="Chat"
            className="w-5 h-5 brightness-0 invert"
          />
          <span>Send Message</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Consultation</span>
            <span className="font-medium text-gray-900">₺500 - ₺800</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Angiography</span>
            <span className="font-medium text-gray-900">₺8K - ₺15K</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Echocardiography</span>
            <span className="font-medium text-gray-900">₺1K - ₺2K</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-5 border border-emerald-100">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Tourism package</h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Promote your health tourism offer with a dedicated doctor package.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-purple-600 text-white text-xs font-medium shadow-sm hover:bg-purple-700 hover:shadow-md transition-colors"
        >
          Create tourism package
        </button>
      </div>

      {isDoctor && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">MedStream profile & URL</h3>
              <p className="text-xs text-gray-500 mt-0.5">Public professional profile link</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300"
              aria-label="Edit MedStream URL"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
            </button>
          </div>
          <div className="mt-2">
            <a
              href="https://medstream.com/dr-ayse-yilmaz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 break-all"
            >
              https://medstream.com/dr-ayse-yilmaz
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
