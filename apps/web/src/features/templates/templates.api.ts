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

  // backend response şekilleri farklı olabilir:
  // { item: {...} }  veya  { template: {...} }  veya  direkt {...}
  const data = res.data;
  const template = (data?.item ?? data?.template ?? data) as TemplateDto;

  return template;
}

export async function updateTemplate(
  id: string,
  input: { category: string; content: string }
): Promise<TemplateDto> {
  const res = await api.put(`/templates/${id}`, input);

  const data = res.data;
  const template = (data?.item ?? data?.template ?? data) as TemplateDto;

  return template;
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/templates/${id}`);
}
