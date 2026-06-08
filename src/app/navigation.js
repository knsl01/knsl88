import {
  LayoutDashboard, Scale, FileSignature, BookOpen, ShieldCheck,
  FileSearch, ScanLine, User,
} from "lucide-react";
import { getHariTanggal } from "./utils.js";

export const NAV_ITEMS = [
  { id: "dashboard", label: "Executive Overview", icon: LayoutDashboard },
  { id: "analysis", label: "Legal Analysis Engine", icon: Scale },
  { id: "drafting", label: "Smart Drafting", icon: FileSignature },
  { id: "research", label: "Legal Research", icon: BookOpen },
  { id: "scan", label: "Pindai Dokumen", icon: ScanLine },
  { id: "contract", label: "Contract Review AI", icon: FileSearch },
  { id: "conflict", label: "Conflict Check", icon: ShieldCheck },
  { id: "profile", label: "Profil Akun", icon: User },
];

export const MOBILE_NAV_ITEMS = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "analysis", label: "Analisa", icon: Scale },
  { id: "drafting", label: "Drafting", icon: FileSignature },
  { id: "contract", label: "Kontrak", icon: FileSearch },
  { id: "scan", label: "Pindai", icon: ScanLine },
];

export function getPageMeta(active) {
  const meta = {
    dashboard: ["Executive Overview", "Dasbor · " + getHariTanggal()],
    analysis: ["Legal Analysis Engine", "Analisa Kasus & Ekstraksi Pasal"],
    drafting: ["Smart Drafting Studio", "Drafting & Contract Redlining"],
    research: ["Legal Research", "Riset Pasal & Basis UU"],
    contract: ["Contract Review AI", "Tinjauan Kontrak — Klausul, Risiko & Laporan"],
    scan: ["Pindai Dokumen", "Digitalkan dokumen → PDF / Word → kirim ke fitur lain"],
    conflict: ["Conflict Check", "Pemeriksaan Benturan Kepentingan"],
    profile: ["Profil Akun", "Data pengguna & keamanan"],
  };
  return meta[active] || ["KNSL", ""];
}
