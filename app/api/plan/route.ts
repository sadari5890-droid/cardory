import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { persona, topic, count } = await request.json();
    if (!persona?.trim() || !topic?.trim()) return NextResponse.json({ error: "브랜드 페르소나와 주제를 입력해주세요." }, { status: 400 });
    const openai = getOpenAI();
    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      input: `당신은 한국어 브랜드 콘텐츠 디렉터입니다.\n브랜드 페르소나: ${persona}\n주제: ${topic}\n정확히 ${count}장의 카드뉴스 기획을 작성하세요. 첫 장은 강한 표지, 마지막 장은 자연스러운 행동 유도여야 합니다. 각 제목은 18자 이내, 본문은 70자 이내입니다. imagePrompt는 영어로만 쓰고, 이미지 안에는 글자·문자·로고·워터마크가 절대 없도록 구성하세요.`,
      text: {
        format: {
          type: "json_schema",
          name: "card_plan",
          strict: true,
          schema: {
            type: "object",
            properties: {
              cards: {
                type: "array",
                minItems: count,
                maxItems: count,
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    body: { type: "string" },
                    imagePrompt: { type: "string" }
                  },
                  required: ["title", "body", "imagePrompt"],
                  additionalProperties: false
                }
              }
            },
            required: ["cards"],
            additionalProperties: false
          }
        }
      }
    });
    return NextResponse.json(JSON.parse(response.output_text));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "기획 생성에 실패했습니다." }, { status: 500 });
  }
}
