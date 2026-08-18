import OpenAI from "openai";

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
