const STATUS_MAP = {
  RECEIVED:          { label: 'Received',         cls: 'badge-received'   },
  INSPECTING:        { label: 'Inspecting',        cls: 'badge-inspecting' },
  AWAITING_APPROVAL: { label: 'Awaiting Approval', cls: 'badge-awaiting'   },
  IN_PROGRESS:       { label: 'In Progress',       cls: 'badge-inprogress' },
  QUALITY_CHECK:     { label: 'Quality Check',     cls: 'badge-quality'    },
  READY_FOR_PICKUP:  { label: 'Ready for Pickup',  cls: 'badge-ready'      },
  DELIVERED:         { label: 'Delivered',         cls: 'badge-delivered'  },
  CANCELLED:         { label: 'Cancelled',         cls: 'badge-cancelled'  },
};

export default function StatusBadge({ status }) {
  const info = STATUS_MAP[status] || { label: status, cls: 'badge-received' };
  return <span className={`badge ${info.cls}`}>{info.label}</span>;
}

export { STATUS_MAP };
