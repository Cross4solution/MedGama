import React, { useEffect, useMemo, useRef, useState } from 'react';

const DAYS = [
  { key: 0, label: 'Mon' },
  { key: 1, label: 'Tue' },
  { key: 2, label: 'Wed' },
  { key: 3, label: 'Thu' },
  { key: 4, label: 'Fri' },
  { key: 5, label: 'Sat' },
  { key: 6, label: 'Sun' },
];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const pad2 = (n) => String(n).padStart(2, '0');
const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || '00:00').split(':');
  return (Number(h) || 0) * 60 + (Number(m) || 0);
};
const toHHMM = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad2(h)}:${pad2(m)}`;
};
const snapMinutes = (mins, step) => Math.round(mins / step) * step;

export default function DoctorAvailabilityEditor({ user }) {
  const userKey = user?.email || user?.id || 'anon';

  const storageKey = useMemo(() => `doctor_availability_${userKey}`, [userKey]);

  const [settings, setSettings] = useState({
    durationOnline: 20,
    durationInPerson: 30,
    buffer: 0,
  });

  const [blocks, setBlocks] = useState([]);
  const [activeModality, setActiveModality] = useState('online');
  const [savedAt, setSavedAt] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const DAY_START = 0;
  const DAY_END = 24 * 60;
  const GRID_STEP = 10;

  const gridHeight = 1040;

  const draftRef = useRef(null);
  const [draft, setDraft] = useState(null);
  const resizeRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const nextSettings = parsed?.settings;
      const nextBlocks = parsed?.blocks;
      if (nextSettings && typeof nextSettings === 'object') {
        setSettings((prev) => ({
          ...prev,
          durationOnline: Number(nextSettings.durationOnline) || prev.durationOnline,
          durationInPerson: Number(nextSettings.durationInPerson) || prev.durationInPerson,
          buffer: Number(nextSettings.buffer) || 0,
        }));
      }
      if (Array.isArray(nextBlocks)) {
        setBlocks(nextBlocks.filter((b) => b && typeof b === 'object'));
      }
    } catch {}
  }, [storageKey]);

  const durationFor = (modality) => {
    const d = modality === 'in_person' ? settings.durationInPerson : settings.durationOnline;
    return Math.max(10, Number(d) || 20);
  };

  const estimateAppointments = (blockMinutes, modality) => {
    const len = Math.max(0, Number(blockMinutes) || 0);
    const duration = durationFor(modality);
    const buffer = Math.max(0, Number(settings.buffer) || 0);
    const step = duration + buffer;
    if (len < duration) return 0;
    if (step <= 0) return 0;
    return 1 + Math.floor((len - duration) / step);
  };

  const timeOptions = useMemo(() => {
    const arr = [];
    for (let m = DAY_START; m <= DAY_END; m += GRID_STEP) {
      arr.push(m);
    }
    return arr;
  }, [DAY_START, DAY_END, GRID_STEP]);

  const isPointInsideOtherBlock = (id, weekday, min) => {
    const w = Number(weekday);
    const m = Number(min);
    return blocks.some((b) => {
      if (!b) return false;
      if (id && b.id === id) return false;
      if (Number(b.weekday) !== w) return false;
      const s = Number(b.startMin);
      const e = Number(b.endMin);
      return m >= s && m < e;
    });
  };

  const firstAvailableStart = (id, weekday, preferred) => {
    const w = Number(weekday);
    const startAt = clamp(snapMinutes(Number(preferred), GRID_STEP), DAY_START, DAY_END);
    const list = timeOptions.filter((m) => m < DAY_END);
    const fromIdx = Math.max(0, list.findIndex((m) => m >= startAt));
    for (let i = fromIdx; i < list.length; i += 1) {
      const m = list[i];
      if (!isPointInsideOtherBlock(id, w, m)) return m;
    }
    for (let i = 0; i < fromIdx; i += 1) {
      const m = list[i];
      if (!isPointInsideOtherBlock(id, w, m)) return m;
    }
    return list[0] || DAY_START;
  };

  const computeDefaultEnd = (id, weekday, modality, startMin) => {
    const duration = durationFor(modality);
    const endLimit = nextStartLimit({ id, weekday, startMin });
    const nextEnd = clamp(Math.min(Number(startMin) + duration, endLimit), DAY_START, DAY_END);
    const minEnd = clamp(Number(startMin) + GRID_STEP, DAY_START, DAY_END);
    return clamp(Math.max(nextEnd, minEnd), DAY_START, DAY_END);
  };

  const isPointInsideBlock = (weekday, min) => {
    const w = Number(weekday);
    const m = Number(min);
    return blocks.some((b) => {
      if (!b) return false;
      if (Number(b.weekday) !== w) return false;
      const s = Number(b.startMin);
      const e = Number(b.endMin);
      return m >= s && m < e;
    });
  };

  const overlapsAny = ({ id, weekday, startMin, endMin }) => {
    const w = Number(weekday);
    const s = Number(startMin);
    const e = Number(endMin);
    return blocks.some((b) => {
      if (!b) return false;
      if (id && b.id === id) return false;
      if (Number(b.weekday) !== w) return false;
      const bs = Number(b.startMin);
      const be = Number(b.endMin);
      return s < be && e > bs;
    });
  };

  const nextStartLimit = ({ id, weekday, startMin }) => {
    const w = Number(weekday);
    const s = Number(startMin);
    let limit = DAY_END;
    blocks.forEach((b) => {
      if (!b) return;
      if (id && b.id === id) return;
      if (Number(b.weekday) !== w) return;
      const bs = Number(b.startMin);
      if (bs >= s) limit = Math.min(limit, bs);
    });
    return limit;
  };

  const yToMinutes = (y, height) => {
    const frac = clamp(y / height, 0, 1);
    const mins = DAY_START + frac * (DAY_END - DAY_START);
    return clamp(snapMinutes(mins, GRID_STEP), DAY_START, DAY_END);
  };

  const minutesToY = (mins, height) => {
    const frac = (mins - DAY_START) / (DAY_END - DAY_START);
    return frac * height;
  };

  const startDrag = (weekday, e) => {
    if (isDragging || isResizing) return;
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setSelectedId(null);
    setEditDraft(null);
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const startMin = yToMinutes(y, rect.height);
    if (isPointInsideBlock(weekday, startMin)) {
      setErrorMsg('Click the block to edit');
      return;
    }
    const endMin = computeDefaultEnd(null, weekday, activeModality, startMin);

    const next = {
      weekday,
      modality: activeModality,
      startMin,
      endMin,
      height: rect.height,
      topOffset: rect.top,
    };
    draftRef.current = next;
    setDraft(next);
    setIsDragging(true);
    setErrorMsg('');
  };

  const moveDrag = (e) => {
    const d = draftRef.current;
    if (!d) return;
    const y = e.clientY - d.topOffset;
    const curMin = yToMinutes(y, d.height);
    const minEnd = clamp(d.startMin + GRID_STEP, DAY_START, DAY_END);
    const endLimit = nextStartLimit({ id: null, weekday: d.weekday, startMin: d.startMin });
    const endMin = clamp(Math.min(Math.max(curMin, minEnd), endLimit), DAY_START, DAY_END);
    const next = { ...d, endMin };
    draftRef.current = next;
    setDraft(next);
  };

  const endDrag = () => {
    const d = draftRef.current;
    if (!d) return;
    draftRef.current = null;
    setDraft(null);
    setIsDragging(false);
    if (d.endMin <= d.startMin) return;

    const candidate = {
      id: null,
      weekday: d.weekday,
      startMin: d.startMin,
      endMin: d.endMin,
    };
    if (overlapsAny(candidate)) {
      setErrorMsg('Overlaps another block');
      return;
    }

    setBlocks((prev) => [
      ...prev,
      {
        id: `b-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        weekday: d.weekday,
        modality: d.modality,
        startMin: d.startMin,
        endMin: d.endMin,
      },
    ]);
  };

  useEffect(() => {
    if (!isDragging) return undefined;
    const onMove = (e) => moveDrag(e);
    const onUp = () => endDrag();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  const startResize = (b, e) => {
    if (!b?.id) return;
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    const col = e.currentTarget?.closest?.('[data-daycol]');
    if (!col) return;
    const rect = col.getBoundingClientRect();
    resizeRef.current = {
      id: b.id,
      weekday: Number(b.weekday),
      startMin: Number(b.startMin),
      height: rect.height,
      topOffset: rect.top,
    };
    setSelectedId(b.id);
    selectBlock(b);
    setIsResizing(true);
    setErrorMsg('');
  };

  const moveResize = (e) => {
    const r = resizeRef.current;
    if (!r) return;
    const y = e.clientY - r.topOffset;
    const curMin = yToMinutes(y, r.height);
    const minEnd = clamp(r.startMin + GRID_STEP, DAY_START, DAY_END);
    const endLimit = nextStartLimit({ id: r.id, weekday: r.weekday, startMin: r.startMin });
    const endMin = clamp(Math.min(Math.max(curMin, minEnd), endLimit), DAY_START, DAY_END);
    setBlocks((prev) =>
      prev.map((b) => (b?.id === r.id ? { ...b, endMin } : b))
    );
    setEditDraft((p) => (p && p.id === r.id ? { ...p, endMin } : p));
  };

  const endResize = () => {
    resizeRef.current = null;
    setIsResizing(false);
  };

  useEffect(() => {
    if (!isResizing) return undefined;
    const onMove = (e) => moveResize(e);
    const onUp = () => endResize();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isResizing]);

  const removeBlock = (id) => setBlocks((prev) => prev.filter((b) => b?.id !== id));

  const selectBlock = (b) => {
    if (!b?.id) return;
    setSelectedId(b.id);
    setEditDraft({
      id: b.id,
      weekday: Number(b.weekday),
      modality: b.modality || 'online',
      startMin: Number(b.startMin) || DAY_START,
      endMin: Number(b.endMin) || (Number(b.startMin) || DAY_START) + GRID_STEP,
    });
  };

  const applyEdit = () => {
    if (!editDraft?.id) return;
    const w = clamp(Number(editDraft.weekday), 0, 6);
    const startMin = clamp(snapMinutes(Number(editDraft.startMin), GRID_STEP), DAY_START, DAY_END);
    const endMin = clamp(snapMinutes(Number(editDraft.endMin), GRID_STEP), DAY_START, DAY_END);
    if (endMin <= startMin) return;
    if (overlapsAny({ id: editDraft.id, weekday: w, startMin, endMin })) {
      setErrorMsg('Overlaps another block');
      return;
    }
    setErrorMsg('');
    setBlocks((prev) =>
      prev.map((b) =>
        b?.id === editDraft.id
          ? {
              ...b,
              weekday: w,
              modality: editDraft.modality || 'online',
              startMin,
              endMin,
            }
          : b
      )
    );
  };

  const save = () => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          settings,
          blocks,
          updated_at: Date.now(),
        })
      );
      setSavedAt(Date.now());
    } catch {}
  };

  const timeMarkers = useMemo(() => {
    const arr = [];
    for (let m = DAY_START; m <= DAY_END; m += 60) {
      arr.push(m);
    }
    return arr;
  }, [DAY_START, DAY_END]);

  const blocksByDay = useMemo(() => {
    const map = new Map();
    DAYS.forEach((d) => map.set(d.key, []));
    blocks.forEach((b) => {
      if (!b) return;
      const w = Number(b.weekday);
      if (!map.has(w)) return;
      map.get(w).push(b);
    });
    map.forEach((arr, k) => {
      arr.sort((a, b) => (a.startMin || 0) - (b.startMin || 0));
      map.set(k, arr);
    });
    return map;
  }, [blocks]);

  const selectedBlock = useMemo(() => {
    if (!selectedId) return null;
    return blocks.find((b) => b?.id === selectedId) || null;
  }, [blocks, selectedId]);

  const formatSaved = () => {
    if (!savedAt) return '';
    try {
      const d = new Date(savedAt);
      return d.toLocaleString();
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-white shadow-sm p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Availability</h2>
            <p className="mt-1 text-xs text-gray-500">Add weekly blocks for online and in-person appointments. Drag on a day column to create a time block.</p>
          </div>
          <div className="flex items-center gap-2">
            {savedAt ? (
              <span className="text-[11px] text-gray-500">Saved: {formatSaved()}</span>
            ) : null}
            <button
              type="button"
              onClick={save}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#1C6A83] text-white text-sm font-medium hover:bg-[#0F4A5C]"
            >
              Save availability
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-4">
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="grid grid-cols-[56px,repeat(7,1fr)] bg-gray-50 border-b">
              <div className="px-2 py-2 text-[11px] text-gray-500">Time</div>
              {DAYS.map((d) => (
                <div key={d.key} className="px-2 py-2 text-[11px] font-medium text-gray-700 text-center border-l">
                  {d.label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[56px,repeat(7,1fr)] select-none">
              <div className="relative border-r" style={{ height: gridHeight }}>
                {timeMarkers.map((m) => (
                  <div key={m} className="absolute left-0 right-0" style={{ top: minutesToY(m, gridHeight) }}>
                    <div className="h-px bg-gray-200" />
                    <div
                      className={`absolute left-1 text-[10px] text-gray-400 leading-none ${
                        m === DAY_START ? 'top-1' : (m === DAY_END ? '-top-3' : '-top-2')
                      }`}
                    >
                      {toHHMM(m)}
                    </div>
                  </div>
                ))}
              </div>

              {DAYS.map((d) => (
                <div
                  key={d.key}
                  data-daycol
                  className="relative border-r last:border-r-0 bg-white select-none overflow-hidden"
                  style={{ height: gridHeight }}
                  onMouseDown={(e) => startDrag(d.key, e)}
                  onClick={() => {
                    setSelectedId(null);
                    setEditDraft(null);
                    setErrorMsg('');
                  }}
                  role="presentation"
                >
                  {timeMarkers.map((m) => (
                    <div key={m} className="absolute left-0 right-0" style={{ top: minutesToY(m, gridHeight) }}>
                      <div className="h-px bg-gray-100" />
                    </div>
                  ))}

                  {(blocksByDay.get(d.key) || []).map((b) => {
                    const top = minutesToY(clamp(Number(b.startMin) || DAY_START, DAY_START, DAY_END), gridHeight);
                    const bottom = minutesToY(clamp(Number(b.endMin) || DAY_START, DAY_START, DAY_END), gridHeight);
                    const h = Math.max(10, bottom - top);
                    const isOnline = (b.modality || 'online') === 'online';
                    const isSelected = selectedId && b.id === selectedId;
                    const showTime = h >= 36;
                    return (
                      <div
                        key={b.id}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectBlock(b);
                        }}
                        className={`absolute left-1 right-1 relative rounded-lg border shadow-sm px-2 py-1 text-[11px] cursor-pointer select-none overflow-hidden ${isOnline ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'} ${isSelected ? 'ring-2 ring-gray-900/30' : ''}`}
                        style={{ top, height: h }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBlock(b.id);
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          className="absolute top-1 right-1 w-5 h-5 inline-flex items-center justify-center rounded-md border border-white/60 bg-white/40 hover:bg-white/70 text-[11px] leading-none font-semibold opacity-70 hover:opacity-100"
                          aria-label="Remove block"
                        >
                          ×
                        </button>

                        <div className="min-w-0 pr-6 leading-tight">
                          <div className="font-semibold truncate">{isOnline ? 'Online' : 'In-person'}</div>
                          {showTime ? (
                            <div className="text-[10px] opacity-80 truncate">
                              {toHHMM(b.startMin)} - {toHHMM(b.endMin)}
                              <span className="opacity-70"> · {Math.max(0, (Number(b.endMin) || 0) - (Number(b.startMin) || 0))}m</span>
                            </div>
                          ) : null}
                        </div>
                        <div
                          role="presentation"
                          onMouseDown={(e) => startResize(b, e)}
                          className="absolute bottom-1 right-1 w-3 h-3 rounded bg-white/80 border border-gray-200 cursor-ns-resize"
                          title="Resize"
                        />
                      </div>
                    );
                  })}

                  {draft && draft.weekday === d.key ? (() => {
                    const top = minutesToY(draft.startMin, gridHeight);
                    const bottom = minutesToY(draft.endMin, gridHeight);
                    const h = Math.max(10, bottom - top);
                    const isOnline = (draft.modality || 'online') === 'online';
                    return (
                      <div
                        className={`absolute left-1 right-1 rounded-lg border px-2 py-1 text-[11px] opacity-70 ${isOnline ? 'bg-blue-100 border-blue-200 text-blue-900' : 'bg-emerald-100 border-emerald-200 text-emerald-900'}`}
                        style={{ top, height: h }}
                      >
                        <div className="font-semibold">{isOnline ? 'Online' : 'In-person'}</div>
                        <div className="text-[10px]">{toHHMM(draft.startMin)} - {toHHMM(draft.endMin)}</div>
                      </div>
                    );
                  })() : null}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 space-y-4">
            {errorMsg ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                {errorMsg}
              </div>
            ) : null}
            <div>
              <div className="text-xs font-semibold text-gray-900">Block type</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModality('online')}
                  className={`h-10 rounded-xl border text-sm font-medium ${activeModality === 'online' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'}`}
                >
                  Online
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModality('in_person')}
                  className={`h-10 rounded-xl border text-sm font-medium ${activeModality === 'in_person' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'}`}
                >
                  In-person
                </button>
              </div>
              <p className="mt-2 text-[11px] text-gray-500">Drag on the calendar to create a block with this type.</p>
            </div>

            {isDragging && draft ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="text-xs font-semibold text-amber-900">Creating block</div>
                <div className="mt-1 text-[11px] text-amber-900">
                  {toHHMM(draft.startMin)} - {toHHMM(draft.endMin)}
                  <span className="text-amber-800"> · {Math.max(0, draft.endMin - draft.startMin)} min</span>
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="text-xs font-semibold text-gray-900">Edit selected block</div>
              {!editDraft || !selectedBlock ? (
                <div className="mt-1 text-[11px] text-gray-500">Click a block to edit it.</div>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">Day</label>
                      <select
                        value={editDraft.weekday}
                        onChange={(e) => {
                          const weekday = Number(e.target.value);
                          const startMin = firstAvailableStart(editDraft.id, weekday, editDraft.startMin);
                          const endMin = computeDefaultEnd(editDraft.id, weekday, editDraft.modality, startMin);
                          setEditDraft((p) => ({ ...p, weekday, startMin, endMin }));
                          setErrorMsg('');
                        }}
                        className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                      >
                        {DAYS.map((d) => (
                          <option key={d.key} value={d.key}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={editDraft.modality}
                        onChange={(e) => {
                          const modality = e.target.value;
                          const startMin = firstAvailableStart(editDraft.id, editDraft.weekday, editDraft.startMin);
                          const endMin = computeDefaultEnd(editDraft.id, editDraft.weekday, modality, startMin);
                          setEditDraft((p) => ({ ...p, modality, startMin, endMin }));
                          setErrorMsg('');
                        }}
                        className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                      >
                        <option value="online">Online</option>
                        <option value="in_person">In-person</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">Start</label>
                      <select
                        value={editDraft.startMin}
                        onChange={(e) => {
                          const raw = Number(e.target.value);
                          const startMin = firstAvailableStart(editDraft.id, editDraft.weekday, raw);
                          const endMin = computeDefaultEnd(editDraft.id, editDraft.weekday, editDraft.modality, startMin);
                          setEditDraft((p) => ({ ...p, startMin, endMin }));
                          setErrorMsg('');
                        }}
                        className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                      >
                        {timeOptions
                          .filter((m) => m < DAY_END)
                          .filter((m) => !isPointInsideOtherBlock(editDraft.id, editDraft.weekday, m))
                          .map((m) => (
                            <option key={m} value={m}>{toHHMM(m)}</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">End</label>
                      <select
                        value={editDraft.endMin}
                        onChange={(e) => {
                          const endMin = Number(e.target.value);
                          setEditDraft((p) => ({ ...p, endMin }));
                          setErrorMsg('');
                        }}
                        className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                      >
                        {timeOptions
                          .filter((m) => m > Number(editDraft.startMin))
                          .filter((m) => m <= nextStartLimit({ id: editDraft.id, weekday: editDraft.weekday, startMin: editDraft.startMin }))
                          .map((m) => (
                            <option key={m} value={m}>{toHHMM(m)}</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-600">
                    Duration: {Math.max(0, Number(editDraft.endMin) - Number(editDraft.startMin))} min
                  </div>

                  <div className="text-[11px] text-gray-500">
                    Estimated appointments: {estimateAppointments((Number(editDraft.endMin) - Number(editDraft.startMin)), editDraft.modality)}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        removeBlock(editDraft.id);
                        setSelectedId(null);
                        setEditDraft(null);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700"
                    >
                      Delete
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(null);
                          setEditDraft(null);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={applyEdit}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-900">Appointment duration</div>
              <div className="text-[11px] text-gray-500">New blocks default to the selected duration for the chosen type.</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Online</label>
                  <select
                    value={settings.durationOnline}
                    onChange={(e) => setSettings((p) => ({ ...p, durationOnline: Number(e.target.value) }))}
                    className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                  >
                    {[10, 15, 20, 25, 30, 40, 45, 60].map((v) => (
                      <option key={v} value={v}>{v} min</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">In-person</label>
                  <select
                    value={settings.durationInPerson}
                    onChange={(e) => setSettings((p) => ({ ...p, durationInPerson: Number(e.target.value) }))}
                    className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                  >
                    {[10, 15, 20, 25, 30, 40, 45, 60].map((v) => (
                      <option key={v} value={v}>{v} min</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Buffer between appointments</label>
                <select
                  value={settings.buffer}
                  onChange={(e) => setSettings((p) => ({ ...p, buffer: Number(e.target.value) }))}
                  className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                >
                  {[0, 5, 10, 15].map((v) => (
                    <option key={v} value={v}>{v} min</option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-500">This will be applied when backend generates slots.</p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="text-xs font-semibold text-gray-900 mb-2">Blocks summary</div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {DAYS.map((d) => {
                  const arr = blocksByDay.get(d.key) || [];
                  return (
                    <div key={d.key} className="text-[11px]">
                      <div className="font-semibold text-gray-700">{d.label}</div>
                      {arr.length === 0 ? (
                        <div className="text-gray-400">No blocks</div>
                      ) : (
                        <div className="mt-1 space-y-1">
                          {arr.map((b) => (
                            <div key={b.id} className="flex items-center justify-between gap-2">
                              <div className="truncate">
                                <span className="font-medium">{b.modality === 'in_person' ? 'In-person' : 'Online'}</span>
                                <span className="text-gray-500"> · {toHHMM(b.startMin)}-{toHHMM(b.endMin)}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeBlock(b.id)}
                                className="px-2 py-0.5 rounded border text-gray-700 hover:bg-gray-50"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setBlocks([])}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBlocks([]);
                    try { localStorage.removeItem(storageKey); } catch {}
                    setSavedAt(0);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 text-xs text-gray-600">
        <div className="font-semibold text-gray-900 mb-1">Next (backend)</div>
        <div>These blocks will later be converted to available slots (duration + buffer + existing bookings + time off).</div>
      </div>
    </div>
  );
}
