/* data.jsx — shared content: nav modules, analysis fixtures, pasal DB, doc types */

const MODULES = [
  { id: 'overview', icon: 'grid', name: 'Executive Overview', eyebrow: 'RINGKASAN PRAKTIK', sub: 'Dasbor Strategis' },
  { id: 'analysis', icon: 'scale', name: 'Legal Analysis Engine', eyebrow: 'ANALISA KASUS & EKSTRAKSI PASAL', sub: 'Analisa Kasus' },
  { id: 'drafting', icon: 'penEdit', name: 'Smart Drafting', eyebrow: 'DRAFTING & CONTRACT REDLINING', sub: 'Smart Drafting Studio' },
  { id: 'research', icon: 'book', name: 'Legal Research', eyebrow: 'RISET PASAL & BASIS UU', sub: 'Riset Pasal' },
  { id: 'scan', icon: 'scan', name: 'Pindai Dokumen', eyebrow: 'DIGITALKAN DOKUMEN \u2192 PDF / WORD', sub: 'OCR Dokumen' },
  { id: 'contract', icon: 'fileSearch', name: 'Contract Review AI', eyebrow: 'TINJAUAN KONTRAK \u2014 KLAUSUL, RISIKO', sub: 'Tinjauan Kontrak' },
  { id: 'conflict', icon: 'shield', name: 'Conflict Check', eyebrow: 'BENTURAN KEPENTINGAN', sub: 'Cek Benturan' },
];

// ── Legal Analysis Engine fixtures ──────────────────────────
const ANALYSIS_SUMMARY = { fakta: 7, isu: 4, pasal: 6, unsur: 10, invarian: '14/14', klasifikasi: 'PIDANA & PERDATA' };

const ANALYSIS_FACTS = [
  { id: 'fact_01', t: 'Korban Budi Santoso berada di warung kopi di Lowokwaru, Malang pada 12 April 2026 pukul 22.30 WIB.', tag: 'waktu & tempat' },
  { id: 'fact_02', t: 'Pelaku Andi Pratama memiliki riwayat sengketa utang piutang dengan korban.', tag: 'latar' },
  { id: 'fact_03', t: 'Sekitar pukul 23.00 terjadi adu mulut antara korban dan pelaku, dilerai oleh saksi.', tag: 'peristiwa' },
  { id: 'fact_05', t: 'Pelaku diduga menghadang korban di jalan sepi sekitar 30 menit kemudian.', tag: 'peristiwa' },
  { id: 'fact_06', t: 'Terjadi perkelahian yang mengakibatkan korban mengalami luka berat.', tag: 'akibat' },
  { id: 'fact_07', t: 'Korban dinyatakan meninggal dunia dalam perjalanan ke rumah sakit.', tag: 'akibat' },
];

const ANALYSIS_ISSUES = [
  { cls: 'CRIMINAL', stat: 'asserted', risk: 'High', t: 'Dugaan perbuatan yang mengakibatkan hilangnya nyawa orang lain', facts: 'fact_03, fact_06, fact_07' },
  { cls: 'CRIMINAL', stat: 'asserted', risk: 'Moderate-High', t: 'Dugaan penganiayaan / kekerasan terhadap orang', facts: 'fact_05' },
  { cls: 'CIVIL', stat: 'asserted', risk: 'Moderate', t: 'Sengketa keperdataan (utang / wanprestasi)', facts: 'fact_02' },
  { cls: 'CRIMINAL', stat: 'inferred', risk: 'Low', t: 'Dugaan perbuatan tidak menyenangkan / pengancaman', facts: 'fact_03' },
];

const ANALYSIS_PASAL = [
  { code: 'KUHP', no: '338', title: 'Pembunuhan', body: 'Barang siapa dengan sengaja merampas nyawa orang lain, diancam karena pembunuhan dengan pidana penjara paling lama lima belas tahun.', match: 96 },
  { code: 'KUHP', no: '351', title: 'Penganiayaan', body: 'Penganiayaan diancam dengan pidana penjara paling lama dua tahun delapan bulan atau pidana denda paling banyak\u2026', match: 88 },
  { code: 'KUHP', no: '170', title: 'Kekerasan terhadap orang di muka umum', body: 'Barang siapa di muka umum bersama-sama melakukan kekerasan terhadap orang atau barang\u2026', match: 71 },
  { code: 'KUHPerdata', no: '1365', title: 'Perbuatan Melawan Hukum', body: 'Tiap perbuatan melanggar hukum yang membawa kerugian kepada orang lain, mewajibkan orang\u2026 mengganti kerugian.', match: 64 },
];

const ANALYSIS_UNSUR = [
  { pasal: 'KUHP 338', items: [
    { u: 'Barang siapa (subjek hukum)', ok: true },
    { u: 'Dengan sengaja (kesengajaan)', ok: true },
    { u: 'Merampas nyawa orang lain', ok: true },
    { u: 'Direncanakan terlebih dahulu', ok: false, note: 'belum cukup bukti \u2192 lihat Ps. 340' },
  ] },
  { pasal: 'KUHP 351', items: [
    { u: 'Barang siapa', ok: true },
    { u: 'Perbuatan kekerasan / penganiayaan', ok: true },
    { u: 'Mengakibatkan luka / akibat', ok: true },
  ] },
];

// ── Legal Research pasal DB ─────────────────────────────────
const RESEARCH_FILTERS = ['Semua', 'KUHP', 'UU PT', 'UUD 1945', 'Pailit/PKPU', 'ITE', 'Arbitrase/P2SK', 'KUHAP/Rv'];

const RESEARCH_RESULTS = [
  { code: 'KUHP', no: '372', mirror: 'KUHP 2023: PS. 486', title: 'PENGGELAPAN', body: 'Barang siapa dengan sengaja dan melawan hukum memiliki barang sesuatu yang seluruhnya atau sebagian adalah kepunyaan orang lain, tetapi yang ada dalam kekuasaannya bukan karena kejahatan\u2026', match: 100 },
  { code: 'KUHP', no: '373', mirror: 'KUHP 2023: PS. 487', title: 'PENGGELAPAN RINGAN', body: 'Perbuatan yang dirumuskan dalam Pasal 372, apabila yang digelapkan bukan ternak dan harganya tidak lebih dari\u2026', match: 100 },
  { code: 'KUHP', no: '374', mirror: 'KUHP 2023: PS. 488', title: 'PENGGELAPAN DALAM JABATAN', body: 'Penggelapan yang dilakukan oleh orang yang penguasaannya terhadap barang disebabkan karena ada hubungan kerja\u2026', match: 94 },
  { code: 'UU PT', no: '97', mirror: 'UU 40/2007', title: 'TANGGUNG JAWAB DIREKSI', body: 'Direksi bertanggung jawab penuh atas pengurusan Perseroan untuk kepentingan Perseroan dan sesuai dengan maksud\u2026', match: 71 },
];

// ── Smart Drafting doc types ────────────────────────────────
const DOC_GROUPS = [
  { group: 'Litigasi', items: ['Gugatan', 'Jawaban Gugatan', 'Somasi', 'Surat Kuasa', 'Akta Perdamaian'] },
  { group: 'Kontrak', items: ['NDA (Kerahasiaan)', 'Perjanjian Kerja', 'PKS (Kerja Sama)', 'Kontrak Vendor', 'MoU (Nota Kesepahaman)'] },
  { group: 'Korporat', items: ['Akta Pendirian PT', 'RUPS / Risalah', 'Surat Keterangan', 'Legal Opinion'] },
  { group: 'Lainnya', items: ['Surat Pernyataan', 'Surat Pengunduran Diri'] },
];

Object.assign(window, {
  MODULES, ANALYSIS_SUMMARY, ANALYSIS_FACTS, ANALYSIS_ISSUES, ANALYSIS_PASAL,
  ANALYSIS_UNSUR, RESEARCH_FILTERS, RESEARCH_RESULTS, DOC_GROUPS,
});
