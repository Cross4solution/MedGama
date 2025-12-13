import React from 'react';
import { Link } from 'react-router-dom';
import CountryCombobox from '../../components/forms/CountryCombobox';
import countriesEurope from '../../data/countriesEurope';
import { getFlagCode } from '../../utils/geo';

export default function ProfileAccountSection({
  user,
  name,
  avatar,
  avatarFileName,
  fname,
  lname,
  phone,
  phoneCc,
  specialty,
  profilePassword,
  countryName,
  phoneCcOpen,
  phoneCcQuery,
  fileInputRef,
  phoneCcRef,
  phoneCodeOptions,
  resolvePhoneCcIso,
  setCountryName,
  setFname,
  setLname,
  setSpecialty,
  setProfilePassword,
  handleDisplayNameChange,
  handleAvatarFileChange,
  handlePhoneChange,
  handlePhoneCcToggle,
  handlePhoneCcSelect,
  handlePhoneCcQueryChange,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          <img
            src={avatar || user.avatar || '/images/portrait-candid-male-doctor_720.jpg'}
            alt={user.name}
            className="w-16 h-16 rounded-full object-cover border"
          />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile photo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                handleAvatarFileChange(file);
              }}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 h-10 inline-flex items-center border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50"
              >
                Choose file
              </button>
              <span className="text-sm text-gray-600 truncate max-w-[240px]">{avatarFileName || 'No file selected'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Choose an image file to set your profile picture. (Stored locally for demo)</p>
          </div>
        </div>
      </div>

      {user?.role === 'doctor' && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Public doctor profile</p>
            <p className="text-xs text-gray-600 mt-0.5">
              View how your professional profile appears to patients on MedStream.
            </p>
          </div>
          <Link
            to="/doctor/doc-1"
            className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
          >
            View doctor profile
          </Link>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleDisplayNameChange(e.target.value)}
            maxLength={30}
            className="w-full border border-gray-300 rounded-lg px-3 text-sm h-10"
            placeholder="Your name"
          />
          <p className="mt-1 text-xs text-gray-500">{Math.max(0, 30 - (name?.length || 0))} characters left</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <CountryCombobox
            options={countriesEurope}
            value={countryName}
            onChange={setCountryName}
            placeholder="Select Country"
            triggerClassName="w-full border border-gray-300 rounded-lg px-3 text-sm bg-white h-10 flex items-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20 transition-shadow"
            getFlagUrl={(name) => {
              try {
                const code = getFlagCode(name);
                return code ? `https://flagcdn.com/24x18/${code}.png` : null;
              } catch {
                return null;
              }
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name (fname)</label>
          <input
            type="text"
            value={fname}
            onChange={(e) => setFname(e.target.value)}
            maxLength={255}
            className="w-full border border-gray-300 rounded-lg px-3 text-sm h-10"
            placeholder="First name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name (lname)</label>
          <input
            type="text"
            value={lname}
            onChange={(e) => setLname(e.target.value)}
            maxLength={255}
            className="w-full border border-gray-300 rounded-lg px-3 text-sm h-10"
            placeholder="Last name (optional)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Country Code (phone_cc)</label>
          <div className="relative" ref={phoneCcRef}>
            <button
              type="button"
              onClick={handlePhoneCcToggle}
              className="w-full border border-gray-300 rounded-lg pl-9 pr-8 text-sm h-10 bg-white flex items-center gap-2 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {resolvePhoneCcIso(phoneCc) && (
                <img
                  src={`https://flagcdn.com/24x18/${resolvePhoneCcIso(phoneCc)}.png`}
                  alt=""
                  width={18}
                  height={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 inline-block rounded-sm"
                />
              )}
              <span className="truncate">{phoneCc || 'Select code (e.g. +90)'}</span>
            </button>
            {phoneCcOpen && (
              <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto text-sm">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    value={phoneCcQuery}
                    onChange={(e) => handlePhoneCcQueryChange(e.target.value)}
                    placeholder="Search country or code"
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                  />
                </div>
                <ul>
                  {phoneCodeOptions
                    .filter((opt) => {
                      const q = phoneCcQuery.trim().toLowerCase();
                      if (!q) return true;
                      const n = (opt.name || '').toLowerCase();
                      return n.includes(q) || opt.code.includes(q);
                    })
                    .map((opt) => (
                      <li key={opt.code}>
                        <button
                          type="button"
                          className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left ${phoneCc === opt.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                          onClick={() => handlePhoneCcSelect(opt.code)}
                        >
                          {opt.iso && (
                            <img
                              src={`https://flagcdn.com/24x18/${opt.iso}.png`}
                              alt=""
                              width={18}
                              height={14}
                              className="inline-block rounded-sm"
                            />
                          )}
                          <span className="flex-1 truncate">{opt.name || 'Country'}</span>
                          <span className="text-gray-500">{opt.code}</span>
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">Format: +CountryCode, örnek: +90, +1</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            maxLength={20}
            className="w-full border border-gray-300 rounded-lg px-3 text-sm h-10"
            placeholder="Phone number (digits only)"
          />
          <p className="mt-1 text-xs text-gray-500">Sadece rakam, ülke kodu hariç, 7-15 hane arası önerilir.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password (required for update)</label>
          <input
            type="password"
            value={profilePassword}
            onChange={(e) => setProfilePassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 text-sm h-10"
            placeholder="Minimum 8 characters"
          />
        </div>
        {user?.role === 'doctor' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
            <input
              type="text"
              value={(user?.specialty || specialty) || ''}
              readOnly
              disabled
              maxLength={255}
              className="w-full border border-gray-300 rounded-lg px-3 text-sm h-10 bg-gray-50 text-gray-700 cursor-not-allowed"
              placeholder="e.g. Cardiology"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Save</button>
      </div>
    </form>
  );
}
