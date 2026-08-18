import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { toFile } from "openai";

export const maxDuration = 120;

function fromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error("이미지 형식이 올바르지 않습니다.");
  return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
}

export async function POST(request: Request) {
  try {
    const { prompt, size, reference } = await request.json();
    if (!prompt) return NextResponse.json({ error: "이미지 설명이 없습니다." }, { status: 400 });
    const openai = getOpenAI();
    const safePrompt = `${prompt}\nCRITICAL: Create a clean editorial visual with absolutely NO text, NO letters, NO typography, NO numbers, NO logos, NO captions, and NO watermark anywhere in the image. Leave intentional negative space for a separate web text overlay.`;
    let result;
    if (reference) {
      const parsed = fromDataUrl(reference);
      const file = await toFile(parsed.buffer, "character-reference.png", { type: parsed.mime });
      result = await openai.images.edit({ model: "gpt-image-2", image: file, prompt: `${safePrompt}\nUse the supplied character sheet as the single source of truth. Preserve the exact same face, hair, outfit, color palette, and illustration style.`, size, quality: "medium" });
    } else {
      result = await openai.images.generate({ model: "gpt-image-2", prompt: safePrompt, size, quality: "medium" });
    }
    const image = result.data?.[0];
    const dataUrl = image?.b64_json ? `data:image/png;base64,${image.b64_json}` : image?.url;
    if (!dataUrl) throw new Error("이미지 결과가 비어 있습니다.");
    return NextResponse.json({ image: dataUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "이미지 생성에 실패했습니다." }, { status: 500 });
  }
}
