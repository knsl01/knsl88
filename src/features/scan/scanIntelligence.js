/**
 * AI document intelligence — classify, extract metadata, suggest next action.
 */

import { callLLM, parseAgentJson } from "../../knslAiAgent.js";
import { SCAN_INTEL_SYSTEM, SCAN_INTEL_SCHEMA } from "../../agents/prompts/index.js";

export const DOC_TYPE_ICONS = {
  kontrak: "📄",
  perjanjian: "📄",
  surat: "✉️",
  somasi: "⚠️",
  putusan: "⚖️",
  dakwaan: "📋",
  berita_acara: "📝",
  akta: "📜",
  lainnya: "📎",
};

export async function analyzeDocument(text, locale = "id") {
  const sample = String(text || "").slice(0, 12000);
  if (sample.trim().length < 40) {
    return {
      docType: "lainnya",
      docTypeLabel: locale === "en" ? "Unknown" : "Tidak diketahui",
      confidence: "low",
      title: null,
      parties: [],
      dates: [],
      referenceNumbers: [],
      summary: locale === "en" ? "Text too short for analysis." : "Teks terlalu pendek untuk dianalisa.",
      keyPoints: [],
      ocrQuality: "poor",
      recommendedAction: "none",
      recommendedActionReason: "",
    };
  }

  const langNote = locale === "en"
    ? "Respond with docTypeLabel, summary, keyPoints, and recommendedActionReason in English."
    : "Gunakan Bahasa Indonesia untuk docTypeLabel, summary, keyPoints, dan recommendedActionReason.";

  try {
    const raw = await callLLM({
      system: SCAN_INTEL_SYSTEM,
      user: `Skema:\n${SCAN_INTEL_SCHEMA}\n\n${langNote}\n\nTEKS OCR:\n${sample}`,
      maxTokens: 1800,
    });
    const parsed = parseAgentJson(raw);
    return {
      docType: parsed.docType || "lainnya",
      docTypeLabel: parsed.docTypeLabel || parsed.docType || "Dokumen",
      confidence: parsed.confidence || "medium",
      title: parsed.title || null,
      parties: Array.isArray(parsed.parties) ? parsed.parties.slice(0, 6) : [],
      dates: Array.isArray(parsed.dates) ? parsed.dates.slice(0, 6) : [],
      referenceNumbers: Array.isArray(parsed.referenceNumbers) ? parsed.referenceNumbers.slice(0, 6) : [],
      summary: parsed.summary || "",
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 6) : [],
      ocrQuality: parsed.ocrQuality || "fair",
      recommendedAction: parsed.recommendedAction || "none",
      recommendedActionReason: parsed.recommendedActionReason || "",
    };
  } catch {
    return heuristicAnalyze(sample, locale);
  }
}

function heuristicAnalyze(text, locale) {
  const t = text.toLowerCase();
  let docType = "lainnya";
  let recommendedAction = "analysis";
  if (/kontrak|perjanjian|pasal\s+\d|para\s+pihak|force majeure|wanprestasi/.test(t)) {
    docType = "kontrak";
    recommendedAction = "contract";
  } else if (/putusan|amar|majelis hakim|pengadilan/.test(t)) {
    docType = "putusan";
    recommendedAction = "analysis";
  } else if (/somasi|teguran|peringatan/.test(t)) {
    docType = "somasi";
    recommendedAction = "analysis";
  } else if (/berita acara|ba\s|rapat/.test(t)) {
    docType = "berita_acara";
  }

  const labels = {
    id: { kontrak: "Kontrak/Perjanjian", putusan: "Putusan Pengadilan", somasi: "Somasi", berita_acara: "Berita Acara", lainnya: "Dokumen Hukum" },
    en: { kontrak: "Contract/Agreement", putusan: "Court Decision", somasi: "Demand Letter", berita_acara: "Minutes/Report", lainnya: "Legal Document" },
  };
  const L = labels[locale === "en" ? "en" : "id"];

  return {
    docType,
    docTypeLabel: L[docType] || L.lainnya,
    confidence: "low",
    title: null,
    parties: [],
    dates: [],
    referenceNumbers: [],
    summary: locale === "en" ? "Heuristic classification (AI unavailable)." : "Klasifikasi heuristik (AI tidak tersedia).",
    keyPoints: [],
    ocrQuality: "fair",
    recommendedAction,
    recommendedActionReason: locale === "en" ? "Based on keyword detection." : "Berdasarkan deteksi kata kunci.",
  };
}
