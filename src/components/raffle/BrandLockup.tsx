import { motion } from 'framer-motion';
import csunCareerCenterLogo from '../../assets/csun-career-center-logo.png';
import { useBranding } from '../../hooks/useBranding';
import './BrandLockup.css';

interface BrandLockupProps {
  subdued?: boolean;
}

export function BrandLockup({ subdued = false }: BrandLockupProps) {
  const branding = useBranding();
  const logoSrc = branding.logoDataUrl ?? csunCareerCenterLogo;

  return (
    <motion.div
      className={`brand-lockup ${subdued ? 'brand-lockup--subdued' : ''}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <img
        className="brand-lockup__logo"
        src={logoSrc}
        alt={branding.logoAlt}
        width={640}
        height={120}
        decoding="async"
      />
    </motion.div>
  );
}
