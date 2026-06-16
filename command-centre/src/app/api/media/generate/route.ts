import { NextRequest, NextResponse } from "next/server";
import { generateImage, generateAudio, generateVideo } from "@/lib/media-generator";
import type { MediaResult } from "@/lib/media-generator";

export async function POST(request: NextRequest) {
  try {
    const { prompt, type, options } = await request.json() as {
      prompt: string;
      type: "image" | "video" | "audio";
      options?: Record<string, string | number>;
    };

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    let result: MediaResult;
    switch (type) {
      case "image":
        result = await generateImage(prompt.trim(), options);
        break;
      case "video":
        result = await generateVideo(prompt.trim(), options);
        break;
      case "audio":
        result = await generateAudio(prompt.trim(), options);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported media type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ result });
  } catch (err) {
    console.error("Media generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
