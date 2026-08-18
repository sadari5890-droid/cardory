export type SizeKey = "square" | "portrait" | "landscape";
export type CardDesign = {
  textColor: string;
  accentColor: string;
  overlay: number;
  align: "left" | "center";
  position: "top" | "center" | "bottom";
};
export type CardItem = {
  id: string;
  title: string;
  body: string;
  imagePrompt: string;
  image?: string;
  design: CardDesign;
};
export type ProjectData = {
  persona: string;
  topic: string;
  size: SizeKey;
  cards: CardItem[];
  characterSheet?: string;
};

export const SIZE_MAP: Record<SizeKey, { label: string; api: "1024x1024" | "1024x1536" | "1536x1024"; width: number; height: number }> = {
  square: { label: "정사각형 1:1", api: "1024x1024", width: 1080, height: 1080 },
  portrait: { label: "세로형 4:5", api: "1024x1536", width: 1080, height: 1350 },
  landscape: { label: "가로형 16:9", api: "1536x1024", width: 1600, height: 900 },
};
