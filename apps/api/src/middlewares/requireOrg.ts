import { prisma } from "../config/prisma";
import type { AuthRequest } from "./auth";

/**
 * Mid-senior workspace security middleware
 * 
 * 1. x-org-id header'dan orgId alır (veya activeOrgId'den)
 * 2. Kullanıcının gerçekten o organization'a member olup olmadığını kontrol eder
 * 3. Member değilse 403 döner
 * 4. Member ise req.orgId'yi set eder
 */
export async function requireOrgAccess(req: AuthRequest, res: any, next: any) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ ok: false, error: "Unauthorized: userId missing" });
  }

  // 1) Önce header'dan orgId al
  let orgId = req.headers["x-org-id"] as string | undefined;

  // 2) Header yoksa activeOrgId'yi DB'den çek (bonus)
  if (!orgId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeOrgId: true },
    });
    orgId = user?.activeOrgId ?? undefined;
  }

  if (!orgId) {
    return res.status(400).json({
      ok: false,
      error: "Missing workspace selection. Please select a workspace (x-org-id header or active workspace).",
    });
  }

  // 3) Güvenlik kontrolü: Kullanıcı bu org'a gerçekten member mı?
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      orgId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!membership) {
    return res.status(403).json({
      ok: false,
      error: "Forbidden: You do not have access to this workspace.",
    });
  }

  // 4) Güvenli: orgId'yi request'e set et
  req.orgId = orgId;
  next();
}