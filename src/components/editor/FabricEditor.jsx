import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Image, IText, Rect, Circle, FabricImage, PencilBrush, filters, Point, util } from 'fabric';
import {
  Upload,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Type as TypeIcon,
  Bold,
  Italic,
  Square,
  Circle as CircleIcon,
  Eraser,
  Pencil,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ZoomIn,
  ZoomOut,
  Crop,
  Check,
  Trash2,
  Save,
  Download as DownloadIcon,
  X,
  SlidersHorizontal
} from 'lucide-react';

/**
 * Lightweight Fabric.js editor component
 * - imageUrl: optional initial image to load
 * - onClose: callback when closing the editor
 */
export default function FabricEditor({ imageUrl = '', width = 880, height = 500, onClose, onExport }) {
  const canvasElRef = useRef(null);
  const canvasRef = useRef(null);
  const [activeImg, setActiveImg] = useState(null);
  const cropRectRef = useRef(null);
  const [cropMode, setCropMode] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#111827');
  const [brushWidth, setBrushWidth] = useState(4);
  const [zoom, setZoom] = useState(1);
  const historyRef = useRef({ stack: [], index: -1 });
  const restoringRef = useRef(false);
  const lastJsonRef = useRef('');
  const [textSize, setTextSize] = useState(28);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const [eraseWidth, setEraseWidth] = useState(20);
  const initializedRef = useRef(false); // avoid double init in React StrictMode
  const eraseModeRef = useRef(false);
  useEffect(()=>{ eraseModeRef.current = eraseMode; }, [eraseMode]);
  const lastImgRef = useRef(null);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'draw' | 'filters' | 'history' | 'export'
  const [historyTick, setHistoryTick] = useState(0); // force re-render when history changes
  const imageLoadedRef = useRef(''); // track last loaded imageUrl to avoid duplicate add
  const [canUndoState, setCanUndoState] = useState(false);
  const [canRedoState, setCanRedoState] = useState(false);
  const [historyInfo, setHistoryInfo] = useState({ index: 0, length: 0 });

  const syncHistoryState = () => {
    const h = historyRef.current;
    setCanUndoState(h.index > 0);
    setCanRedoState(h.index < h.stack.length - 1);
    setHistoryInfo({ index: Math.max(0, h.index), length: h.stack.length });
  };

  // initialize fabric canvas
  useEffect(() => {
    if (!canvasElRef.current) return;
    if (initializedRef.current) return; // StrictMode guard
    initializedRef.current = true;
    const canvas = new Canvas(canvasElRef.current, {
      width,
      height,
      backgroundColor: '#fff',
      preserveObjectStacking: true,
      selection: true,
    });
    canvasRef.current = canvas;

    const onKey = (e) => {
      // Undo/Redo shortcuts
      if (e.ctrlKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo(); return; }
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))) { e.preventDefault(); redo(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = canvas.getActiveObjects();
        active.forEach((obj) => canvas.remove(obj));
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        captureSnapshot();
      }
    };
    document.addEventListener('keydown', onKey);

    const updateActiveImage = () => {
      const obj = canvas.getActiveObject();
      const img = obj instanceof FabricImage ? obj : null;
      setActiveImg(img);
      if (img) lastImgRef.current = img;
    };
    canvas.on('selection:created', updateActiveImage);
    canvas.on('selection:updated', updateActiveImage);
    canvas.on('selection:cleared', () => setActiveImg(null));

    // history events
    const onChange = () => { if (!restoringRef.current) captureSnapshot(); };
    const onPathCreated = (e) => {
      const path = e?.path;
      if (!path) return;
      if (eraseModeRef.current) {
        // erase by drawing with destination-out
        path.globalCompositeOperation = 'destination-out';
        path.selectable = false;
      }
      captureSnapshot();
    };
    canvas.on('object:modified', onChange);
    canvas.on('object:added', onChange);
    canvas.on('object:removed', onChange);
    canvas.on('path:created', onPathCreated);

    // push initial empty state
    pushHistory();

    return () => {
      document.removeEventListener('keydown', onKey);
      canvas.off('object:modified', onChange);
      canvas.off('object:added', onChange);
      canvas.off('object:removed', onChange);
      canvas.off('path:created', onPathCreated);
      canvas.dispose();
      canvasRef.current = null;
      initializedRef.current = false;
    };
  }, [width, height]);

  // load initial image if provided
  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;
    if (imageLoadedRef.current === imageUrl) return; // prevent duplicate in StrictMode
    imageLoadedRef.current = imageUrl;
    const url = imageUrl;
    Image.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
      fitImageToCanvas(img);
      const c = canvasRef.current; if (!c) return;
      c.add(img);
      c.setActiveObject(img);
      lastImgRef.current = img;
      setActiveImg(img);
      c.requestRenderAll();
      pushHistory();
    });
  }, [imageUrl]);

  const fitImageToCanvas = (img) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();
    const iw = img.width || 1;
    const ih = img.height || 1;
    const scale = Math.min(cw / iw, ch / ih);
    img.set({
      left: cw / 2,
      top: ch / 2,
      originX: 'center',
      originY: 'center',
      angle: 0,
      scaleX: scale,
      scaleY: scale,
    });
  };

  const onPickImage = (file) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = URL.createObjectURL(file);
    Image.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
      fitImageToCanvas(img);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      // URL.revokeObjectURL(url); // revoke ETME: history undo/redo sırasında src'ye yeniden ihtiyaç duyulur
      pushHistory();
    });
  };

  // Removed explicit scale buttons to avoid UX karışıklığı; obje köşelerinden ölçeklenebilir

  const rotate90 = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeImg) return;
    activeImg.rotate(((activeImg.angle || 0) + 90) % 360);
    canvas.requestRenderAll();
    captureSnapshot();
  };

  const addText = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const text = new IText('Yeni Metin', {
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      originX: 'center', originY: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#111827', fontSize: textSize,
      fontWeight: textBold ? 'bold' : 'normal',
      fontStyle: textItalic ? 'italic' : 'normal',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    pushHistory();
  };

  // Text style changes apply to currently selected IText only
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const obj = c.getActiveObject();
    if (obj && obj.type === 'i-text') {
      obj.set({ fontSize: textSize, fontWeight: textBold ? 'bold' : 'normal', fontStyle: textItalic ? 'italic' : 'normal' });
      c.requestRenderAll();
    }
    // do not create text when none is selected
  }, [textSize, textBold, textItalic]);

  const addRect = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = new Rect({ left: 80, top: 80, width: 160, height: 100, fill: 'rgba(59,130,246,0.15)', stroke: '#2563eb', strokeWidth: 2, rx: 8, ry: 8 });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();
    pushHistory();
  };

  const addCircle = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const circle = new Circle({ left: 140, top: 140, radius: 60, fill: 'rgba(16,185,129,0.15)', stroke: '#10b981', strokeWidth: 2 });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.requestRenderAll();
    pushHistory();
  };

  const removeSelected = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const active = canvas.getActiveObjects();
    active.forEach((o) => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    pushHistory();
  };

  const bringForward = () => { const c = canvasRef.current; const o = c?.getActiveObject(); if (c && o) { c.bringObjectForward(o); c.requestRenderAll(); } };
  const sendBackward = () => { const c = canvasRef.current; const o = c?.getActiveObject(); if (c && o) { c.sendObjectBackwards(o); c.requestRenderAll(); } };

  const toggleCropMode = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    // aktif görsel yoksa, son kullanılan görseli aktif yap
    if (!activeImg && lastImgRef.current) {
      canvas.setActiveObject(lastImgRef.current);
      setActiveImg(lastImgRef.current);
    }
    if (!activeImg && !lastImgRef.current) return;
    if (!cropMode) {
      const rect = new Rect({ left: (canvas.getWidth()/2)-100, top: (canvas.getHeight()/2)-60, width: 200, height: 120, fill: 'rgba(0,0,0,0.1)', stroke: '#111827', strokeDashArray: [6,4], strokeWidth: 1, hasRotatingPoint: false, cornerColor: '#111827', transparentCorners: false });
      rect.setControlsVisibility({ mtr: false });
      cropRectRef.current = rect;
      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.requestRenderAll();
      setCropMode(true);
    } else {
      if (cropRectRef.current) { canvas.remove(cropRectRef.current); cropRectRef.current = null; }
      setCropMode(false);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  };

  const applyCrop = () => {
    const canvas = canvasRef.current; const img = activeImg || lastImgRef.current; const rect = cropRectRef.current; if (!canvas || !img || !rect) return;
    rect.setCoords();
    const m = img.calcTransformMatrix();
    const inv = util.invertTransform(m);
    const ac = rect.aCoords || { tl: { x: rect.left, y: rect.top }, tr: { x: rect.left + rect.width, y: rect.top }, bl: { x: rect.left, y: rect.top + rect.height }, br: { x: rect.left + rect.width, y: rect.top + rect.height } };
    const pts = ['tl','tr','bl','br'].map(k => util.transformPoint(new Point(ac[k].x, ac[k].y), inv));
    const xs = pts.map(p=>p.x), ys = pts.map(p=>p.y);
    const minX = Math.max(0, Math.min(...xs));
    const minY = Math.max(0, Math.min(...ys));
    const maxX = Math.min((img.width || 0), Math.max(...xs));
    const maxY = Math.min((img.height || 0), Math.max(...ys));
    const cropX = Math.floor(minX);
    const cropY = Math.floor(minY);
    const newW = Math.max(1, Math.floor(maxX - minX));
    const newH = Math.max(1, Math.floor(maxY - minY));

    // Rasterize the cropped region and replace the image (more predictable visually)
    const el = img._element; // HTMLImageElement
    if (el && (el.naturalWidth || el.width)) {
      const off = document.createElement('canvas');
      const elW = el.naturalWidth || el.width; const elH = el.naturalHeight || el.height;
      const facX = (img.width || 1) ? elW / (img.width) : 1;
      const facY = (img.height || 1) ? elH / (img.height) : 1;
      const srcX = Math.max(0, Math.floor(cropX * facX));
      const srcY = Math.max(0, Math.floor(cropY * facY));
      const srcW = Math.max(1, Math.floor(newW * facX));
      const srcH = Math.max(1, Math.floor(newH * facY));
      off.width = srcW; off.height = srcH;
      const ctx = off.getContext('2d');
      try { ctx.drawImage(el, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH); } catch {}
      const dataUrl = off.toDataURL('image/png');

      const { left, top, scaleX, scaleY, angle, flipX, flipY, originX, originY } = img;
      const idx = canvas.getObjects().indexOf(img);
      Image.fromURL(dataUrl).then((newImg) => {
        newImg.set({ left, top, scaleX, scaleY, angle, flipX, flipY, originX, originY });
        canvas.remove(img);
        canvas.add(newImg);
        canvas.setActiveObject(newImg);
        lastImgRef.current = newImg;
        setActiveImg(newImg);
        canvas.requestRenderAll();
        captureSnapshot();
      }).catch(()=>{
        // fallback to crop props
        img.set({ cropX, cropY, width: newW, height: newH });
        canvas.requestRenderAll();
        captureSnapshot();
      });
    } else {
      // Fallback to crop props if element not ready
      img.set({ cropX, cropY, width: newW, height: newH });
      canvas.requestRenderAll();
      captureSnapshot();
    }

    canvas.remove(rect); cropRectRef.current = null; setCropMode(false);
  };

  const downloadPNG = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const data = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const a = document.createElement('a'); a.href = data; a.download = 'edited.png'; a.click();
  };
  const saveToParent = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const data = canvas.toDataURL({ format: 'png', multiplier: 1 });
    onExport?.(data);
  };

  // --- Extra tools ---
  const toggleDraw = () => {
    const c = canvasRef.current; if (!c) return;
    const next = !drawMode;
    setDrawMode(next);
    setEraseMode(false);
    c.isDrawingMode = next;
    if (next) {
      const brush = new PencilBrush(c);
      brush.color = brushColor;
      brush.width = brushWidth;
      c.freeDrawingBrush = brush;
    }
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c || !c.isDrawingMode || !c.freeDrawingBrush) return;
    c.freeDrawingBrush.color = brushColor;
    c.freeDrawingBrush.width = brushWidth;
  }, [brushColor, brushWidth]);

  const toggleErase = () => {
    const c = canvasRef.current; if (!c) return;
    const next = !eraseMode;
    setEraseMode(next);
    setDrawMode(false);
    c.isDrawingMode = next;
    if (next) {
      // Use PencilBrush; actual erasing is applied in path:created by destination-out
      const e = new PencilBrush(c);
      e.width = eraseWidth;
      e.color = '#000000';
      c.freeDrawingBrush = e;
    }
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c || !c.isDrawingMode || !c.freeDrawingBrush) return;
    // update brush widths/colors
    if (eraseMode) c.freeDrawingBrush.width = eraseWidth;
  }, [eraseMode, eraseWidth]);

  const flipH = () => {
    const c = canvasRef.current; const o = c?.getActiveObject(); if (!c || !o) return;
    o.set('flipX', !o.flipX);
    c.requestRenderAll(); pushHistory();
  };
  const flipV = () => {
    const c = canvasRef.current; const o = c?.getActiveObject(); if (!c || !o) return;
    o.set('flipY', !o.flipY);
    c.requestRenderAll(); pushHistory();
  };

  const setOpacity = (val) => {
    const c = canvasRef.current; const o = c?.getActiveObject(); if (!c || !o) return;
    o.set('opacity', val);
    c.requestRenderAll(); pushHistory();
  };

  const isImageElementReady = (img) => {
    const el = img?._element;
    return !!(img && el && (el.naturalWidth || el.width));
  };
  const currentImg = () => activeImg || lastImgRef.current || null;
  const hasImg = () => !!currentImg();
  const applyGrayscale = () => {
    const img = currentImg();
    if (!img || !isImageElementReady(img)) return;
    img.filters = [...(img.filters || []), new filters.Grayscale()];
    img.applyFilters();
    canvasRef.current.requestRenderAll(); pushHistory();
  };
  const applySepia = () => {
    const img = currentImg();
    if (!img || !isImageElementReady(img)) return;
    img.filters = [...(img.filters || []), new filters.Sepia()];
    img.applyFilters();
    canvasRef.current.requestRenderAll(); pushHistory();
  };
  const clearFilters = () => {
    const img = currentImg();
    if (!img || !isImageElementReady(img)) return;
    img.filters = [];
    img.applyFilters();
    canvasRef.current.requestRenderAll(); pushHistory();
  };

  const doZoom = (factor) => {
    const c = canvasRef.current; if (!c) return;
    const next = Math.min(4, Math.max(0.25, zoom * factor));
    setZoom(next);
    c.setZoom(next);
    c.requestRenderAll();
  };

  // history helpers
  const pushHistory = () => {
    const c = canvasRef.current; if (!c) return;
    let jsonStr = '';
    try {
      // Always use toJSON so image src and other assets are preserved in history
      jsonStr = JSON.stringify(c.toJSON());
    } catch {
      return;
    }
    if (jsonStr === lastJsonRef.current) return; // dedupe
    lastJsonRef.current = jsonStr;
    const json = JSON.parse(jsonStr);
    const h = historyRef.current;
    const newStack = h.stack.slice(0, h.index + 1);
    newStack.push(json);
    historyRef.current = { stack: newStack.slice(-40), index: Math.min(newStack.length - 1, 39) };
    setHistoryTick((t)=>t+1);
    syncHistoryState();
  };

  const captureSnapshot = () => {
    if (restoringRef.current) return;
    // capture on next animation frame after fabric applies changes
    requestAnimationFrame(() => {
      if (restoringRef.current) return;
      pushHistory();
    });
  };
  const undo = () => {
    const c = canvasRef.current; const h = historyRef.current; if (!c || h.index <= 0) return;
    h.index -= 1;
    restoringRef.current = true;
    c.loadFromJSON(h.stack[h.index], () => {
      restoringRef.current = false;
      const firstImg = (c.getObjects() || []).find(o => o.type === 'image');
      if (firstImg) {
        c.setActiveObject(firstImg);
        lastImgRef.current = firstImg;
        setActiveImg(firstImg);
      } else {
        setActiveImg(null);
      }
      c.requestRenderAll(); setHistoryTick((t)=>t+1); syncHistoryState();
    });
  };
  const redo = () => {
    const c = canvasRef.current; const h = historyRef.current; if (!c || h.index >= h.stack.length - 1) return;
    h.index += 1;
    restoringRef.current = true;
    c.loadFromJSON(h.stack[h.index], () => {
      restoringRef.current = false;
      // rebind active image after restore
      const firstImg = (c.getObjects() || []).find(o => o.type === 'image');
      if (firstImg) {
        c.setActiveObject(firstImg);
        lastImgRef.current = firstImg;
        setActiveImg(firstImg);
      } else {
        setActiveImg(null);
      }
      c.requestRenderAll();
      setHistoryTick((t)=>t+1);
      syncHistoryState();
    });
  };

  const canUndo = canUndoState;
  const canRedo = canRedoState;

  return (
    <div className="bg-white rounded-xl border shadow-sm p-3">
      {/* Tabs Header */}
      <div className="mb-3">
        <div className="inline-flex rounded-lg border bg-white p-1 text-sm">
          <button
            className={`px-3 py-1.5 rounded-md ${activeTab==='edit' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('edit')}
            type="button"
          >Edit</button>
          <button
            className={`px-3 py-1.5 rounded-md ${activeTab==='draw' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('draw')}
            type="button"
          >Draw</button>
          <button
            className={`px-3 py-1.5 rounded-md ${activeTab==='filters' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('filters')}
            type="button"
          >Filters</button>
          <button
            className={`px-3 py-1.5 rounded-md ${activeTab==='history' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('history')}
            type="button"
          >History</button>
          <button
            className={`px-3 py-1.5 rounded-md ${activeTab==='export' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('export')}
            type="button"
          >Export</button>
        </div>
      </div>
      <div className="flex">
        {/* Left vertical toolbar */}
        <div className="w-16 md:w-20 bg-white border rounded-xl p-2 md:p-3 mr-3 flex-shrink-0 overflow-y-auto" style={{ maxHeight: height }}>
          <div className="flex flex-col items-center gap-2 md:gap-3">
            {/* Edit Tab */}
            {activeTab === 'edit' && (
              <>
                <label className="w-9 h-9 flex items-center justify-center rounded-lg border hover:bg-gray-50 cursor-pointer" title="Resim Yükle">
                  <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f = e.target.files?.[0]; if (f) onPickImage(f); }} />
                  <Upload className="w-4 h-4 text-gray-700" />
                </label>
                <div className="w-full h-px bg-gray-200 my-1" />
                <button className="w-9 h-9 flex items-center justify-center rounded-lg border hover:bg-gray-50" onClick={rotate90} title="90° Döndür">
                  <RotateCw className="w-4 h-4 text-gray-700" />
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded-lg border hover:bg-gray-50" onClick={flipH} title="Yatay Çevir">
                  <FlipHorizontal className="w-4 h-4 text-gray-700" />
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded-lg border hover:bg-gray-50" onClick={flipV} title="Dikey Çevir">
                  <FlipVertical className="w-4 h-4 text-gray-700" />
                </button>
                <div className="w-full h-px bg-gray-200 my-1" />
                <button className="w-9 h-9 flex items-center justify-center rounded-lg border hover:bg-gray-50" onClick={addText} title="Yazı Ekle">
                  <TypeIcon className="w-4 h-4 text-gray-700" />
                </button>
                <div className="w-10 text-center">
                  <input type="number" className="w-full text-center border rounded-md text-[11px] py-0.5" value={textSize} onChange={(e)=>setTextSize(Number(e.target.value)||12)} title="Yazı Boyutu" />
                </div>
                <button className={`w-9 h-9 flex items-center justify-center rounded-lg border hover:bg-gray-50 ${textBold? 'bg-gray-800 text-white' : ''}`} onClick={()=>setTextBold(v=>!v)} title="Kalın">
                  <Bold className={`w-4 h-4 ${textBold? 'text-white' : 'text-gray-700'}`} />
                </button>
                <button className={`w-9 h-9 flex items-center justify-center rounded-lg border hover:bg-gray-50 ${textItalic? 'bg-gray-800 text-white' : ''}`} onClick={()=>setTextItalic(v=>!v)} title="İtalik">
                  <Italic className={`w-4 h-4 ${textItalic? 'text-white' : 'text-gray-700'}`} />
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded-lg border hover:bg-gray-50" onClick={addRect} title="Kare">
                  <Square className="w-4 h-4 text-gray-700" />
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded-lg border hover:bg-gray-50" onClick={addCircle} title="Daire">
                  <CircleIcon className="w-4 h-4 text-gray-700" />
                </button>
                <div className="w-full h-px bg-gray-200 my-1" />
                <button className={`w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 ${cropMode ? 'bg-amber-50 border-amber-300' : ''}`} onClick={toggleCropMode} disabled={!activeImg && !lastImgRef.current} title="Kırpma">
                  <Crop className="w-5 h-5 text-gray-700" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 disabled:opacity-40" onClick={applyCrop} disabled={!cropMode} title="Kırpmayı Uygula">
                  <Check className="w-5 h-5 text-teal-600" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-rose-50" onClick={removeSelected} title="Seçileni Sil">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </button>
              </>
            )}

            {/* Draw Tab */}
            {activeTab === 'draw' && (
              <>
                <button className={`w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 ${drawMode? 'bg-teal-600 text-white' : ''}`} onClick={toggleDraw} title="Kalem">
                  <Pencil className={`w-5 h-5 ${drawMode? 'text-white' : 'text-gray-700'}`} />
                </button>
                <input type="color" value={brushColor} onChange={(e)=>setBrushColor(e.target.value)} title="Fırça Rengi" className="w-10 h-6 p-0 border rounded" />
                <input type="range" min="1" max="30" value={brushWidth} onChange={(e)=>setBrushWidth(Number(e.target.value))} title="Fırça Kalınlığı" className="w-10 rotate-[-90deg] origin-center" />
                <button className={`w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 ${eraseMode? 'bg-rose-600 text-white' : ''}`} onClick={toggleErase} title="Silgi">
                  <Eraser className={`w-5 h-5 ${eraseMode? 'text-white' : 'text-gray-700'}`} />
                </button>
                <input type="range" min="5" max="80" value={eraseWidth} onChange={(e)=>setEraseWidth(Number(e.target.value))} title="Silgi Kalınlığı" className="w-10 rotate-[-90deg] origin-center" />
              </>
            )}

            {/* Filters Tab */}
            {activeTab === 'filters' && (
              <>
                <div className="w-10 h-10 flex items-center justify-center rounded-lg border" title="Opaklık">
                  <SlidersHorizontal className="w-5 h-5 text-gray-700" />
                </div>
                <input type="range" min="0" max="1" step="0.05" onChange={(e)=>setOpacity(parseFloat(e.target.value))} defaultValue={1} title="Opaklık" className="w-10 rotate-[-90deg] origin-center" />
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 disabled:opacity-40" onClick={applyGrayscale} disabled={!hasImg()} title="Gri Filtre">
                  <span className="w-5 h-5 rounded-sm bg-gradient-to-br from-gray-300 to-gray-500" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 disabled:opacity-40" onClick={applySepia} disabled={!hasImg()} title="Sepya Filtre">
                  <span className="w-5 h-5 rounded-sm bg-gradient-to-br from-amber-200 to-amber-500" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 disabled:opacity-40" onClick={clearFilters} disabled={!hasImg()} title="Filtre Temizle">
                  <X className="w-5 h-5 text-gray-700" />
                </button>
                <div className="w-full h-px bg-gray-200 my-1" />
                {/* Crop controls also available under Filters tab as requested */}
                <button className={`w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 ${cropMode ? 'bg-amber-50 border-amber-300' : ''}`} onClick={toggleCropMode} disabled={!activeImg && !lastImgRef.current} title="Kırpma">
                  <Crop className="w-5 h-5 text-gray-700" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 disabled:opacity-40" onClick={applyCrop} disabled={!cropMode} title="Kırpmayı Uygula">
                  <Check className="w-5 h-5 text-teal-600" />
                </button>
              </>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <>
                <div className="w-10 text-center text-[10px] text-gray-500" title="History durumu">
                  {`${historyInfo.index + 1}/${historyInfo.length}`}
                </div>
                <button type="button" className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 disabled:opacity-40" onClick={(e)=>{ e.preventDefault(); undo(); }} disabled={!canUndo} title="Geri Al">
                  <UndoIcon className="w-5 h-5 text-gray-700" />
                </button>
                <button type="button" className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 disabled:opacity-40" onClick={(e)=>{ e.preventDefault(); redo(); }} disabled={!canRedo} title="İleri Al">
                  <RedoIcon className="w-5 h-5 text-gray-700" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-rose-50" onClick={removeSelected} title="Seçileni Sil">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50" onClick={()=>doZoom(1.1)} title="Yakınlaştır">
                  <ZoomIn className="w-5 h-5 text-gray-700" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50" onClick={()=>doZoom(0.9)} title="Uzaklaştır">
                  <ZoomOut className="w-5 h-5 text-gray-700" />
                </button>
              </>
            )}

            {/* Export Tab */}
            {activeTab === 'export' && (
              <>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-blue-50" onClick={saveToParent} title="Kaydet">
                  <Save className="w-5 h-5 text-blue-600" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50" onClick={downloadPNG} title="PNG İndir">
                  <DownloadIcon className="w-5 h-5 text-gray-700" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50" onClick={onClose} title="Kapat">
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right canvas area */}
        <div className="flex-1 border rounded-lg overflow-hidden bg-white min-h-[300px]">
          <canvas ref={canvasElRef} />
        </div>
      </div>
    </div>
  );
}
