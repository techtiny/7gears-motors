import { useState, useRef } from 'react';
import { Upload, X, ZoomIn, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(images.length - 1, i + 1));

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }}>
      <button type="button" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontSize: 20 }}>✕</button>
      {idx > 0 && (
        <button type="button" onClick={e => { e.stopPropagation(); prev(); }}
          style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={24} />
        </button>
      )}
      <img src={images[idx].url} alt={images[idx].originalName || ''}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
      {idx < images.length - 1 && (
        <button type="button" onClick={e => { e.stopPropagation(); next(); }}
          style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={24} />
        </button>
      )}
      <div style={{ position: 'absolute', bottom: 16, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
        {idx + 1} / {images.length} · {images[idx].originalName}
      </div>
    </div>
  );
}

function UploadZone({ jobId, type, images, onUploaded, onDelete }) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox]   = useState(null);
  const inputRef = useRef(null);

  const label       = type === 'BEFORE' ? 'Before Service' : 'After Service';
  const accentColor = type === 'BEFORE' ? '#ef4444' : '#25D366';
  const bgColor     = type === 'BEFORE' ? '#fef2f2' : '#f0fdf4';

  const handleFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    let uploaded = 0;
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', type);
        await axios.post(`/api/jobs/${jobId}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploaded++;
      } catch (e) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setUploading(false);
    if (uploaded > 0) { toast.success(`${uploaded} image${uploaded > 1 ? 's' : ''} uploaded`); onUploaded(); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (img) => {
    if (!window.confirm('Remove this image?')) return;
    try {
      await axios.delete(`/api/jobs/${jobId}/images/${img.id}`);
      toast.success('Image removed');
      onDelete();
    } catch { toast.error('Failed to remove image'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: accentColor }} />
        <span style={{ fontWeight: 600, fontSize: 14, color: accentColor }}>{label}</span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>({images.length} photo{images.length !== 1 ? 's' : ''})</span>
      </div>

      {/* Upload zone */}
      <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${accentColor}40`, borderRadius: 10, padding: '16px',
          background: bgColor, cursor: 'pointer', textAlign: 'center',
          marginBottom: 12, transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = accentColor}
        onMouseLeave={e => e.currentTarget.style.borderColor = `${accentColor}40`}>
        <input ref={inputRef} type="file" multiple accept="image/*" capture="environment"
          style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
        {uploading ? (
          <div><div className="spinner" style={{ margin: '0 auto 6px' }} /><div style={{ fontSize: 12, color: '#6b7280' }}>Uploading...</div></div>
        ) : (
          <div>
            <Camera size={22} color={accentColor} style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: 13, fontWeight: 500, color: accentColor }}>
              {images.length === 0 ? `Add ${label} Photos` : 'Add More Photos'}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Click or drag • Camera supported on mobile</div>
          </div>
        )}
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
          {images.map((img, i) => (
            <div key={img.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', background: '#f3f4f6' }}>
              <img src={img.url + '/thumb'} alt={img.originalName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
                onError={e => { e.target.src = img.url; }}
                onClick={() => setLightbox(i)} />
              <button type="button" onClick={() => handleDelete(img)}
                style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={12} />
              </button>
              <div onClick={() => setLightbox(i)} style={{ position: 'absolute', bottom: 3, left: 3, background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: 4, padding: '1px 5px', fontSize: 9, cursor: 'zoom-in' }}>
                <ZoomIn size={9} style={{ display: 'inline', marginRight: 2 }} />View
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox !== null && (
        <Lightbox images={images} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

export default function ImageGallery({ jobId, onRefresh }) {
  const [beforeImages, setBeforeImages] = useState([]);
  const [afterImages,  setAfterImages]  = useState([]);
  const [loaded, setLoaded]             = useState(false);

  const load = async () => {
    try {
      const r = await axios.get(`/api/jobs/${jobId}/images`);
      const all = r.data.map(img => ({
        ...img,
        url: `/api/jobs/${jobId}/images/${img.fileName}`
      }));
      setBeforeImages(all.filter(i => i.imageType === 'BEFORE'));
      setAfterImages(all.filter(i => i.imageType === 'AFTER'));
      setLoaded(true);
    } catch { /* silent */ }
  };

  // Load on first render
  if (!loaded) load();

  const reload = () => { load(); if (onRefresh) onRefresh(); };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Camera size={18} color="#6b7280" />
        <h3 style={{ fontWeight: 600, fontSize: 15 }}>Vehicle Photos</h3>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>· {beforeImages.length + afterImages.length} total</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <UploadZone jobId={jobId} type="BEFORE" images={beforeImages} onUploaded={reload} onDelete={reload} />
        <UploadZone jobId={jobId} type="AFTER"  images={afterImages}  onUploaded={reload} onDelete={reload} />
      </div>

      {beforeImages.length > 0 && afterImages.length > 0 && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: 12, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
          ✅ Before &amp; after photos captured — ready to share with customer
        </div>
      )}
    </div>
  );
}
