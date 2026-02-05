import api from "../../api/client";

export type BrandVoiceDto = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

export async function listBrandVoices(): Promise<BrandVoiceDto[]> {
  const res = await api.get("/brand-voices");
  return (res.data?.items ?? []) as BrandVoiceDto[];
}

export async function createBrandVoice(input: {
  name: string;
  description: string;
}): Promise<BrandVoiceDto> {
  const res = await api.post("/brand-voices", input);

  const data = res.data;
  const brandVoice = (data?.item ?? data?.brandVoice ?? data) as BrandVoiceDto;

  return brandVoice;
}

export async function updateBrandVoice(
  id: string,
  input: { name: string; description: string }
): Promise<BrandVoiceDto> {
  const res = await api.put(`/brand-voices/${id}`, input);

  const data = res.data;
  const brandVoice = (data?.item ?? data?.brandVoice ?? data) as BrandVoiceDto;

  return brandVoice;
}

export async function deleteBrandVoice(id: string): Promise<void> {
  await api.delete(`/brand-voices/${id}`);
}
