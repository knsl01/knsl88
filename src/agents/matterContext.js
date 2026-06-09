/**
 * MatterContext — konteks perkara bersama antar sub-agent.
 */

export function createMatterContext(initial = {}) {
  return {
    id: initial.id || `matter-${Date.now()}`,
    createdAt: new Date().toISOString(),
    title: initial.title || "",
    perspective: initial.perspective || "neutral",
    domainHints: initial.domainHints || [],
    chronology: initial.chronology || "",
    documents: initial.documents || [],
    intake: null,
    analysis: null,
    research: null,
    contract: null,
    drafting: null,
    memo: null,
    compliance: null,
    notes: initial.notes || [],
  };
}

export function mergeMatterContext(ctx, patch) {
  return { ...ctx, ...patch, updatedAt: new Date().toISOString() };
}

export function formatMatterForHandoff(ctx) {
  const parts = [];
  if (ctx.title) parts.push(`Judul matter: ${ctx.title}`);
  if (ctx.perspective) parts.push(`Perspektif: ${ctx.perspective}`);
  if (ctx.domainHints?.length) parts.push(`Domain: ${ctx.domainHints.join(", ")}`);
  if (ctx.chronology) parts.push(`Kronologi:\n${ctx.chronology.slice(0, 4000)}`);
  if (ctx.intake) parts.push(`Intake dokumen: ${JSON.stringify(ctx.intake).slice(0, 2000)}`);
  if (ctx.analysis) parts.push(`Hasil analisa: ${JSON.stringify(ctx.analysis).slice(0, 3000)}`);
  if (ctx.research) parts.push(`Riset: ${JSON.stringify(ctx.research).slice(0, 3000)}`);
  if (ctx.contract) parts.push(`Kontrak: ${JSON.stringify(ctx.contract).slice(0, 2000)}`);
  return parts.join("\n\n---\n\n");
}
