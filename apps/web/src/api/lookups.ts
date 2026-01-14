import api from "./client";

export async function getBrandVoices() {
  const res = await api.get("/brand-voices");
  return res.data.items ?? [];
}

export async function getTemplates() {
  const res = await api.get("/templates");
  return res.data.items ?? [];
}