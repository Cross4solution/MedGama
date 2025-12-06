import React from 'react';

export default function PublicationsTab({ publications = [] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Publications</h3>
      {publications.length === 0 ? (
        <p className="text-gray-500 text-sm">No publications have been added yet.</p>
      ) : (
        <ul className="space-y-3">
          {publications.map((pub) => (
            <li
              key={pub.id}
              className="p-4 bg-gray-50 rounded-xl border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div>
                <p className="font-medium text-gray-900">{pub.title}</p>
                {pub.journal && (
                  <p className="text-xs text-gray-500 mt-0.5">{pub.journal}</p>
                )}
              </div>
              {pub.url && (
                <a
                  href={pub.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-teal-700 hover:text-teal-800 hover:underline whitespace-nowrap"
                >
                  {pub.id !== 'pub-1' && (
                    <img
                      src="/images/icon/pdf.svg"
                      alt="PDF icon"
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      aria-hidden="true"
                    />
                  )}
                  <span>View publication</span>
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
