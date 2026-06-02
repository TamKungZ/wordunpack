import type {
  ExplainedToken,
  LanguageCode,
  TokenizedToken,
  WordMeaningContext,
  WordMeaningProvider,
} from "@wordunpack/core";

type Gloss = Pick<
  ExplainedToken,
  "direct" | "role" | "note" | "confidence" | "sourceProvider"
>;

export class JapaneseThaiSeedGlossProvider implements WordMeaningProvider {
  readonly name = "gloss-ja-th-seed";

  supports(source: LanguageCode, target: LanguageCode): boolean {
    return source === "ja" && target === "th";
  }

  async lookup(
    token: TokenizedToken,
    _context: WordMeaningContext,
  ): Promise<Gloss | undefined> {
    if (token.kind === "punctuation") {
      return {
        direct: token.surface,
        role: "เครื่องหมายวรรคตอน",
        confidence: 1,
        sourceProvider: this.name,
      };
    }

    const key = token.baseForm ?? token.lemma ?? token.surface;
    const gloss = seedGlosses.get(key) ?? seedGlosses.get(token.surface);
    if (!gloss) {
      return undefined;
    }

    return {
      ...gloss,
      confidence: gloss.confidence ?? 0.65,
      sourceProvider: this.name,
    };
  }
}

const seedGlosses = new Map<string, Gloss>([
  [
    "は",
    {
      direct: "หัวข้อ",
      role: "particle ชี้หัวข้อของประโยค",
      note: "อ่านว่า wa เมื่อใช้เป็น particle",
      confidence: 0.9,
    },
  ],
  [
    "が",
    {
      direct: "สิ่งที่ถูกเน้น",
      role: "particle ชี้ประธานหรือสิ่งที่เด่นในประโยค",
      confidence: 0.85,
    },
  ],
  [
    "を",
    {
      direct: "ชี้กรรม",
      role: "particle บอกว่าคำก่อนหน้าเป็นกรรม",
      confidence: 0.95,
    },
  ],
  [
    "に",
    {
      direct: "ไปยัง / จุดหมาย",
      role: "particle ชี้ปลายทาง เวลา หรือจุดรับการกระทำ",
      confidence: 0.8,
    },
  ],
  [
    "で",
    {
      direct: "ที่ / ด้วย",
      role: "particle ชี้สถานที่เกิดการกระทำหรือเครื่องมือ",
      confidence: 0.8,
    },
  ],
  [
    "の",
    {
      direct: "ของ / เกี่ยวกับ",
      role: "particle เชื่อมความเป็นเจ้าของ หรือใช้ถามแบบนุ่มขึ้นท้ายประโยค",
      confidence: 0.85,
    },
  ],
  [
    "て",
    {
      direct: "เชื่อมกริยา",
      role: "รูปเชื่อมที่มักใช้ต่อกับ いる เพื่อบอกสภาพหรือการกระทำต่อเนื่อง",
      confidence: 0.75,
    },
  ],
  [
    "いる",
    {
      direct: "อยู่ / กำลังอยู่",
      role: "กริยาช่วยบอกสภาพหรือการกระทำที่ดำเนินอยู่",
      confidence: 0.75,
    },
  ],
  [
    "です",
    {
      direct: "เป็น / ครับค่ะ",
      role: "คำสุภาพท้ายประโยค",
      confidence: 0.8,
    },
  ],
  [
    "こと",
    {
      direct: "เรื่อง / สิ่งเกี่ยวกับ",
      role: "คำนามนามธรรมที่ทำให้สิ่งก่อนหน้ากลายเป็นหัวข้อหรือเรื่อง",
      confidence: 0.7,
    },
  ],
]);
