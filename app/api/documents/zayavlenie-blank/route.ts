import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

/** Бланк заявления о выдаче ТУ (пустая форма для ручного заполнения). Файл в корне проекта. */
const FILENAME = "zayavlenie-o-vydache-tehnicheskih-uslovij-3.docx";

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
    console.error("zayavlenie-blank docx from root:", e);
    return NextResponse.json(
      { error: "Файл бланка заявления не найден (zayavlenie-o-vydache-tehnicheskih-uslovij-3.docx в корне проекта)." },
      { status: 404 }
    );
  }
}
