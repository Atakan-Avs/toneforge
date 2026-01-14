import { api } from "../../lib/api";

export type OrgDto = {
  id: string;
  name: string;
  role: string;
  createdAt: string;
};

export async function fetchMyOrgs(): Promise<OrgDto[]> {
  const { data } = await api.get("/orgs/mine");
  return data.orgs as OrgDto[];
}