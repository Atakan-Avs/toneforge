import api from "../../api/client";

export type TemplateDto = {
  id: string;
  category: string;
  content: string;
  createdAt: string;
};

export async function listTemplates(): Promise<TemplateDto[]> {
  const res = await api.get("/templates");
  return (res.data?.items ?? []) as TemplateDto[];
}

export async function createTemplate(input: {
  category: string;
  content: string;
}): Promise<TemplateDto> {
  const res = await api.post("/templates", input);
  return res.data?.item as TemplateDto;
}

export async function updateTemplate(
  id: string,
  input: { category: string; content: string }
): Promise<TemplateDto> {
  const res = await api.put(`/templates/${id}`, input);
  return res.data?.item as TemplateDto;
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/templates/${id}`);
}