import { SHARED_LEGAL_PRINCIPLES, JSON_OUTPUT_RULE } from "./shared.js";

export const SCAN_INTEL_SYSTEM = `Anda adalah agen analisa dokumen hukum Indonesia untuk firma hukum.

Tugas: dari teks hasil OCR, identifikasi jenis dokumen dan metadata kunci.

PRINSIP:
- OCR mungkin berisi kesalahan — inferensi hati-hati.
- Jangan memvonis atau memberi nasihat hukum.
- Jawab dalam bahasa yang sama dengan teks (Indonesia jika teks Indonesia).

${SHARED_LEGAL_PRINCIPLES}

${JSON_OUTPUT_RULE}`;

export const SCAN_INTEL_SCHEMA = `{
  "docType": "kontrak|surat|putusan|akta|dakwaan|berita_acara|perjanjian|somasi|lainnya",
  "docTypeLabel": "label singkat bahasa pengguna",
  "confidence": "high|medium|low",
  "title": "judul/perihal dokumen atau null",
  "parties": ["pihak 1", "pihak 2"],
  "dates": ["tanggal penting"],
  "referenceNumbers": ["nomor surat/perkara/kontrak"],
  "summary": "ringkasan 2-4 kalimat",
  "keyPoints": ["poin penting 1", "poin penting 2"],
  "ocrQuality": "good|fair|poor",
  "recommendedAction": "contract|analysis|research|none",
  "recommendedActionReason": "alasan singkat"
}`;
