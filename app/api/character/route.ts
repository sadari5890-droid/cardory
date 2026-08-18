import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { toFile } from "openai";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const source = form.get("image");
    const persona = String(form.get("persona") || "friendly brand character");
    if (!(source instanceof File)) return NextResponse.json({ error: "사진을 선택해주세요." }, { status: 400 });
    const openai = getOpenAI();
    const input = await toFile(Buffer.from(await source.arrayBuffer()), source.name, { type: source.type });
    const result = await openai.images.edit({
      model: "gpt-image-2",
      image: input,
      size: "1024x1024",
      quality: "high",
      prompt: `Create a professional 2x2 character reference sheet based faithfully on this person or character for the brand persona: ${persona}. Show front portrait, three-quarter portrait, full body, and a simple expressive pose. Keep one identical face, hairstyle, outfit, proportions, palette, and polished editorial illustration style across all four views. Plain warm neutral background. Absolutely no text, letters, labels, logos, captions, numbers, or watermark.`
    });
    const image = result.data?.[0];
    const dataUrl = image?.b64_json ? `data:image/png;base64,${image.b64_json}` : image?.url;
    if (!dataUrl) throw new Error("캐릭터 시트 결과가 비어 있습니다.");
    return NextResponse.json({ image: dataUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "캐릭터 시트 생성에 실패했습니다." }, { status: 500 });
  }
}
