import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

/** Файл-источник: корень проекта (единый источник правды для заявления о выдаче ТУ). */
const FILENAME = "zayavlenie-o-vydache-tehnicheskih-uslovij.docx";

export async function GET() {
  try {
    const path = join(process.cwd(), FILENAME);
    const buf = await readFile(path);
    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${FILENAME}"`,
      },
    });
  } catch (e) {
    console.error("zayavlenie docx from root:", e);
    return NextResponse.json(
      { error: "Файл заявления не найден в корне проекта." },
      { status: 404 }
    );
  }
}
