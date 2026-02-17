import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Plus, Filter, Eye, Edit3, Trash2, X, User, Mail, Phone,
  MapPin, Calendar, ChevronLeft, ChevronRight, FileText, Activity,
  AlertCircle, Heart, MoreVertical, Download,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { clinicAPI } from '../../lib/api';

// ─── Mock Data ───────────────────────────────────────────────
const MOCK_PATIENTS = [
  { id: 1, name: 'Zeynep Kaya', email: 'zeynep@mail.com', phone: '+90 532 111 2233', age: 34, gender: 'F', dob: '1992-03-15', bloodType: 'A+', country: 'Turkey', city: 'Istanbul', status: 'active', lastVisit: '2026-02-16', totalVisits: 12, conditions: ['Asthma'], allergies: ['Penicillin'], insurance: 'Axa Sigorta', registeredAt: '2024-06-10' },
  { id: 2, name: 'Ali Yilmaz', email: 'ali@mail.com', phone: '+90 533 222 3344', age: 45, gender: 'M', dob: '1981-07-22', bloodType: 'O+', country: 'Turkey', city: 'Ankara', status: 'active', lastVisit: '2026-02-16', totalVisits: 8, conditions: ['Hypertension', 'Post-Op'], allergies: [], insurance: 'SGK', registeredAt: '2024-09-01' },
  { id: 3, name: 'Selin Acar', email: 'selin@mail.com', phone: '+90 534 333 4455', age: 28, gender: 'F', dob: '1998-01-10', bloodType: 'B+', country: 'Turkey', city: 'Izmir', status: 'active', lastVisit: '2026-02-16', totalVisits: 3, conditions: [], allergies: ['Latex'], insurance: 'Allianz', registeredAt: '2025-11-20' },
  { id: 4, name: 'Mehmet Ozkan', email: 'mehmet@mail.com', phone: '+90 535 444 5566', age: 52, gender: 'M', dob: '1974-11-05', bloodType: 'AB-', country: 'Turkey', city: 'Istanbul', status: 'critical', lastVisit: '2026-02-13', totalVisits: 22, conditions: ['Diabetes Type 2', 'Cholesterol'], allergies: ['Sulfa'], insurance: 'SGK', registeredAt: '2023-02-14' },
  { id: 5, name: 'Ayse Demir', email: 'ayse@mail.com', phone: '+90 536 555 6677', age: 38, gender: 'F', dob: '1988-05-30', bloodType: 'A-', country: 'Turkey', city: 'Bursa', status: 'active', lastVisit: '2026-02-10', totalVisits: 6, conditions: ['Migraine'], allergies: [], insurance: 'Mapfre', registeredAt: '2025-01-15' },
  { id: 6, name: 'Fatma Koc', email: 'fatma@mail.com', phone: '+90 543 444 5566', age: 61, gender: 'F', dob: '1965-09-18', bloodType: 'O-', country: 'Turkey', city: 'Istanbul', status: 'active', lastVisit: '2026-02-09', totalVisits: 18, conditions: ['Diabetes Type 2', 'Hypertension'], allergies: ['Aspirin'], insurance: 'SGK', registeredAt: '2023-08-22' },
  { id: 7, name: 'Burak Sahin', email: 'burak@mail.com', phone: '+90 537 666 7788', age: 29, gender: 'M', dob: '1997-04-12', bloodType: 'B-', country: 'Turkey', city: 'Antalya', status: 'new', lastVisit: 'N/A', totalVisits: 0, conditions: [], allergies: [], insurance: 'None', registeredAt: '2026-02-15' },
  { id: 8, name: 'Elif Arslan', email: 'elif@mail.com', phone: '+90 538 777 8899', age: 42, gender: 'F', dob: '1984-12-01', bloodType: 'A+', country: 'Turkey', city: 'Istanbul', status: 'active', lastVisit: '2026-02-05', totalVisits: 15, conditions: ['Thyroid'], allergies: ['Iodine'], insurance: 'Axa Sigorta', registeredAt: '2024-01-10' },
  { id: 9, name: 'Can Yildiz', email: 'can@mail.com', phone: '+90 539 888 9900', age: 55, gender: 'M', dob: '1971-08-25', bloodType: 'O+', country: 'Germany', city: 'Berlin', status: 'inactive', lastVisit: '2025-12-20', totalVisits: 4, conditions: ['COPD'], allergies: [], insurance: 'TK (Germany)', registeredAt: '2025-06-01' },
  { id: 10, name: 'Deniz Korkmaz', email: 'deniz@mail.com', phone: '+90 540 111 2233', age: 33, gender: 'F', dob: '1993-06-14', bloodType: 'AB+', country: 'Turkey', city: 'Istanbul', status: 'active', lastVisit: '2026-02-01', totalVisits: 7, conditions: ['Anxiety'], allergies: [], insurance: 'Allianz', registeredAt: '2025-03-10' },
  { id: 11, name: 'Pinar Dogan', email: 'pinar@mail.com', phone: '+90 541 222 3344', age: 47, gender: 'F', dob: '1979-02-28', bloodType: 'A+', country: 'Turkey', city: 'Eskisehir', status: 'active', lastVisit: '2026-01-28', totalVisits: 9, conditions: ['Cardiac Arrhythmia'], allergies: ['Codeine'], insurance: 'SGK', registeredAt: '2024-04-18' },
  { id: 12, name: 'Serkan Aydin', email: 'serkan@mail.com', phone: '+90 542 333 4455', age: 39, gender: 'M', dob: '1987-10-09', bloodType: 'B+', country: 'Turkey', city: 'Istanbul', status: 'active', lastVisit: '2026-01-20', totalVisits: 5, conditions: ['Hypothyroidism'], allergies: [], insurance: 'Mapfre', registeredAt: '2025-05-22' },
];

const PatientStatusBadge = ({ status }) => {
  const c = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    critical: 'bg-red-50 text-red-700 border-red-200',
    inactive: 'bg-gray-100 text-gray-500 border-gray-200',
    new: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${c[status] || c.active}`}>{status}</span>;
};

const CRMPatients = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;
  const [apiPatients, setApiPatients] = useState(null);

  useEffect(() => {
    if (!user?.clinic_id) return;
    clinicAPI.staff(user.clinic_id, { per_page: 100 }).then(res => {
      const list = res?.data || [];
      const patients = list.filter(u => u.role_id === 'patient');
      if (patients.length > 0) {
        setApiPatients(patients.map(p => ({
          id: p.id,
          name: p.fullname || 'Patient',
          email: p.email || '',
          phone: '',
          age: '',
          gender: '',
          dob: '',
          bloodType: '',
          country: '',
          city: '',
          status: p.is_verified ? 'active' : 'new',
          lastVisit: '',
          totalVisits: 0,
          conditions: [],
          allergies: [],
          insurance: '',
          registeredAt: '',
        })));
      }
    }).catch(() => {});
  }, [user?.clinic_id]);

  const allPatients = apiPatients || MOCK_PATIENTS;

  const [newPatient, setNewPatient] = useState({
    name: '', email: '', phone: '', dob: '', gender: 'M', bloodType: '', country: '', city: '', insurance: '', conditions: '', allergies: '',
  });

  const filtered = useMemo(() => {
    return allPatients.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q) || (p.phone || '').includes(q);
      }
      return true;
    });
  }, [searchQuery, statusFilter, allPatients]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const stats = useMemo(() => ({
    total: allPatients.length,
    active: allPatients.filter(p => p.status === 'active').length,
    critical: allPatients.filter(p => p.status === 'critical').length,
    newPatients: allPatients.filter(p => p.status === 'new').length,
  }), [allPatients]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.patients.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.patients.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md">
            <Plus className="w-4 h-4" />
            {t('crm.patients.addPatient')}
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.export')}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('crm.patients.totalPatients'), value: stats.total, bg: 'bg-violet-50 border-violet-200', color: 'text-violet-700' },
          { label: t('crm.patients.active'), value: stats.active, bg: 'bg-emerald-50 border-emerald-200', color: 'text-emerald-700' },
          { label: t('crm.patients.critical'), value: stats.critical, bg: 'bg-red-50 border-red-200', color: 'text-red-700' },
          { label: t('crm.patients.newThisMonth'), value: stats.newPatients, bg: 'bg-blue-50 border-blue-200', color: 'text-blue-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
            <p className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-gray-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder={t('crm.patients.searchPlaceholder')} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full" />
          </div>
          <div className="flex items-center gap-2">
            {['all', 'active', 'critical', 'new', 'inactive'].map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === s ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                {s === 'all' ? t('common.all') : s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('common.patient')}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('crm.patients.contact')}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('crm.patients.bloodType')}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('crm.patients.conditions')}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('crm.patients.lastVisit')}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('common.status')}</th>
                <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">{t('common.noResults')}</td></tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          p.status === 'critical' ? 'bg-gradient-to-br from-red-400 to-red-500 text-white' : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600'
                        }`}>
                          {p.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                          <p className="text-[11px] text-gray-400">{p.gender === 'F' ? 'Female' : 'Male'}, {p.age}y · {p.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-xs text-gray-700">{p.email}</p>
                      <p className="text-[11px] text-gray-400">{p.phone}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">{p.bloodType}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {p.conditions.length === 0 ? <span className="text-[11px] text-gray-400">—</span> :
                          p.conditions.slice(0, 2).map((c) => (
                            <span key={c} className="text-[10px] font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">{c}</span>
                          ))
                        }
                        {p.conditions.length > 2 && <span className="text-[10px] text-gray-400">+{p.conditions.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-xs text-gray-700">{p.lastVisit}</p>
                      <p className="text-[10px] text-gray-400">{p.totalVisits} {t('crm.patients.visits')}</p>
                    </td>
                    <td className="px-3 py-3.5"><PatientStatusBadge status={p.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/crm/patient-360?id=P${String(p.id).padStart(3,'0')}`)} className="w-7 h-7 rounded-lg hover:bg-teal-50 flex items-center justify-center text-gray-400 hover:text-teal-600" title="Patient 360"><Eye className="w-3.5 h-3.5" /></button>
                        <button className="w-7 h-7 rounded-lg hover:bg-amber-50 flex items-center justify-center text-gray-400 hover:text-amber-600" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-500">Showing {(currentPage-1)*perPage+1}–{Math.min(currentPage*perPage, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-medium ${page === currentPage ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{page}</button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Patient Detail Modal ─── */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{t('crm.patients.patientProfile')}</h2>
              <button onClick={() => setSelectedPatient(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold ${
                  selectedPatient.status === 'critical' ? 'bg-gradient-to-br from-red-400 to-red-500 text-white' : 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white'
                }`}>
                  {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{selectedPatient.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <PatientStatusBadge status={selectedPatient.status} />
                    <span className="text-xs text-gray-400">ID: #{String(selectedPatient.id).padStart(5, '0')}</span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { label: t('crm.patients.dateOfBirth'), value: selectedPatient.dob },
                  { label: t('crm.patients.ageGender'), value: `${selectedPatient.age}y / ${selectedPatient.gender === 'F' ? t('crm.patients.female') : t('crm.patients.male')}` },
                  { label: t('crm.patients.bloodType'), value: selectedPatient.bloodType },
                  { label: t('crm.patients.insurance'), value: selectedPatient.insurance || 'None' },
                  { label: t('common.email'), value: selectedPatient.email },
                  { label: t('common.phone'), value: selectedPatient.phone },
                  { label: t('crm.patients.location'), value: `${selectedPatient.city}, ${selectedPatient.country}` },
                  { label: t('crm.patients.registered'), value: selectedPatient.registeredAt },
                  { label: t('crm.patients.totalVisits'), value: selectedPatient.totalVisits },
                  { label: t('crm.patients.lastVisit'), value: selectedPatient.lastVisit },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm text-gray-800 font-medium mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Conditions */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('crm.patients.medicalConditions')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPatient.conditions.length === 0 ? <span className="text-xs text-gray-400">{t('crm.patients.noKnownConditions')}</span> :
                    selectedPatient.conditions.map((c) => (
                      <span key={c} className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-1 rounded-lg border border-amber-200">{c}</span>
                    ))
                  }
                </div>
              </div>

              {/* Allergies */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('crm.patients.allergies')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPatient.allergies.length === 0 ? <span className="text-xs text-gray-400">{t('crm.patients.noKnownAllergies')}</span> :
                    selectedPatient.allergies.map((a) => (
                      <span key={a} className="text-xs font-medium bg-red-50 text-red-700 px-2 py-1 rounded-lg border border-red-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{a}
                      </span>
                    ))
                  }
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">{t('crm.patients.medicalHistory')}</button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">{t('crm.sidebar.prescriptions')}</button>
              <button className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm">{t('crm.patients.bookAppointment')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Patient Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center"><Plus className="w-4.5 h-4.5 text-teal-600" /></div>
                <h2 className="text-base font-bold text-gray-900">{t('crm.patients.addNewPatient')}</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.patients.fullName')} *</label>
                <input type="text" value={newPatient.name} onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                  className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder={t('crm.patients.fullName')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('common.email')}</label>
                  <input type="email" value={newPatient.email} onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('common.phone')} *</label>
                  <input type="tel" value={newPatient.phone} onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="+90 5XX XXX XXXX" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.patients.dateOfBirth')}</label>
                  <input type="date" value={newPatient.dob} onChange={(e) => setNewPatient({...newPatient, dob: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.patients.gender')}</label>
                  <select value={newPatient.gender} onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                    <option value="M">{t('crm.patients.male')}</option>
                    <option value="F">{t('crm.patients.female')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.patients.bloodType')}</label>
                  <select value={newPatient.bloodType} onChange={(e) => setNewPatient({...newPatient, bloodType: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                    <option value="">Select</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.patients.country')}</label>
                  <input type="text" value={newPatient.country} onChange={(e) => setNewPatient({...newPatient, country: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Turkey" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.patients.city')}</label>
                  <input type="text" value={newPatient.city} onChange={(e) => setNewPatient({...newPatient, city: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Istanbul" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.patients.insurance')}</label>
                <input type="text" value={newPatient.insurance} onChange={(e) => setNewPatient({...newPatient, insurance: e.target.value})}
                  className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Insurance provider" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.patients.knownConditions')}</label>
                <input type="text" value={newPatient.conditions} onChange={(e) => setNewPatient({...newPatient, conditions: e.target.value})}
                  className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="e.g. Diabetes, Hypertension (comma-separated)" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.patients.allergies')}</label>
                <input type="text" value={newPatient.allergies} onChange={(e) => setNewPatient({...newPatient, allergies: e.target.value})}
                  className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="e.g. Penicillin, Latex (comma-separated)" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors">{t('common.cancel')}</button>
              <button className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm">{t('crm.patients.addPatient')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMPatients;
