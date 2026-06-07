/* app.jsx — KNSL shell: device frame, scroll area, overlay sidebar, screen router */

function KNSLApp() {
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
  const screens = {
    overview: <OverviewScreen {...screenProps} />,
    analysis: <AnalysisScreen {...screenProps} />,
    drafting: <DraftingScreen {...screenProps} />,
    research: <ResearchScreen {...screenProps} />,
    scan: <ScanScreen {...screenProps} />,
    contract: <ContractScreen {...screenProps} />,
    conflict: <ConflictScreen {...screenProps} />,
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <IOSDevice dark>
        <div style={{ position: 'relative', height: '100%', overflow: 'hidden', background: '#0A0A0A' }}>
          {/* ambient backdrop */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(130% 60% at 0% 0%, rgba(16,185,129,0.07), transparent 45%), radial-gradient(120% 60% at 100% 100%, rgba(212,175,55,0.05), transparent 50%)',
          }} />
          {/* scroll area */}
          <div ref={scrollRef} className="knsl-scroll" key={active}
            style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
            {screens[active]}
          </div>
          {/* sidebar overlay */}
          <Sidebar open={menuOpen} active={active} onSelect={go} onClose={() => setMenuOpen(false)} />
        </div>
      </IOSDevice>
    </div>
  );
}

Object.assign(window, { KNSLApp });
