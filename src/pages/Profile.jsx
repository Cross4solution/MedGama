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
