import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { appointmentAPI, clinicAPI, clinicManagerAPI } from '../lib/api';
import resolveStorageUrl from '../utils/resolveStorageUrl';
import {
  Building2, Users, Calendar, TrendingUp, Clock, CheckCircle2,
  Stethoscope, ChevronRight, Loader2, Plus, Shield,
  UserPlus, ClipboardList, Star, Activity
} from 'lucide-react';

export default function ClinicDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [onbRes, apptRes] = await Promise.all([
          clinicAPI.onboardingProfile().catch(() => null),
          appointmentAPI.list({ per_page: 200 }).catch(() => ({ data: [] })),
        ]);
        if (onbRes?.clinic) setClinic(onbRes.clinic);
        if (onbRes?.doctors) setDoctors(onbRes.doctors);
        setAppointments(apptRes?.data || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const pending = useMemo(() => appointments.filter(a => a.status === 'pending'), [appointments]);
  const confirmed = useMemo(() => appointments.filter(a => a.status === 'confirmed'), [appointments]);
  const completed = useMemo(() => appointments.filter(a => a.status === 'completed'), [appointments]);
  const activeDoctors = useMemo(() => doctors.filter(d => d.is_active !== false), [doctors]);

  const metrics = [
    { label: t('clinicDashboard.totalAppointments', 'Total Appointments'), value: appointments.length, icon: ClipboardList, bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: t('clinicDashboard.pendingRequests', 'Pending Requests'), value: pending.length, icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: t('clinicDashboard.confirmed', 'Confirmed'), value: confirmed.length, icon: CheckCircle2, bg: 'bg-teal-50', text: 'text-teal-600' },
    { label: t('clinicDashboard.activeDoctors', 'Active Doctors'), value: activeDoctors.length, icon: Users, bg: 'bg-violet-50', text: 'text-violet-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {clinic?.avatar ? (
              <img src={resolveStorageUrl(clinic.avatar)} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                onError={e => { e.currentTarget.src = '/images/default/default-avatar.svg'; }} />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-teal-600" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{clinic?.name || clinic?.fullname || t('clinicDashboard.title', 'Clinic Dashboard')}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <Shield className="w-3 h-3" /> {t('common.verified', 'Verified')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/clinic/team"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors">
              <Users className="w-4 h-4" />
              {t('clinicDashboard.myTeam', 'My Team')}
            </Link>
            <button
              onClick={() => navigate('/telehealth-appointment?create=1')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-sm font-bold hover:from-teal-700 hover:to-emerald-700 transition-all shadow-md shadow-teal-200/50">
              <Plus className="w-4 h-4" />
              {t('clinicDashboard.newAppointment', 'New Appointment')}
            </button>
          </div>
        </div>



        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metrics.map(m => (
            <div key={m.label} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center`}>
                  <m.icon className={`w-5 h-5 ${m.text}`} />
                </div>
                {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-300" />}
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : m.value}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Link to="/clinic/team" className="group bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 hover:shadow-md hover:border-teal-300 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">{t('clinicDashboard.teamManagement', 'Team Management')}</h3>
                <p className="text-[11px] text-gray-500">{t('clinicDashboard.teamDesc', 'Add, edit, or deactivate doctors')}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
            </div>
          </Link>

          <Link to="/telehealth-appointment" className="group bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 hover:shadow-md hover:border-teal-300 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">{t('clinicDashboard.appointments', 'Appointments')}</h3>
                <p className="text-[11px] text-gray-500">{t('clinicDashboard.appointmentsDesc', 'View and manage all appointments')}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
            </div>
          </Link>

          <Link to="/clinic-edit" className="group bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 hover:shadow-md hover:border-teal-300 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                <Building2 className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">{t('clinicDashboard.clinicProfile', 'Clinic Profile')}</h3>
                <p className="text-[11px] text-gray-500">{t('clinicDashboard.clinicProfileDesc', 'Edit your public profile')}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
            </div>
          </Link>
        </div>

        {/* Recent Activity - Doctors overview */}
        {doctors.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-gray-900">{t('clinicDashboard.teamOverview', 'Team Overview')}</h3>
              </div>
              <Link to="/clinic/team" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
                {t('common.viewAll', 'View All')} →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {doctors.slice(0, 5).map(doc => (
                <div key={doc.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{doc.fullname}</p>
                    <p className="text-[11px] text-gray-400 truncate">{doc.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    doc.is_active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {doc.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
