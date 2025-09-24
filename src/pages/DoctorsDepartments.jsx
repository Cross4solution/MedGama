import React, { useMemo, useState } from 'react';
import { Header } from '../components/layout';
import { Plus, Search, Star, MessageSquare, MapPin, BadgeDollarSign, User, Building2, Filter, Pencil, Trash2, X } from 'lucide-react';

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
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('rating'); // rating | reviews | distance | priceAsc | priceDesc

  // Modals state
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptEditing, setDeptEditing] = useState(null); // {id?, name, info}
  const [deptMode, setDeptMode] = useState('create');
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [doctorEditing, setDoctorEditing] = useState(null); // {id?, name, specialty, price, available}
  const [doctorDeptId, setDoctorDeptId] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, onYes: null, title: '', desc: '' });

  // Filter: by department name, doctor name or specialty
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return departments;
    return departments
      .map((d) => ({
        ...d,
        doctors: d.doctors.filter((doc) =>
          d.name.toLowerCase().includes(query) ||
          doc.name.toLowerCase().includes(query) ||
          doc.specialty.toLowerCase().includes(query)
        ),
      }))
      .filter((d) => d.name.toLowerCase().includes(query) || d.doctors.length > 0);
  }, [q, departments]);

  // Sorting
  const sorted = useMemo(() => {
    const clone = filtered.map((d) => ({ ...d, doctors: [...d.doctors] }));
    const sortFn = {
      rating: (a, b) => (b.rating - a.rating),
      reviews: (a, b) => (b.reviewCount - a.reviewCount),
      distance: (a, b) => (a.distanceKm - b.distanceKm),
      priceAsc: (a, b) => (a.price - b.price),
      priceDesc: (a, b) => (b.price - a.price),
    };
    return clone.map((d) => ({
      ...d,
      doctors: d.doctors.sort(sortFn[sort] || sortFn.rating)
    }));
  }, [filtered, sort]);

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
    <div>
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-teal-700"/> Doctors & Departments</h1>
          <button onClick={openCreateDept} className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700"><Plus className="w-4 h-4"/> New Department</button>
        </div>

        {/* Search & Filters */}
        <div className="rounded-2xl border bg-white shadow-sm p-3 md:p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search department, doctor or specialty" className="w-full h-11 pl-9 pr-3 border rounded-xl text-sm"/>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500"/>
            <select value={sort} onChange={(e)=>setSort(e.target.value)} className="h-11 border rounded-xl text-sm px-3">
              <option value="rating">Top rated</option>
              <option value="reviews">Most reviewed</option>
              <option value="distance">Nearest</option>
              <option value="priceAsc">Price (asc)</option>
              <option value="priceDesc">Price (desc)</option>
            </select>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((dep) => (
            <div key={dep.id} className="rounded-2xl border bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold text-gray-900">{dep.name}</div>
                  <div className="text-sm text-gray-500">{dep.info || '—'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>openEditDept(dep)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"><Pencil className="w-4 h-4"/> Edit</button>
                  <button onClick={()=>deleteDept(dep.id)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm text-rose-600"><Trash2 className="w-4 h-4"/> Delete</button>
                  <button onClick={()=>openCreateDoctor(dep.id)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"><Plus className="w-4 h-4"/> New Doctor</button>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {dep.doctors.length === 0 && (<div className="text-sm text-gray-500">No doctors yet.</div>)}
                {dep.doctors.map((doc) => (
                  <div key={doc.id} className="p-3 rounded-xl border bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{doc.name}</div>
                        <div className="text-xs text-gray-500 truncate">{doc.specialty}</div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1"><Star className="w-4 h-4 text-amber-500"/> {doc.rating}</span>
                          <span className="inline-flex items-center gap-1"><MessageSquare className="w-4 h-4"/> {doc.reviewCount} reviews</span>
                          <span className="inline-flex items-center gap-1"><BadgeDollarSign className="w-4 h-4"/> {doc.price}₺</span>
                          <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4"/> {doc.distanceKm} km</span>
                          <span className="inline-flex items-center gap-1"><User className="w-4 h-4"/> {doc.available || '—'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={()=>openEditDoctor(dep.id, doc)} className="px-3 py-1.5 rounded-lg text-xs border bg-white hover:bg-gray-50">Edit</button>
                        <button onClick={()=>deleteDoctor(dep.id, doc.id)} className="px-3 py-1.5 rounded-lg text-xs border bg-white hover:bg-gray-50 text-rose-600">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Department Modal */}
        {deptModalOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/30" onClick={()=>setDeptModalOpen(false)} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-900">{deptMode==='create' ? 'New Department' : 'Edit Department'}</h3>
                  <button onClick={()=>setDeptModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5"/></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                    <input value={deptEditing?.name||''} onChange={(e)=>setDeptEditing((p)=>({...p, name:e.target.value}))} className="w-full h-11 px-3 border rounded-xl text-sm" placeholder="e.g., ENT, Neurology" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={deptEditing?.info||''} onChange={(e)=>setDeptEditing((p)=>({...p, info:e.target.value}))} rows={3} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Short description" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button onClick={()=>setDeptModalOpen(false)} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm">Cancel</button>
                  <button onClick={saveDept} className="px-3 py-2 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-700">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Modal */}
        {doctorModalOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/30" onClick={()=>setDoctorModalOpen(false)} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-900">{doctorEditing?.id ? 'Edit Doctor' : 'New Doctor'}</h3>
                  <button onClick={()=>setDoctorModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5"/></button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input value={doctorEditing?.name||''} onChange={(e)=>setDoctorEditing((p)=>({...p, name:e.target.value}))} className="w-full h-11 px-3 border rounded-xl text-sm" placeholder="e.g., Dr. Jane Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                    <input value={doctorEditing?.specialty||''} onChange={(e)=>setDoctorEditing((p)=>({...p, specialty:e.target.value}))} className="w-full h-11 px-3 border rounded-xl text-sm" placeholder="e.g., Cardiologist" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₺)</label>
                      <input value={doctorEditing?.price||''} onChange={(e)=>setDoctorEditing((p)=>({...p, price: String(e.target.value).replace(/[^0-9]/g,'')}))} className="w-full h-11 px-3 border rounded-xl text-sm" placeholder="e.g., 800" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                      <input value={doctorEditing?.available||''} onChange={(e)=>setDoctorEditing((p)=>({...p, available:e.target.value}))} className="w-full h-11 px-3 border rounded-xl text-sm" placeholder="e.g., Today 15:00" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button onClick={()=>setDoctorModalOpen(false)} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm">Cancel</button>
                  <button onClick={saveDoctor} className="px-3 py-2 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-700">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {confirm.open && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/30" onClick={()=>closeConfirm(false)} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border p-4">
                <div className="mb-2 text-base font-semibold text-gray-900">{confirm.title}</div>
                <div className="text-sm text-gray-600">{confirm.desc}</div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button onClick={()=>closeConfirm(false)} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm">Cancel</button>
                  <button onClick={()=>closeConfirm(true)} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-700">Confirm</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
