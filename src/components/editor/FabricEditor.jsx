import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Image, Rect, FabricImage, Point, util } from 'fabric';
import {
  Upload,
  Crop,
  Check,
  X
} from 'lucide-react';

/**
 * Simple Fabric.js cropping editor component
 * - imageUrl: optional initial image to load
 * - onClose: callback when closing the editor
 * - onExport: callback when exporting the cropped image
 */
export default function FabricEditor({ imageUrl = '', width = 880, height = 500, onClose, onExport }) {
  const canvasElRef = useRef(null);
  const canvasRef = useRef(null);
  const [activeImg, setActiveImg] = useState(null);
  const cropRectRef = useRef(null);
  const [cropMode, setCropMode] = useState(false);
  const initializedRef = useRef(false);
  const lastImgRef = useRef(null);
  const imageLoadedRef = useRef('');

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

    const updateActiveImage = () => {
      const obj = canvas.getActiveObject();
      const img = obj instanceof FabricImage ? obj : null;
      setActiveImg(img);
      if (img) lastImgRef.current = img;
    };
    canvas.on('selection:created', updateActiveImage);
    canvas.on('selection:updated', updateActiveImage);
    canvas.on('selection:cleared', () => setActiveImg(null));

    return () => {
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
    });
  };

  const toggleCropMode = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    // aktif görsel yoksa, son kullanılan görseli aktif yap
    if (!activeImg && lastImgRef.current) {
      canvas.setActiveObject(lastImgRef.current);
      setActiveImg(lastImgRef.current);
    }
    if (!activeImg && !lastImgRef.current) return;
    if (!cropMode) {
      const rect = new Rect({ 
        left: (canvas.getWidth()/2)-100, 
        top: (canvas.getHeight()/2)-60, 
        width: 200, 
        height: 120, 
        fill: 'rgba(0,0,0,0.1)', 
        stroke: '#111827', 
        strokeDashArray: [6,4], 
        strokeWidth: 1, 
        hasRotatingPoint: false, 
        cornerColor: '#111827', 
        transparentCorners: false 
      });
      rect.setControlsVisibility({ mtr: false });
      cropRectRef.current = rect;
      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.requestRenderAll();
      setCropMode(true);
    } else {
      if (cropRectRef.current) { 
        canvas.remove(cropRectRef.current); 
        cropRectRef.current = null; 
      }
      setCropMode(false);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  };

  const applyCrop = () => {
    const canvas = canvasRef.current; 
    const img = activeImg || lastImgRef.current; 
    const rect = cropRectRef.current; 
    if (!canvas || !img || !rect) return;
    
    rect.setCoords();
    const m = img.calcTransformMatrix();
    const inv = util.invertTransform(m);
    const ac = rect.aCoords || { 
      tl: { x: rect.left, y: rect.top }, 
      tr: { x: rect.left + rect.width, y: rect.top }, 
      bl: { x: rect.left, y: rect.top + rect.height }, 
      br: { x: rect.left + rect.width, y: rect.top + rect.height } 
    };
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

    // Rasterize the cropped region and replace the image
    const el = img._element; // HTMLImageElement
    if (el && (el.naturalWidth || el.width)) {
      const off = document.createElement('canvas');
      const elW = el.naturalWidth || el.width; 
      const elH = el.naturalHeight || el.height;
      const facX = (img.width || 1) ? elW / (img.width) : 1;
      const facY = (img.height || 1) ? elH / (img.height) : 1;
      const srcX = Math.max(0, Math.floor(cropX * facX));
      const srcY = Math.max(0, Math.floor(cropY * facY));
      const srcW = Math.max(1, Math.floor(newW * facX));
      const srcH = Math.max(1, Math.floor(newH * facY));
      off.width = srcW; 
      off.height = srcH;
      const ctx = off.getContext('2d');
      try { 
        ctx.drawImage(el, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH); 
      } catch {}
      const dataUrl = off.toDataURL('image/png');

      const { left, top, scaleX, scaleY, angle, flipX, flipY, originX, originY } = img;
      Image.fromURL(dataUrl).then((newImg) => {
        newImg.set({ left, top, scaleX, scaleY, angle, flipX, flipY, originX, originY });
        canvas.remove(img);
        canvas.add(newImg);
        canvas.setActiveObject(newImg);
        lastImgRef.current = newImg;
        setActiveImg(newImg);
        canvas.requestRenderAll();
      }).catch(()=>{
        // fallback to crop props
        img.set({ cropX, cropY, width: newW, height: newH });
        canvas.requestRenderAll();
      });
    } else {
      // Fallback to crop props if element not ready
      img.set({ cropX, cropY, width: newW, height: newH });
      canvas.requestRenderAll();
    }

    canvas.remove(rect); 
    cropRectRef.current = null; 
    setCropMode(false);
  };

  const saveToParent = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const data = canvas.toDataURL({ format: 'png', multiplier: 1 });
    onExport?.(data);
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-3">
      <div className="flex">
        {/* Left vertical toolbar */}
        <div className="w-16 md:w-20 bg-white border rounded-xl p-2 md:p-3 mr-3 flex-shrink-0 overflow-y-auto" style={{ maxHeight: height }}>
          <div className="flex flex-col items-center gap-2 md:gap-3">
            <label className="w-9 h-9 flex items-center justify-center rounded-lg border hover:bg-gray-50 cursor-pointer" title="Resim Yükle">
              <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f = e.target.files?.[0]; if (f) onPickImage(f); }} />
              <Upload className="w-4 h-4 text-gray-700" />
            </label>
            <div className="w-full h-px bg-gray-200 my-1" />
            <button 
              className={`w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 ${cropMode ? 'bg-amber-50 border-amber-300' : ''}`} 
              onClick={toggleCropMode} 
              disabled={!activeImg && !lastImgRef.current} 
              title="Kırpma"
            >
              <Crop className="w-5 h-5 text-gray-700" />
            </button>
            <button 
              className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50 disabled:opacity-40" 
              onClick={applyCrop} 
              disabled={!cropMode} 
              title="Kırpmayı Uygula"
            >
              <Check className="w-5 h-5 text-teal-600" />
            </button>
            <div className="w-full h-px bg-gray-200 my-1" />
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-blue-50" onClick={saveToParent} title="Kaydet">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-50" onClick={onClose} title="Kapat">
              <X className="w-5 h-5 text-gray-700" />
            </button>
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