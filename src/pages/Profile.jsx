import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileNav from '../components/profile/ProfileNav';
import ProfileAccountSection from '../components/profile/ProfileAccountSection';
import ProfileSecuritySection from '../components/profile/ProfileSecuritySection';
import ProfileNotificationsSection from '../components/profile/ProfileNotificationsSection';
import ProfileMedicalSection from '../components/profile/ProfileMedicalSection';
import { useProfileAccount } from '../hooks/profile/useProfileAccount';
import { useProfilePreferences } from '../hooks/profile/useProfilePreferences';
import { useProfileSecurity } from '../hooks/profile/useProfileSecurity';
import { useProfileMedical } from '../hooks/profile/useProfileMedical';

export default function Profile() {
  const { user } = useAuth();
  const [active, setActive] = useState('account');
  const [settingsTab, setSettingsTab] = useState('overview');

  const account = useProfileAccount();
  const prefs = useProfilePreferences();
  const security = useProfileSecurity(prefs.loadPrefs, prefs.savePrefs);
  const medical = useProfileMedical();

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">Please sign in.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600">Manage your account, security and preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-8">
          <ProfileNav active={active} setActive={setActive} role={user.role} />

          <section className="space-y-8">
            {active === 'account' && (
              <ProfileAccountSection
                user={account.user}
                name={account.name}
                avatar={account.avatar}
                avatarFileName={account.avatarFileName}
                fname={account.fname}
                lname={account.lname}
                phone={account.phone}
                phoneCc={account.phoneCc}
                specialty={account.specialty}
                profilePassword={account.profilePassword}
                countryName={account.countryName}
                phoneCcOpen={account.phoneCcOpen}
                phoneCcQuery={account.phoneCcQuery}
                fileInputRef={account.fileInputRef}
                phoneCcRef={account.phoneCcRef}
                phoneCodeOptions={account.phoneCodeOptions}
                resolvePhoneCcIso={account.resolvePhoneCcIso}
                setCountryName={account.setCountryName}
                setFname={account.setFname}
                setLname={account.setLname}
                setSpecialty={account.setSpecialty}
                setProfilePassword={account.setProfilePassword}
                handleDisplayNameChange={account.handleDisplayNameChange}
                handleAvatarFileChange={account.handleAvatarFileChange}
                handlePhoneChange={account.handlePhoneChange}
                handlePhoneCcToggle={account.handlePhoneCcToggle}
                handlePhoneCcSelect={account.handlePhoneCcSelect}
                handlePhoneCcQueryChange={account.handlePhoneCcQueryChange}
                onSubmit={account.saveAccount}
              />
            )}

            {active === 'security' && (
              <ProfileSecuritySection
                oldPwd={security.oldPwd}
                newPwd={security.newPwd}
                newPwd2={security.newPwd2}
                showOldPwd={security.showOldPwd}
                showNewPwd={security.showNewPwd}
                showNewPwd2={security.showNewPwd2}
                setOldPwd={security.setOldPwd}
                setNewPwd={security.setNewPwd}
                setNewPwd2={security.setNewPwd2}
                setShowOldPwd={security.setShowOldPwd}
                setShowNewPwd={security.setShowNewPwd}
                setShowNewPwd2={security.setShowNewPwd2}
                onSubmit={security.saveSecurity}
              />
            )}

            {active === 'notifications' && (
              <ProfileNotificationsSection />
            )}

            {active === 'settings' && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="p-3 pb-4 border-b border-gray-100">
                  <nav className="flex overflow-x-auto gap-1 scrollbar-hide">
                    {[
                      { id: 'overview', label: 'Overview' },
                      { id: 'services', label: 'Services' },
                      { id: 'reviews', label: 'Reviews' },
                      { id: 'gallery', label: 'Gallery' },
                      { id: 'before-after', label: 'Before & After' },
                      { id: 'publications', label: 'Publications' },
                      { id: 'location', label: 'Location' },
                    ].map((tab) => {
                      const activeTab = settingsTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSettingsTab(tab.id)}
                          className={`px-3 py-1 text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                            activeTab
                              ? 'text-[#1C6A83] border-[#1C6A83]'
                              : 'text-gray-700 border-transparent hover:text-[#1C6A83] hover:border-[#1C6A83]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Tab-specific content - doctor profile style edit layouts (UI only) */}
                <div className="p-5 space-y-6 text-sm">
                  {settingsTab === 'overview' && (
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-base font-semibold text-gray-900">About section</h2>
                          <p className="mt-1 text-xs text-gray-500">
                            Edit the paragraphs and highlights that appear in the "About" area of your public doctor profile.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Preview profile
                        </button>
                      </div>

                      {/* About paragraphs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">About paragraph 1</label>
                          <textarea
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                            placeholder="1998 yılında İstanbul Üniversitesi Tıp Fakültesi'nden mezun oldum ... (demo only)"
                          />
                          <p className="text-xs text-gray-500">This maps to the first about paragraph above your highlights.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">About paragraph 2</label>
                          <textarea
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                            placeholder="Hastalarıma en güncel tedavi yöntemlerini sunmak ... (demo only)"
                          />
                          <p className="text-xs text-gray-500">This maps to the second about paragraph right below the first one.</p>
                        </div>
                      </div>

                      {/* Highlight badges under about */}
                      <div className="space-y-3 border-t border-gray-100 pt-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Highlight badges</p>
                          <p className="text-xs text-gray-500">
                            These labels correspond to the four highlight cards (Board Certified, 15+ Years, Publications, Patient-Focused).
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Badge 1 label</label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                              placeholder="Board Certified"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Badge 2 label</label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                              placeholder="15+ Years"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Badge 3 label</label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                              placeholder="Publications"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Badge 4 label</label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                              placeholder="Patient-Focused"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Certificates note */}
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-600">
                        Certificates &amp; Licences section (images) is managed separately in the media/gallery area. This panel only controls
                        the text content shown above and the highlight labels.
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          className="px-4 py-1.5 rounded-lg bg-[#1C6A83] text-white text-xs font-medium hover:bg-[#155067] shadow-sm"
                        >
                          Save about section
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'services' && (
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-base font-semibold text-gray-900">Services layout</h2>
                          <p className="mt-1 text-xs text-gray-500">
                            Configure how your services, cards and pricing table appear on the Services tab.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Preview Services tab
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Default sort</label>
                          <select className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20">
                            <option>Most popular first</option>
                            <option>Price: low to high</option>
                            <option>Price: high to low</option>
                            <option>A–Z</option>
                          </select>
                          <p className="text-xs text-gray-500">Affects the order of service cards (demo only).</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Highlight badge text</label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                            placeholder="e.g. Most booked procedures"
                          />
                          <p className="text-xs text-gray-500">Shown above the top services grid.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Show price ranges</label>
                          <select className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20">
                            <option>Always</option>
                            <option>On card click only</option>
                            <option>Hide prices</option>
                          </select>
                          <p className="text-xs text-gray-500">Controls visibility of the pricing table under each service.</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          className="px-4 py-1.5 rounded-lg bg-[#1C6A83] text-white text-xs font-medium hover:bg-[#155067] shadow-sm"
                        >
                          Save services layout
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'reviews' && (
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-base font-semibold text-gray-900">Reviews section</h2>
                          <p className="mt-1 text-xs text-gray-500">
                            Choose how patient reviews and ratings are presented on your profile.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Preview Reviews tab
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Show reviews tab</p>
                            <p className="text-xs text-gray-500">Hide reviews while you build your profile.</p>
                          </div>
                          <button
                            type="button"
                            className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#1C6A83] transition-colors"
                          >
                            <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow translate-x-4" />
                          </button>
                        </div>

                        <div className="space-y-2 max-w-xs">
                          <label className="block text-sm font-medium text-gray-700">Minimum rating to highlight</label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                            placeholder="4.5"
                          />
                          <p className="text-xs text-gray-500">High-rated comments can be visually emphasised (demo only).</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          className="px-4 py-1.5 rounded-lg bg-[#1C6A83] text-white text-xs font-medium hover:bg-[#155067] shadow-sm"
                        >
                          Save review settings
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'gallery' && (
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-base font-semibold text-gray-900">Gallery settings</h2>
                          <p className="mt-1 text-xs text-gray-500">
                            Control how your photos appear in the gallery section of your doctor profile.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Preview gallery
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Maximum photos to show</label>
                          <input
                            type="number"
                            min="3"
                            max="30"
                            className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                            placeholder="12"
                          />
                          <p className="text-xs text-gray-500">Patients can still open the full gallery if there are more.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Layout</label>
                          <select className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20">
                            <option>Grid</option>
                            <option>Masonry</option>
                            <option>Carousel</option>
                          </select>
                          <p className="text-xs text-gray-500">Visual arrangement of photos on your profile.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Allow zoom on click</label>
                          <select className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20">
                            <option>Enabled</option>
                            <option>Disabled</option>
                          </select>
                          <p className="text-xs text-gray-500">Controls whether images open in a full-screen viewer.</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          className="px-4 py-1.5 rounded-lg bg-[#1C6A83] text-white text-xs font-medium hover:bg-[#155067] shadow-sm"
                        >
                          Save gallery settings
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'before-after' && (
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-base font-semibold text-gray-900">Before &amp; After section</h2>
                          <p className="mt-1 text-xs text-gray-500">
                            Configure how your before/after cases are highlighted on your profile.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Preview Before &amp; After
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Section title</label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                            placeholder="e.g. Before & After cases"
                          />
                          <p className="text-xs text-gray-500">Shown above the slider on your doctor profile.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Maximum cases to show</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                            placeholder="6"
                          />
                          <p className="text-xs text-gray-500">Extra cases will still be visible in the full gallery.</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Short description</label>
                        <textarea
                          rows={2}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                          placeholder="Explain what kind of procedures you showcase here. (demo only)"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          className="px-4 py-1.5 rounded-lg bg-[#1C6A83] text-white text-xs font-medium hover:bg-[#155067] shadow-sm"
                        >
                          Save Before &amp; After
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'publications' && (
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-base font-semibold text-gray-900">Publications section</h2>
                          <p className="mt-1 text-xs text-gray-500">
                            Add references to your scientific work that will be visible to patients.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Preview publications
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Highlighted publications (one per line)</label>
                          <textarea
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                            placeholder="e.g. 2023 - Journal of Cardiology - Title of the article"
                          />
                          <p className="text-xs text-gray-500">Static demo field – not yet connected to your public profile.</p>
                        </div>

                        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                          Tip: keep titles short and focus on publications that are relevant for patients rather than purely academic.
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          className="px-4 py-1.5 rounded-lg bg-[#1C6A83] text-white text-xs font-medium hover:bg-[#155067] shadow-sm"
                        >
                          Save publications
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'location' && (
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-base font-semibold text-gray-900">Location &amp; contact</h2>
                          <p className="mt-1 text-xs text-gray-500">
                            Match the address and contact details that appear on your public doctor profile.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Preview location
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Clinic name</label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                            placeholder="e.g. Anadolu Health Center"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">City</label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                            placeholder="e.g. Istanbul"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Full address</label>
                        <textarea
                          rows={2}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                          placeholder="Street, building, floor, postal code"
                        />
                        <p className="text-xs text-gray-500">Used on maps and in appointment confirmations (demo only).</p>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          className="px-4 py-1.5 rounded-lg bg-[#1C6A83] text-white text-xs font-medium hover:bg-[#155067] shadow-sm"
                        >
                          Save location
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {active === 'medical' && user?.role === 'patient' && (
              <ProfileMedicalSection
                medicalConditions={medical.medicalConditions}
                conditionInput={medical.conditionInput}
                showConditionSuggestions={medical.showConditionSuggestions}
                conditionInputRef={medical.conditionInputRef}
                filteredConditions={medical.filteredConditions}
                setConditionInput={medical.setConditionInput}
                setShowConditionSuggestions={medical.setShowConditionSuggestions}
                addCondition={medical.addCondition}
                removeCondition={medical.removeCondition}
                handleConditionKeyDown={medical.handleConditionKeyDown}
                clearAllConditions={medical.clearAllConditions}
                saveMedical={medical.saveMedical}
              />
            )}

            {/* Connections section removed */}
          </section>
        </div>
      </div>
    </div>
  );
}
