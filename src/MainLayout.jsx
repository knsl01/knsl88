import React from 'react';

// 1. IMPORT SEMUA KOMPONEN PENDUKUNG (Wajib agar Vite tidak error)
import { IOSDevice } from './ios-frame';
import { Sidebar } from './sidebar';
import { OverviewScreen } from './screen-overview';
import { AnalysisScreen } from './screen-analysis';
import { DraftingScreen } from './screen-drafting';
import { ResearchScreen } from './screen-research';
import { ToolsScreen } from './screen-tools'; // Catatan: sesuaikan nama komponen atau file jika berbeda

// 2. TAMBAHKAN 'export default' DI DEPAN FUNGSI
export default function MainLayout() {
  const [active, setActive] = React.useState('overview');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const scrollRef = React.useRef(null);

  const go = (id) => {
    setActive(id);
    setMenuOpen(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const onMenu = () => setMenuOpen(true);
  const onBell = () => {};

  const screenProps = { onMenu, onBell, go };
  
  // Memetakan screen yang dipanggil oleh router
  const screens = {
    overview: <OverviewScreen {...screenProps} />,
    analysis: <AnalysisScreen {...screenProps} />,
    drafting: <DraftingScreen {...screenProps} />,
    research: <ResearchScreen {...screenProps} />,
    // Jika Claude memecah screen sisanya ke dalam sub-fitur, pastikan namanya cocok atau arahkan ke komponen yang ada
  };

  return (
    <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
      <IOSDevice dark>
        <div style={{ position: 'relative', height: '100%', overflow: 'hidden', background: '#0A0A0A' }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(130% 60% at 0% 0%, rgba(16,185,129,0.07), transparent 45%), radial-gradient(120% 60% at 100% 100%, rgba(212,175,55,0.05), transparent 50%)',
          }} />
          
          <div ref={scrollRef} className="knsl-scroll" key={active}
            style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
            {screens[active] || <OverviewScreen {...screenProps} />}
          </div>
          
          <Sidebar open={menuOpen} active={active} onSelect={go} onClose={() => setMenuOpen(false)} />
        </div>
      </IOSDevice>
    </div>
  );
}
