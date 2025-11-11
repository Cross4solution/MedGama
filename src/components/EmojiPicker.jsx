import React from 'react';

/**
 * Reusable Emoji Picker with category tabs
 * @param {{ onSelect: (emoji:string)=>void, className?: string }} props
 */
export default function EmojiPicker({ onSelect, className = '' }) {
  const categories = React.useMemo(() => ({
    'Faces': [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','🥰','😍','🤩','😘','😗','😚','😙',
      '😋','😛','😜','🤪','😝','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥',
      '😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐',
      '😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞'
    ],
    'Hands': [
      '👍','👎','👏','🙌','🙏','🤝','🤌','👌','✌️','🤞','🤟','🤘','👉','👈','👆','👇','☝️','👊','✊'
    ],
    'Hearts & Effects': [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💯','✅','⭐','✨','🔥','🎉','💥','💫','💤'
    ]
  }), []);

  const [tab, setTab] = React.useState('Faces');

  return (
    <div className={`bg-white border rounded-lg shadow-lg w-56 sm:w-64 overflow-hidden ${className}`.trim()}>
      <div className="flex border-b">
        {Object.keys(categories).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 px-2 py-2 text-center text-sm ${tab===t ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            title={t}
          >
            {t === 'Faces' ? '😀' : t === 'Hands' ? '👍' : '❤️'}
          </button>
        ))}
      </div>
      <div className="p-2 max-h-56 overflow-y-auto">
        <div className="grid grid-cols-6 gap-1 text-xl select-none">
          {(categories[tab] || []).map((e, i) => (
            <button
              key={`${tab}-${i}`}
              type="button"
              className="hover:bg-gray-100 rounded p-0.5"
              onClick={() => onSelect?.(e)}
              title={e}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="px-2 py-1 border-t text-xs text-gray-500 text-center">
        {(categories[tab] || []).length} emoji
      </div>
    </div>
  );
}
