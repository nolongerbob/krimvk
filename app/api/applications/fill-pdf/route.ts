import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const formData = await request.json();

    // Загружаем PDF шаблон
    const pdfPath = join(process.cwd(), "public", "documents", "zayavlenie-o-vydache-tehnicheskih-uslovij.pdf");
    
    let pdfBytes: Buffer;
    try {
      pdfBytes = await readFile(pdfPath);
    } catch (error) {
      // Если PDF нет, возвращаем ошибку
      return NextResponse.json(
        { error: "PDF шаблон не найден. Пожалуйста, добавьте файл zayavlenie-o-vydache-tehnicheskih-uslovij.pdf в public/documents/" },
        { status: 404 }
      );
    }

    // Загружаем PDF документ
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Загружаем шрифт
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Размер шрифта
    const fontSize = 10;
    const smallFontSize = 8;

    // Функция для добавления текста
    const addText = (text: string, x: number, y: number, size: number = fontSize, bold: boolean = false) => {
      if (!text) return;
      firstPage.drawText(text, {
        x,
        y: height - y, // PDF координаты идут снизу вверх
        size,
        font: bold ? fontBold : font,
        color: rgb(0, 0, 0),
      });
    };

    // Заполняем поля (координаты нужно будет подобрать под конкретный PDF)
    // Пункт 1 - уже заполнен в шаблоне
    
    // Пункт 2 - Сведения о лице
    const personInfo = [
      `${formData.lastName} ${formData.firstName} ${formData.middleName}`,
      formData.birthDate ? `Дата рождения: ${new Date(formData.birthDate).toLocaleDateString("ru-RU")}` : "",
      formData.passportSeries && formData.passportNumber ? `Паспорт: серия ${formData.passportSeries} № ${formData.passportNumber}` : "",
      formData.passportIssuedBy ? `Выдан: ${formData.passportIssuedBy}` : "",
      formData.passportIssueDate ? `Дата выдачи: ${new Date(formData.passportIssueDate).toLocaleDateString("ru-RU")}` : "",
      formData.passportDivisionCode ? `Код подразделения: ${formData.passportDivisionCode}` : "",
      formData.inn ? `ИНН: ${formData.inn}` : "",
      formData.snils ? `СНИЛС: ${formData.snils}` : "",
    ].filter(Boolean).join(", ");

    addText(personInfo, 50, 200, fontSize);

    // Пункт 3 - Контактные данные
    const contactInfo = [
      formData.registrationAddress ? `Адрес регистрации: ${formData.registrationAddress}` : "",
      formData.phone ? `Телефон: ${formData.phone}` : "",
    ].filter(Boolean).join(", ");

    addText(contactInfo, 50, 280, fontSize);

    // Пункт 4 - Основания обращения
    addText("Правообладатель земельного участка", 50, 340, fontSize);

    // Пункт 5 - В связи с
    addText(formData.constructionType || "", 120, 400, fontSize);
    
    const objectType = formData.objectType === "residential" ? "Жилой дом" : 
                      formData.objectType === "apartment" ? "Квартира" : 
                      formData.objectType === "commercial" ? "Коммерческий объект" : 
                      formData.objectType === "industrial" ? "Промышленный объект" : "";
    addText(objectType, 50, 440, fontSize);
    addText(formData.objectAddress || "", 50, 480, fontSize);

    // Пункт 6 - Требуется подключение
    const connectionTypes = [];
    if (formData.connectionTypeWater) connectionTypes.push("холодного водоснабжения");
    if (formData.connectionTypeSewerage) connectionTypes.push("водоотведения");
    addText(connectionTypes.join(", ") || "", 50, 520, fontSize);

    // Пункт 7 - Виды ресурсов
    addText(formData.resourceType || "получение питьевой воды, сброс хозяйственно-бытовых сточных вод", 50, 560, fontSize);

    // Пункт 8 - Параметры
    const params = [];
    if (formData.objectHeight) params.push(`Высота: ${formData.objectHeight} м`);
    if (formData.objectFloors) params.push(`Этажность: ${formData.objectFloors}`);
    if (formData.networkLength) params.push(`Протяженность: ${formData.networkLength} м`);
    if (formData.pipeDiameter) params.push(`Диаметр: ${formData.pipeDiameter} мм`);
    addText(params.join(", ") || "", 50, 600, fontSize);

    // Пункт 9 - Срок ввода
    addText(formData.plannedCommissioningDate || "", 50, 640, fontSize);

    // Пункт 10 - Мощность (в одной строке для компактности)
    const powerInfo = `ХВС: ${formData.maxWaterConsumptionLps || "____"} л/с, ${formData.maxWaterConsumptionM3h || "____"} м³/ч, ${formData.maxWaterConsumptionM3day || "____"} м³/сут; Пожаротушение: наружное ${formData.fireExtinguishingExternal || "____"} л/с, внутреннее ${formData.fireExtinguishingInternal || "____"} л/с, автоматическое ${formData.fireExtinguishingAutomatic || "____"} л/с (кранов: ${formData.fireHydrantsCount || "____"}); Водоотведение: ${formData.wastewaterLps || "____"} л/с, ${formData.wastewaterM3h || "____"} м³/ч, ${formData.wastewaterM3day || "____"} м³/сут`;
    addText(powerInfo, 50, 680, smallFontSize);

    // Пункт 11 - Способ уведомления
    addText(formData.notificationMethod || "на адрес электронной почты", 50, 720, fontSize);

    // Дата и подпись
    const today = new Date();
    const dateStr = `«${today.getDate()}» ${today.toLocaleDateString("ru-RU", { month: "long" })} ${today.getFullYear()} г.`;
    addText(dateStr, 50, height - 50, fontSize);
    
    const fullName = `${formData.lastName} ${formData.firstName} ${formData.middleName}`;
    addText(fullName, width - 200, height - 50, fontSize);

    // Сохраняем PDF
    const filledPdfBytes = await pdfDoc.save();

    // Возвращаем PDF
    return new NextResponse(filledPdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="zayavlenie_TU_${formData.lastName}_${today.toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error filling PDF:", error);
    return NextResponse.json(
      {
        error: "Ошибка при заполнении PDF",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

