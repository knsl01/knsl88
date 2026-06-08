import React from "react";
import { LayoutDashboard, Scale, FileSignature, FileSearch, ScanLine } from "lucide-react";
import { MOBILE_NAV_ITEMS } from "../../app/navigation.js";

export function MobileTabBar({ active, setActive }) {
  const items = MOBILE_NAV_ITEMS;
  return (
    <nav className="mobile-tabbar">
      {items.map((it) => {
        const Icon = it.icon;
        const on = active === it.id;
        return (
          <button key={it.id} className={"mtab " + (on ? "active" : "")} onClick={() => setActive(it.id)} aria-label={it.label}>
            <Icon size={21} strokeWidth={on ? 2.1 : 1.7} />
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

