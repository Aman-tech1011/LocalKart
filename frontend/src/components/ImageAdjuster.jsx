import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CROP_RATIOS, MAX_ZOOM, MIN_ZOOM, cropRect, outputSize } from './imageCrop';
import './ImageAdjuster.css';

const PREVIEW_WIDTH = 900;

export default function ImageAdjuster({ file, onApply, onClose }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const [imageSize, setImageSize] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [view, setView] = useState({ ratioId: 'card', zoom: MIN_ZOOM, offsetX: 0, offsetY: 0 });

  const ratio = CROP_RATIOS.find((r) => r.id === view.ratioId) || CROP_RATIOS[0];
  const ratioValue = ratio.value || (imageSize ? imageSize.width / imageSize.height : 16 / 9);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => setLoadError('Could not read this photo. Try another file.');
    img.src = url;
    return () => {
      URL.revokeObjectURL(url);
      imageRef.current = null;
    };
  }, [file]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageSize) return;
    const rect = cropRect(imageSize.width, imageSize.height, ratio.value, view.zoom, view.offsetX, view.offsetY);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
  }, [imageSize, ratio.value, view]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const canvasHeight = Math.max(1, Math.round(PREVIEW_WIDTH / ratioValue));

  const handlePointerDown = (e) => {
    if (!imageSize) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas || !imageSize) return;
    const rect = cropRect(imageSize.width, imageSize.height, ratio.value, view.zoom, view.offsetX, view.offsetY);
    const scaleX = rect.width / canvas.getBoundingClientRect().width;
    const scaleY = rect.height / canvas.getBoundingClientRect().height;
    setView((v) => ({
      ...v,
      offsetX: v.offsetX - (e.clientX - drag.x) * scaleX,
      offsetY: v.offsetY - (e.clientY - drag.y) * scaleY,
    }));
    dragRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => { dragRef.current = null; };

  const pickRatio = (ratioId) => {
    setView({ ratioId, zoom: MIN_ZOOM, offsetX: 0, offsetY: 0 });
  };

  const handleApply = () => {
    const img = imageRef.current;
    if (!img || !imageSize || isApplying) return;
    setIsApplying(true);
    const rect = cropRect(imageSize.width, imageSize.height, ratio.value, view.zoom, view.offsetX, view.offsetY);
    const size = outputSize(rect.width, rect.height);
    const out = document.createElement('canvas');
    out.width = size.width;
    out.height = size.height;
    out.getContext('2d').drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, size.width, size.height);
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    out.toBlob((blob) => {
      setIsApplying(false);
      if (!blob) {
        setLoadError('Could not save this crop. Try again.');
        return;
      }
      onApply(new File([blob], file.name, { type }));
    }, type, 0.92);
  };

  return (
    <div className="image-adjuster-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Adjust photo">
      <div className="auth-card image-adjuster-card" onClick={(e) => e.stopPropagation()}>
        <h2>Adjust photo</h2>
        <p>Jo frame me dikh raha hai, wahi card me aayega. Photo ko drag karo, zoom karo, ratio chuno.</p>

        {loadError ? (
          <p className="form-message" role="status">{loadError}</p>
        ) : (
          <>
            <div className="image-adjuster-frame" style={{ aspectRatio: String(ratioValue) }}>
              <canvas
                ref={canvasRef}
                width={PREVIEW_WIDTH}
                height={canvasHeight}
                className="image-adjuster-canvas"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
              {!imageSize && <span className="image-adjuster-loading">Loading photo…</span>}
            </div>

            <div className="image-adjuster-ratios" role="group" aria-label="Photo ratio">
              {CROP_RATIOS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`ratio-btn${r.id === view.ratioId ? ' active' : ''}`}
                  onClick={() => pickRatio(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <label className="image-adjuster-zoom">
              Zoom
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step="0.05"
                value={view.zoom}
                onChange={(e) => setView((v) => ({ ...v, zoom: Number(e.target.value) }))}
              />
            </label>

            <div className="image-adjuster-actions">
              <button type="button" className="btn btn-light" onClick={() => setView((v) => ({ ...v, zoom: MIN_ZOOM, offsetX: 0, offsetY: 0 }))}>
                Reset
              </button>
              <button type="button" className="btn btn-light" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleApply} disabled={!imageSize || isApplying}>
                {isApplying ? 'Saving…' : 'Done — use this photo'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
