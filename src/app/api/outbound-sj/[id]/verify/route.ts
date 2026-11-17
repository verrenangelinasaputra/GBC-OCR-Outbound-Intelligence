import { jsonError, requireApiSession } from "@/lib/api/auth-context";
import {
  uploadOutboundRevisionSuratKeluarToDrive,
  uploadOutboundSkulSuratKeluarToDrive,
} from "@/lib/outbound-sj/drive-export";
import {
  applyOutboundSjLinePatches,
  approveOutboundSjAsSkul,
  getOutboundSjDocument,
  requestOutboundSjRevision,
} from "@/lib/outbound-sj/sheet-store";
import type { OutboundSjLinePatch } from "@/lib/outbound-sj/types";
import { hasPermission } from "@/lib/rbac/permissions";

function parsePatches(raw: unknown): OutboundSjLinePatch[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const o = item as Record<string, unknown>;
    return {
      lineIndex: Number(o.lineIndex ?? o.index ?? -1),
      unavailable: o.unavailable !== undefined ? Boolean(o.unavailable) : undefined,
      keterangan: o.keterangan !== undefined ? String(o.keterangan) : undefined,
    };
  });
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession();
    if (!hasPermission(session.roles, "outbound_sj", "APPROVE", session.allowedModules)) {
      return jsonError(new Error("FORBIDDEN"), 403);
    }
    const { id } = await ctx.params;
    const body = await request.json().catch(() => ({}));
    const decision = String(body.decision ?? "approve").trim().toLowerCase();

    const docBefore = await getOutboundSjDocument(id);
    if (!docBefore) return jsonError(new Error("Dokumen tidak ditemukan."), 404);

    if (decision === "approve") {
      const docForSkul = applyOutboundSjLinePatches(docBefore, parsePatches(body.lines));
      const drive = await uploadOutboundSkulSuratKeluarToDrive(docForSkul);
      const doc = await approveOutboundSjAsSkul(id, session.username, { skulDriveUrl: drive.fileUrl });
      return Response.json({ document: doc, drive, decision: "approve" });
    }

    if (decision === "revise") {
      const patches = parsePatches(body.lines);
      const nextSeq = (docBefore.revisionCount || 0) + 1;
      const patched = applyOutboundSjLinePatches(docBefore, patches);
      const drive = await uploadOutboundRevisionSuratKeluarToDrive(patched, nextSeq);
      const doc = await requestOutboundSjRevision(id, session.username, patches, {
        revisionDriveUrl: drive.fileUrl,
      });
      return Response.json({ document: doc, drive, decision: "revise", revisionSequence: nextSeq });
    }

    return jsonError(new Error("decision harus approve atau revise"), 400);
  } catch (e) {
    return jsonError(e);
  }
}