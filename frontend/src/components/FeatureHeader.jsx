import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function FeatureHeader({ eyebrow = 'BALA TOOLS', title, titleKey, description, icon: Icon }) {
  const { t } = useLanguage();
  return (
    <div className="feature-header">
      <Link to="/app" className="back-link"><ArrowLeft size={15} aria-hidden="true" />{t('backDashboard')}</Link>
      <div className="feature-title-row"><div className="feature-title-icon">{Icon && <Icon size={21} aria-hidden="true" />}</div><div><div className="overline"><span className="overline-line" />{eyebrow}</div><h1>{titleKey ? t(titleKey) : title}</h1><p>{description}</p></div></div>
    </div>
  );
}
