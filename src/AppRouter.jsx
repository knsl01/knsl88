import React from 'react';
import KNSLLegalIntelligence from './KNSLLegalIntelligence.jsx';
import KNSLMobileApp from './KNSLMobileApp.jsx';

/**
 * AppRouter — renders the correct UI based on device + display mode.
 *
 * Rules:
 *  • PWA (add-to-home-screen / standalone) → always mobile design
 *  • Mobile UA + narrow screen (< 768px)    → mobile design
 *  • Everything else (desktop, tablet wide) → existing desktop app
 */
function useIsMobileOrPWA() {
  const [result, setResult] = React.useState(() => detect());
  React.useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const handler = () => setResult(detect());
    mq.addEventListener('change', handler);
    window.addEventListener('resize', handler);
    return () => {
      mq.removeEventListener('change', handler);
      window.removeEventListener('resize', handler);
    };
  }, []);
  return result;
}

function detect() {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  const isMobileUA = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isNarrow = window.innerWidth < 768;
  return isStandalone || (isMobileUA && isNarrow);
}

export default function AppRouter() {
  const isMobile = useIsMobileOrPWA();
  return isMobile ? <KNSLMobileApp /> : <KNSLLegalIntelligence />;
}
