import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { listMyWorkspaces, type WorkspaceDto } from "../api/orgs";


type Ctx = {
  workspaces: WorkspaceDto[];
  loading: boolean;
  orgId: string | null;
  setOrgId: (id: string) => void;
  refresh: () => Promise<void>;
};

const WorkspaceContext = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgIdState] = useState<string | null>(() => localStorage.getItem("orgId"));

  async function refresh() {
    // ✅ api/client.ts ile tutarlı: hem accessToken hem token hem jwt kontrol et
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("jwt");
    if (!token) {
      setWorkspaces([]);
      setOrgIdState(null);
      localStorage.removeItem("orgId");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const ws = await listMyWorkspaces();
      setWorkspaces(ws);

      // ✅ orgId yoksa ilk workspace'i seç
      const current = localStorage.getItem("orgId");
      if (!current && ws.length > 0) {
        localStorage.setItem("orgId", ws[0].id);
        setOrgIdState(ws[0].id);
      }

      // ✅ orgId artık listede yoksa ilkine düş
      if (current && ws.length > 0 && !ws.some((x) => x.id === current)) {
        localStorage.setItem("orgId", ws[0].id);
        setOrgIdState(ws[0].id);
      }

      // ✅ Workspaces boşsa ama orgId varsa, orgId'yi koru (backend'den gelen orgId geçerli olabilir)
      if (ws.length === 0 && current) {
        // orgId zaten localStorage'da var, koru
        setOrgIdState(current);
      }
    } catch (err: any) {
      console.error("Failed to refresh workspaces:", err);
      // ✅ Hata olsa bile mevcut orgId'yi koru (backend'den gelen orgId geçerli olabilir)
      const current = localStorage.getItem("orgId");
      if (current) {
        setOrgIdState(current);
      } else {
        // orgId yoksa temizle
        setOrgIdState(null);
        localStorage.removeItem("orgId");
      }
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }

  function setOrgId(id: string) {
    localStorage.setItem("orgId", id);
    setOrgIdState(id);
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(
    () => ({ workspaces, loading, orgId, setOrgId, refresh }),
    [workspaces, loading, orgId]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}