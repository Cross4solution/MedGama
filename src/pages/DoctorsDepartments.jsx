import React, { useMemo, useState } from 'react';
import { Building2, MapPin, BadgeDollarSign, User, Star, Plus, Pencil, Trash2, X } from 'lucide-react';

// Basit mock veri: gerçek projede API'den gelecek
const INITIAL_DEPARTMENTS = [
  {
    id: 'dep-ent',
    name: 'ENT',
    info: 'Ear, Nose and Throat',
    doctors: [
      {
        id: 'doc-1',
        name: 'Dr. Ahmet Yılmaz',
        title: 'ENT Specialist',
        fee: 800,
        currency: '₺',
        rating: 4.8,
        reviewCount: 132,
        distanceKm: 3.4,
        nextAvailable: 'Today 15:00',
      },
    ],
  },
  {
    id: 'dep-neuro',
    name: 'Neurology',
    info: 'Brain and Nervous System',
    doctors: [
      {
        id: 'doc-2',
        name: 'Dr. Ece Demir',
        title: 'Neurologist',
        fee: 1200,
        currency: '₺',
        rating: 4.9,
        reviewCount: 210,
        distanceKm: 2.1,
        nextAvailable: 'Today 16:30',
      },
    ],
  },
];

export default function DoctorsDepartments() {
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [selectedDeptId, setSelectedDeptId] = useState(INITIAL_DEPARTMENTS[0]?.id || null);

  // Department modal state
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptEditing, setDeptEditing] = useState(null); // {id?, name, info}
  const [deptMode, setDeptMode] = useState('create'); // 'create' | 'edit'

  // Doctor modal state
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [doctorEditing, setDoctorEditing] = useState(null); // {id?, name, title, fee, currency, departmentId, nextAvailable}

  // Confirm modal
  const [confirm, setConfirm] = useState({ open: false, title: '', desc: '', onYes: null });

  const selectedDept = useMemo(
    () => departments.find((d) => d.id === selectedDeptId) || null,
    [departments, selectedDeptId]
  );

  const flatDoctors = useMemo(
    () =>
      departments.flatMap((dep) =>
        (dep.doctors || []).map((doc) => ({
          ...doc,
          departmentId: dep.id,
          departmentName: dep.name,
          departmentInfo: dep.info,
        }))
      ),
    [departments]
  );

  const doctorsOfSelected = useMemo(
    () => flatDoctors.filter((d) => !selectedDeptId || d.departmentId === selectedDeptId),
    [flatDoctors, selectedDeptId]
  );

  // Department actions
  const openCreateDept = () => {
    setDeptMode('create');
    setDeptEditing({ name: '', info: '' });
    setDeptModalOpen(true);
  };

  const openEditDept = (dept) => {
    setDeptMode('edit');
    setDeptEditing({ id: dept.id, name: dept.name, info: dept.info || '' });
    setDeptModalOpen(true);
  };

  const saveDept = () => {
    if (!deptEditing?.name?.trim()) return;
    const name = deptEditing.name.trim();
    const info = (deptEditing.info || '').trim();

    setDepartments((prev) => {
      if (deptMode === 'create') {
        const id = `dep-${Date.now()}`;
        return [...prev, { id, name, info, doctors: [] }];
      }
      return prev.map((d) => (d.id === deptEditing.id ? { ...d, name, info } : d));
    });

    setDeptModalOpen(false);
  };

  const deleteDept = (deptId) => {
    const dept = departments.find((d) => d.id === deptId);
    setConfirm({
      open: true,
      title: 'Delete department',
      desc: dept
        ? `"${dept.name}" and all its doctors will be removed from this clinic. Are you sure?`
        : 'This department and its doctors will be removed. Are you sure?',
      onYes: () => {
        setDepartments((prev) => prev.filter((d) => d.id !== deptId));
        if (selectedDeptId === deptId) {
          const remaining = departments.filter((d) => d.id !== deptId);
          setSelectedDeptId(remaining[0]?.id || null);
        }
      },
    });
  };

  // Doctor actions
  const openCreateDoctor = (deptId) => {
    setDoctorEditing({
      id: null,
      name: '',
      title: '',
      avatar: '',
      fee: '',
      currency: '₺',
      distanceKm: '',
      nextAvailable: '',
      departmentId: deptId || selectedDeptId || departments[0]?.id || null,
    });
    setDoctorModalOpen(true);
  };

  const openEditDoctor = (doctor) => {
    setDoctorEditing({
      id: doctor.id,
      name: doctor.name,
      title: doctor.title || '',
      avatar: doctor.avatar || '',
      fee: doctor.fee ?? '',
      currency: doctor.currency || '₺',
      distanceKm: doctor.distanceKm ?? '',
      nextAvailable: doctor.nextAvailable || '',
      departmentId: doctor.departmentId,
    });
    setDoctorModalOpen(true);
  };

  const saveDoctor = () => {
    if (!doctorEditing?.name?.trim()) return;
    const targetDeptId = doctorEditing.departmentId;
    if (!targetDeptId) return;

    const cleanFee = doctorEditing.fee === '' ? null : Number(String(doctorEditing.fee).replace(/[^0-9]/g, ''));
    const cleanDistance = doctorEditing.distanceKm === '' ? null : Number(String(doctorEditing.distanceKm).replace(/[^0-9.]/g, ''));

    setDepartments((prev) => {
      // Eğer departman değiştiyse, eski departmandan çıkar, yenisine ekle
      const next = prev.map((dep) => {
        let doctors = dep.doctors || [];
        // Eğer edit modundaysak ve bu departmanda eski doktor varsa, onu kaldır
        if (doctorEditing.id) {
          doctors = doctors.filter((d) => d.id !== doctorEditing.id);
        }

        // Hedef departmana ekle
        if (dep.id === targetDeptId) {
          const base = {
            id: doctorEditing.id || `doc-${Date.now()}`,
            name: doctorEditing.name.trim(),
            title: (doctorEditing.title || '').trim(),
            avatar: doctorEditing.avatar || '',
            fee: cleanFee,
            currency: doctorEditing.currency || '₺',
            distanceKm: cleanDistance,
            nextAvailable: (doctorEditing.nextAvailable || '').trim(),
            rating: 0,
            reviewCount: 0,
          };
          doctors = [...doctors, base];
        }

        return { ...dep, doctors };
      });

      return next;
    });

    setDoctorModalOpen(false);
  };

  const deleteDoctor = (doctor) => {
    setConfirm({
      open: true,
      title: 'Delete doctor',
      desc: `"${doctor.name}" will be removed from this clinic. Are you sure?`,
      onYes: () => {
        setDepartments((prev) =>
          prev.map((dep) => ({
            ...dep,
            doctors: (dep.doctors || []).filter((d) => d.id !== doctor.id),
          }))
        );
      },
    });
  };

  const closeConfirm = (yes) => {
    if (yes && typeof confirm.onYes === 'function') {
      confirm.onYes();
    }
    setConfirm({ open: false, title: '', desc: '', onYes: null });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#1C6A83] uppercase tracking-wide mb-1">
              <Building2 className="w-4 h-4" />
              <span>Clinic setup</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Doctors &amp; Departments</h1>
            <p className="mt-1 text-sm text-gray-600 max-w-2xl">
              Define your departments, add doctors and set examination fees for each doctor. These details
              will be used on your public clinic and doctor profiles.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openCreateDoctor(selectedDeptId)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1C6A83] text-white px-3 py-2 text-xs sm:text-sm font-medium shadow-sm hover:bg-[#155369]"
            >
              <Plus className="w-4 h-4" />
              <span>New doctor</span>
            </button>
            <button
              type="button"
              onClick={openCreateDept}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
              <span>New department</span>
            </button>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Departments list */}
          <aside className="lg:w-72 xl:w-80 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900">Departments</h2>
                <button
                  type="button"
                  onClick={openCreateDept}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[#1C6A83] bg-[#1C6A83]/5 hover:bg-[#1C6A83]/10"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
              <div className="space-y-1.5">
                {departments.length === 0 && (
                  <p className="text-xs text-gray-500">
                    You have not created any departments yet. Start by adding at least one department.
                  </p>
                )}
                {departments.map((dep) => {
                  const isActive = selectedDeptId === dep.id;
                  const doctorsCount = (dep.doctors || []).length;
                  return (
                    <button
                      key={dep.id}
                      type="button"
                      onClick={() => setSelectedDeptId(dep.id)}
                      className={`w-full flex items-start justify-between rounded-xl px-3 py-2 text-xs sm:text-sm border transition-colors ${
                        isActive
                          ? 'border-[#1C6A83]/60 bg-[#1C6A83]/5 text-[#1C6A83]'
                          : 'border-gray-100 bg-white text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex-1 min-w-0 text-left">
                        <span className="block font-medium truncate">{dep.name}</span>
                        {dep.info && (
                          <span className="block text-[11px] text-gray-500 truncate">{dep.info}</span>
                        )}
                      </span>
                      <span className="ml-2 flex flex-col items-end gap-1">
                        <span className="text-[11px] text-gray-500 whitespace-nowrap">
                          {doctorsCount} doctors
                        </span>
                        <span className="flex gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDept(dep);
                            }}
                            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                            aria-label="Edit department"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDept(dep.id);
                            }}
                            className="p-1 rounded-md text-rose-500 hover:bg-rose-50"
                            aria-label="Delete department"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-xs text-gray-600">
              <div className="font-semibold text-gray-900 mb-1 text-sm">How this works</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Create departments that exist in your clinic.</li>
                <li>Add doctors and assign them to a department.</li>
                <li>Set examination fees to show on public profiles.</li>
              </ul>
            </div>
          </aside>

          {/* Right: Doctors of selected department */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {selectedDept ? selectedDept.name : 'Select a department'}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500 max-w-xl">
                  {selectedDept
                    ? selectedDept.info || 'Manage doctors and fees for this department.'
                    : 'Choose a department on the left to see and manage its doctors.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openCreateDoctor(selectedDeptId)}
                disabled={!selectedDeptId}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add doctor</span>
              </button>
            </div>

            {doctorsOfSelected.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
                {selectedDept
                  ? 'No doctors added to this department yet. Use "Add doctor" to create one.'
                  : 'Select a department on the left to start adding doctors.'}
              </div>
            ) : (
              <div className="space-y-3">
                {doctorsOfSelected.map((doc) => (
                  <article
                    key={doc.id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-500 overflow-hidden flex-shrink-0">
                        <span>{(doc.name || '?').split(' ').map((x) => x[0]).join('').slice(0, 2)}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{doc.name}</h3>
                        <p className="text-xs text-gray-600 truncate">{doc.title || 'Specialist'}</p>
                        <p className="mt-0.5 text-[11px] text-gray-500 truncate">
                          {doc.departmentName || selectedDept?.name} · Anadolu Health Center
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-600">
                          {typeof doc.rating === 'number' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-medium">{doc.rating.toFixed(1)}</span>
                              {typeof doc.reviewCount === 'number' && (
                                <span className="text-[10px] text-amber-800/80">({doc.reviewCount})</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => openEditDoctor(doc)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDoctor(doc)}
                        className="px-3 py-1.5 rounded-xl border border-rose-100 bg-rose-50 text-xs font-medium text-rose-600 hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Department modal */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">
                {deptMode === 'create' ? 'New department' : 'Edit department'}
              </h2>
              <button
                type="button"
                onClick={() => setDeptModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Department name</label>
                <input
                  type="text"
                  value={deptEditing?.name || ''}
                  onChange={(e) => setDeptEditing((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/40 focus:border-[#1C6A83]"
                  placeholder="e.g. Neurology, ENT"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Short description</label>
                <textarea
                  rows={3}
                  value={deptEditing?.info || ''}
                  onChange={(e) => setDeptEditing((prev) => ({ ...prev, info: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/40 focus:border-[#1C6A83]"
                  placeholder="e.g. Brain and Nervous System"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => setDeptModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-[#1C6A83] text-white hover:bg-[#155369]"
                onClick={saveDept}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor modal */}
      {doctorModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">
                {doctorEditing?.id ? 'Edit doctor' : 'New doctor'}
              </h2>
              <button
                type="button"
                onClick={() => setDoctorModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Photo (optional)</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden text-[11px] text-gray-500 flex-shrink-0">
                    {doctorEditing?.avatar ? (
                      <img
                        src={doctorEditing.avatar}
                        alt={doctorEditing.name || 'Doctor avatar'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {(doctorEditing?.name || '?')
                          .split(' ')
                          .map((x) => x[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0];
                      if (!file) return;
                      try {
                        const url = URL.createObjectURL(file);
                        setDoctorEditing((prev) => ({ ...prev, avatar: url }));
                      } catch {
                        // ignore preview errors
                      }
                    }}
                    className="flex-1 text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-xs file:font-medium file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Doctor name</label>
                <input
                  type="text"
                  value={doctorEditing?.name || ''}
                  onChange={(e) => setDoctorEditing((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/40 focus:border-[#1C6A83]"
                  placeholder="e.g. Dr. Jane Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title / specialty</label>
                <input
                  type="text"
                  value={doctorEditing?.title || ''}
                  onChange={(e) => setDoctorEditing((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/40 focus:border-[#1C6A83]"
                  placeholder="e.g. Neurologist, Plastic Surgeon"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={doctorEditing?.departmentId || ''}
                  onChange={(e) => setDoctorEditing((prev) => ({ ...prev, departmentId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/40 focus:border-[#1C6A83]"
                >
                  <option value="" disabled>
                    Select department
                  </option>
                  {departments.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => setDoctorModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-[#1C6A83] text-white hover:bg-[#155369]"
                onClick={saveDoctor}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">{confirm.title}</h2>
            <p className="text-xs text-gray-600 mb-4">{confirm.desc}</p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => closeConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                onClick={() => closeConfirm(true)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
