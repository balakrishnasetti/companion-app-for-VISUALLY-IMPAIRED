import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

export default function Brand({ compact = false }) {
  return (
    <Link className={`brand ${compact ? 'brand-compact' : ''}`} to="/" aria-label="BALA home">
      <span className="brand-mark" aria-hidden="true"><Eye size={22} strokeWidth={2} /></span>
      <span className="brand-name">bala<span className="brand-period">.</span></span>
    </Link>
  );
}
