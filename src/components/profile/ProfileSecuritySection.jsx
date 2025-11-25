import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function ProfileSecuritySection({
  oldPwd,
  newPwd,
  newPwd2,
  showOldPwd,
  showNewPwd,
  showNewPwd2,
  setOldPwd,
  setNewPwd,
  setNewPwd2,
  setShowOldPwd,
  setShowNewPwd,
  setShowNewPwd2,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Password</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showOldPwd ? 'text' : 'password'}
                value={oldPwd}
                onChange={(e)=>setOldPwd(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={()=>setShowOldPwd(s=>!s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showOldPwd ? 'Hide password' : 'Show password'}
              >
                {showOldPwd ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPwd ? 'text' : 'password'}
                value={newPwd}
                onChange={(e)=>setNewPwd(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={()=>setShowNewPwd(s=>!s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showNewPwd ? 'Hide password' : 'Show password'}
              >
                {showNewPwd ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repeat New</label>
            <div className="relative">
              <input
                type={showNewPwd2 ? 'text' : 'password'}
                value={newPwd2}
                onChange={(e)=>setNewPwd2(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={()=>setShowNewPwd2(s=>!s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showNewPwd2 ? 'Hide password' : 'Show password'}
              >
                {showNewPwd2 ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Save</button>
      </div>
    </form>
  );
}
