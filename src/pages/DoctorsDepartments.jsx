import React, { useState } from 'react';
import { Plus, Star, MessageSquare, MapPin, BadgeDollarSign, User, Building2, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';

// Mock data (can be replaced with API)
const INITIAL_DEPARTMENTS = [
  {
    id: 'd1',
    name: 'ENT',
    info: 'Ear, Nose and Throat',
    doctors: [
      { id: 'u1', name: 'Dr. Ahmet Yılmaz', specialty: 'ENT Specialist', rating: 4.8, reviewCount: 132, price: 800, distanceKm: 3.4, available: 'Today 15:00' },
      { id: 'u2', name: 'Dr. Mehmet Çalmaz', specialty: 'ENT Specialist', rating: 4.6, reviewCount: 88, price: 700, distanceKm: 5.1, available: 'Tomorrow 11:30' },
    ],
  },
  {
    id: 'd2',
    name: 'Neurology',
    info: 'Brain and Nervous System',
    doctors: [
      { id: 'u3', name: 'Dr. Ece Demir', specialty: 'Neurologist', rating: 4.9, reviewCount: 210, price: 1200, distanceKm: 2.1, available: 'Today 16:30' },
    ],
  },
  {
    id: 'd3',
    name: 'Orthopedics',
    info: 'Musculoskeletal System',
    doctors: [
      { id: 'u4', name: 'Dr. Can Kaya', specialty: 'Orthopedist', rating: 4.5, reviewCount: 64, price: 900, distanceKm: 7.8, available: 'Friday 10:00' },
    ],
  },
];

export default function DoctorsDepartments() {
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);

  // Modals state
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptEditing, setDeptEditing] = useState(null); // {id?, name, info}
  const [deptMode, setDeptMode] = useState('create');
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [doctorEditing, setDoctorEditing] = useState(null); // {id?, name, specialty, price, available}
  const [doctorDeptId, setDoctorDeptId] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, onYes: null, title: '', desc: '' });


  const openCreateDept = () => { setDeptMode('create'); setDeptEditing({ name: '', info: '' }); setDeptModalOpen(true); };
  const openEditDept = (d) => { setDeptMode('edit'); setDeptEditing({ id: d.id, name: d.name, info: d.info||'' }); setDeptModalOpen(true); };
  const saveDept = () => {
    if (!deptEditing?.name?.trim()) return;
    if (deptMode === 'create') {
      setDepartments((prev) => ([...prev, { id: `d${Date.now()}`, name: deptEditing.name.trim(), info: deptEditing.info?.trim() || '', doctors: [] }]));
    } else {
      setDepartments((prev) => prev.map((d) => d.id === deptEditing.id ? { ...d, name: deptEditing.name.trim(), info: deptEditing.info?.trim()||'' } : d));
    }
    setDeptModalOpen(false);
  };
  const deleteDept = (id) => {
    setConfirm({
      open: true,
      title: 'Delete Department',
      desc: 'This will remove the department and all its doctors. Are you sure?',
      onYes: () => setDepartments((prev) => prev.filter((d) => d.id !== id))
    });
  };

  const openCreateDoctor = (depId) => { setDoctorDeptId(depId); setDoctorEditing({ name: '', specialty: '', rating: 4.5, reviewCount: 0, price: 800, distanceKm: 0, available: '' }); setDoctorModalOpen(true); };
  const openEditDoctor = (depId, doc) => { setDoctorDeptId(depId); setDoctorEditing({ ...doc }); setDoctorModalOpen(true); };
  const saveDoctor = () => {
    if (!doctorEditing?.name?.trim()) return;
    setDepartments((prev) => prev.map((d) => {
      if (d.id !== doctorDeptId) return d;
      const docs = [...d.doctors];
      const idx = docs.findIndex(x => x.id === doctorEditing.id);
      if (idx >= 0) {
        docs[idx] = { ...docs[idx], ...doctorEditing, name: doctorEditing.name.trim(), specialty: doctorEditing.specialty?.trim()||'' };
      } else {
        docs.push({ id: `u${Date.now()}`, ...doctorEditing, name: doctorEditing.name.trim(), specialty: doctorEditing.specialty?.trim()||'' });
      }
      return { ...d, doctors: docs };
    }));
    setDoctorModalOpen(false);
  };
  const deleteDoctor = (depId, docId) => {
    setConfirm({
      open: true,
      title: 'Delete Doctor',
      desc: 'This will remove the doctor from the department. Are you sure?',
      onYes: () => setDepartments((prev) => prev.map((d) => d.id === depId ? { ...d, doctors: d.doctors.filter((u)=>u.id!==docId) } : d))
    });
  };

  const closeConfirm = (yes) => {
    if (yes && typeof confirm.onYes === 'function') confirm.onYes();
    setConfirm({ open: false, onYes: null, title: '', desc: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/60 to-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-200/50">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Doctors & Departments</h1>
              <p className="text-[11px] text-gray-400 font-medium">Manage your clinic departments and doctors</p>
            </div>
          </div>
          <button onClick={openCreateDept} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-200/50 hover:shadow-lg transition-all duration-200">
            <Plus className="w-4 h-4" /> New Department
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {departments.map((dep, depIdx) => {
            const depColors = [
              { bar: 'from-teal-500 to-emerald-500', avatar: 'from-teal-500 to-emerald-600' },
              { bar: 'from-blue-500 to-indigo-500', avatar: 'from-blue-500 to-indigo-600' },
              { bar: 'from-purple-500 to-violet-500', avatar: 'from-purple-500 to-violet-600' },
              { bar: 'from-amber-500 to-orange-500', avatar: 'from-amber-500 to-orange-600' },
            ];
            const dc = depColors[depIdx % depColors.length];
            return (
              <div key={dep.id} className="rounded-2xl border border-gray-200/60 bg-white shadow-lg shadow-gray-200/30 overflow-hidden">
                {/* Department header */}
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-1.5 h-8 rounded-full bg-gradient-to-b ${dc.bar}`} />
                      <div>
                        <div className="text-sm font-bold text-gray-900">{dep.name}</div>
                        <div className="text-[11px] text-gray-400 font-medium">{dep.info || '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                      <button onClick={()=>openEditDept(dep)} className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium border border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"><Pencil className="w-3 h-3" /> <span className="hidden sm:inline">Edit</span></button>
                      <button onClick={()=>deleteDept(dep.id)} className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="w-3 h-3" /> <span className="hidden sm:inline">Delete</span></button>
                      <button onClick={()=>openCreateDoctor(dep.id)} className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/60 transition-colors"><Plus className="w-3 h-3" /> <span className="hidden sm:inline">Doctor</span></button>
                    </div>
                  </div>
                </div>

                {/* Doctors list */}
                <div className="p-3 space-y-2">
                  {dep.doctors.length === 0 && (
                    <div className="py-6 text-center">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2"><User className="w-4 h-4 text-gray-400" /></div>
                      <p className="text-xs text-gray-400 font-medium">No doctors yet</p>
                    </div>
                  )}
                  {dep.doctors.map((doc) => (
                    <div key={doc.id} className="px-3.5 py-3 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-gray-50/80 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${dc.avatar} flex items-center justify-center text-white font-bold text-[10px] shadow-sm flex-shrink-0`}>
                            {doc.name.split(' ').filter(n => n.startsWith('Dr.') ? false : true).map(n => n[0]).join('').slice(0,2)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-gray-900 truncate">{doc.name}</div>
                            <div className="text-[11px] text-gray-400 truncate">{doc.specialty}</div>
                            <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-[11px] text-gray-500">
                              <span className="inline-flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-500" /> {doc.rating}</span>
                              <span className="inline-flex items-center gap-0.5"><MessageSquare className="w-3 h-3" /> {doc.reviewCount}</span>
                              <span className="inline-flex items-center gap-0.5"><BadgeDollarSign className="w-3 h-3" /> {doc.price}₺</span>
                              <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {doc.distanceKm} km</span>
                              <span className="inline-flex items-center gap-0.5"><User className="w-3 h-3" /> {doc.available || '—'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button onClick={()=>openEditDoctor(dep.id, doc)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">Edit</button>
                          <button onClick={()=>deleteDoctor(dep.id, doc.id)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-rose-600 hover:bg-rose-50 transition-colors">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Department Modal */}
        {deptModalOpen && (
          <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setDeptModalOpen(false)} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">{deptMode==='create' ? 'New Department' : 'Edit Department'}</h3>
                  <button onClick={()=>setDeptModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4"/></button>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Department Name</label>
                    <input value={deptEditing?.name||''} onChange={(e)=>setDeptEditing((p)=>({...p, name:e.target.value}))} className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none" placeholder="e.g., ENT, Neurology" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea value={deptEditing?.info||''} onChange={(e)=>setDeptEditing((p)=>({...p, info:e.target.value}))} rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none" placeholder="Short description" />
                  </div>
                </div>
                <div className="px-5 pb-4 flex items-center justify-end gap-2">
                  <button onClick={()=>setDeptModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button onClick={saveDept} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-md shadow-teal-200/50 transition-all duration-200">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Modal */}
        {doctorModalOpen && (
          <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setDoctorModalOpen(false)} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">{doctorEditing?.id ? 'Edit Doctor' : 'New Doctor'}</h3>
                  <button onClick={()=>setDoctorModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4"/></button>
                </div>
                <div className="px-5 py-4 grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Name</label>
                    <input value={doctorEditing?.name||''} onChange={(e)=>setDoctorEditing((p)=>({...p, name:e.target.value}))} className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none" placeholder="e.g., Dr. Jane Doe" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Specialty</label>
                    <input value={doctorEditing?.specialty||''} onChange={(e)=>setDoctorEditing((p)=>({...p, specialty:e.target.value}))} className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none" placeholder="e.g., Cardiologist" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Price (₺)</label>
                      <input value={doctorEditing?.price||''} onChange={(e)=>setDoctorEditing((p)=>({...p, price: String(e.target.value).replace(/[^0-9]/g,'')}))} className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none" placeholder="e.g., 800" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Next Availability</label>
                      <input type="datetime-local" value={doctorEditing?.available||''} onChange={(e)=>setDoctorEditing((p)=>({...p, available:e.target.value}))} className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none" />
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-4 flex items-center justify-end gap-2">
                  <button onClick={()=>setDoctorModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button onClick={saveDoctor} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-md shadow-teal-200/50 transition-all duration-200">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {confirm.open && (
          <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>closeConfirm(false)} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-50/80 to-white flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-rose-600" /></div>
                  <h3 className="text-sm font-bold text-gray-900">{confirm.title}</h3>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm text-gray-600 leading-relaxed">{confirm.desc}</p>
                </div>
                <div className="px-5 pb-4 flex items-center justify-end gap-2">
                  <button onClick={()=>closeConfirm(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button onClick={()=>closeConfirm(true)} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 rounded-xl shadow-md shadow-rose-200/50 transition-all duration-200">Confirm</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
