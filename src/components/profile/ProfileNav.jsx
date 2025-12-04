import React from 'react';
import { ChevronRight, User, Shield, Bell, HeartPulse, Settings } from 'lucide-react';

function NavItem({ id, icon: Icon, title, desc, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`w-full text-left p-3 rounded-lg border transition-colors flex items-start gap-3 ${active === id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
      aria-current={active === id}
    >
      <Icon className={`w-5 h-5 ${active === id ? 'text-blue-600' : 'text-gray-500'}`} />
      <span>
        <span className="block text-sm font-medium text-gray-900">{title}</span>
        <span className="block text-xs text-gray-500">{desc}</span>
      </span>
      <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
    </button>
  );
}

export default function ProfileNav({ active, setActive, role }) {
  return (
    <aside className="space-y-2">
      <NavItem
        id="account"
        icon={User}
        title="Account"
        desc="Profile, country and appearance"
        active={active}
        onClick={setActive}
      />
      <NavItem
        id="security"
        icon={Shield}
        title="Security"
        desc="Password"
        active={active}
        onClick={setActive}
      />
      <NavItem
        id="notifications"
        icon={Bell}
        title="Notifications"
        desc="Patient notifications"
        active={active}
        onClick={setActive}
      />
      {role === 'patient' && (
        <NavItem
          id="medical"
          icon={HeartPulse}
          title="Medical History"
          desc="Diseases & meds"
          active={active}
          onClick={setActive}
        />
      )}
    </aside>
  );
}
