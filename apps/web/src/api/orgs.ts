import api from "./client";

export type WorkspaceDto = {
  id: string;
  name: string;
  role: string;
  createdAt: string;
};

export async function listMyWorkspaces(): Promise<WorkspaceDto[]> {
  const res = await api.get("/orgs/mine");
  return (res.data?.orgs ?? []) as WorkspaceDto[];
}