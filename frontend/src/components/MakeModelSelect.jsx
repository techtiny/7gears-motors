import { useState, useRef, useEffect } from 'react';
import { INDIAN_CARS, CAR_MAKES } from '../data/indianCars';

function Autocomplete({ value, onChange, options, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => { setInput(value || ''); }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = input.trim()
    ? options.filter(o => o.toLowerCase().includes(input.toLowerCase()))
    : options;

  const select = (val) => {
    setInput(val);
    onChange(val);
    setOpen(false);
  };

  const handleChange = (e) => {
    setInput(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="form-control"
        value={input}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
          background: 'white', border: '1px solid #e5e7eb', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: 220,
          overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none',
        }}>
          {filtered.map(opt => (
            <li key={opt}
              onMouseDown={() => select(opt)}
              style={{
                padding: '9px 14px', cursor: 'pointer', fontSize: 13,
                borderBottom: '1px solid #f3f4f6',
                background: opt === value ? '#eff6ff' : 'white',
                color: '#111827',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = opt === value ? '#eff6ff' : 'white'}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MakeModelSelect({ make, model, onMakeChange, onModelChange }) {
  const modelOptions = make && INDIAN_CARS[make] ? INDIAN_CARS[make] : [];

  const handleMakeChange = (val) => {
    onMakeChange(val);
    if (INDIAN_CARS[val]) {
      onModelChange('');
    }
  };

  return (
    <div className="form-row">
      <div className="form-group">
        <label className="form-label">Make *</label>
        <Autocomplete
          value={make}
          onChange={handleMakeChange}
          options={CAR_MAKES}
          placeholder="Maruti Suzuki, Honda..."
        />
      </div>
      <div className="form-group">
        <label className="form-label">Model *</label>
        <Autocomplete
          value={model}
          onChange={onModelChange}
          options={modelOptions.length > 0 ? modelOptions : []}
          placeholder={make ? 'Select or type model...' : 'Select make first'}
        />
      </div>
    </div>
  );
}
