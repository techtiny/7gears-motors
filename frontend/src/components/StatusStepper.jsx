const STEPS = [
  { key: 'RECEIVED',          label: 'Received' },
  { key: 'INSPECTING',        label: 'Inspecting' },
  { key: 'AWAITING_APPROVAL', label: 'Approval' },
  { key: 'IN_PROGRESS',       label: 'In Progress' },
  { key: 'QUALITY_CHECK',     label: 'QC' },
  { key: 'READY_FOR_PICKUP',  label: 'Ready' },
  { key: 'DELIVERED',         label: 'Delivered' },
];

export default function StatusStepper({ current }) {
  const currentIdx = STEPS.findIndex(s => s.key === current);
  return (
    <div className="stepper">
      {STEPS.map((step, idx) => {
        const done   = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step.key} className={`step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
            <div className="step-dot">
              {done ? '✓' : idx + 1}
            </div>
            <div className="step-line" />
            <div className="step-label">{step.label}</div>
          </div>
        );
      })}
    </div>
  );
}
