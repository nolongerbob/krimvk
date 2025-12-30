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

    // Функция для добавления текста (координаты будут настроены после добавления PDF)
    const addText = (text: string, x: number, y: number, size: number = fontSize, bold: boolean = false, maxWidth?: number) => {
      if (!text) return;
      
      // Если текст слишком длинный, разбиваем на строки
      let lines: string[] = [];
      if (maxWidth) {
        const words = text.split(" ");
        let currentLine = "";
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          // Примерная проверка ширины (можно улучшить)
          if (testLine.length * size * 0.6 > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
      } else {
        lines = [text];
      }

      lines.forEach((line, index) => {
        firstPage.drawText(line, {
          x,
          y: height - y - (index * size * 1.2), // PDF координаты идут снизу вверх
          size,
          font: bold ? fontBold : font,
          color: rgb(0, 0, 0),
          maxWidth: maxWidth || width - x - 50,
        });
      });
    };

    // Координаты полей (нужно будет подобрать под конкретный PDF)
    // Для стандартного A4: ширина ~595pt, высота ~842pt
    // Координаты указаны приблизительно, их нужно будет настроить
    
    // Пункт 2 - Сведения о лице (несколько строк)
    const personInfoLines = [
      `${formData.lastName} ${formData.firstName} ${formData.middleName}`,
      formData.birthDate ? `Дата рождения: ${new Date(formData.birthDate).toLocaleDateString("ru-RU")}` : "",
      formData.passportSeries && formData.passportNumber ? `Паспорт: серия ${formData.passportSeries} № ${formData.passportNumber}` : "",
      formData.passportIssuedBy ? `Выдан: ${formData.passportIssuedBy}` : "",
      formData.passportIssueDate ? `Дата выдачи: ${new Date(formData.passportIssueDate).toLocaleDateString("ru-RU")}` : "",
      formData.passportDivisionCode ? `Код подразделения: ${formData.passportDivisionCode}` : "",
      formData.inn ? `ИНН: ${formData.inn}` : "",
      formData.snils ? `СНИЛС: ${formData.snils}` : "",
    ].filter(Boolean);

    personInfoLines.forEach((line, index) => {
      addText(line, 50, 200 + (index * 15), fontSize, false, 500);
    });

    // Пункт 3 - Контактные данные
    const contactLines = [
      formData.registrationAddress ? `Адрес регистрации: ${formData.registrationAddress}` : "",
      formData.phone ? `Телефон: ${formData.phone}` : "",
    ].filter(Boolean);

    contactLines.forEach((line, index) => {
      addText(line, 50, 320 + (index * 15), fontSize, false, 500);
    });

    // Пункт 4 - Основания обращения
    addText("Правообладатель земельного участка", 50, 380, fontSize);

    // Пункт 5 - В связи с
    addText(formData.constructionType || "", 120, 420, fontSize);
    
    const objectType = formData.objectType === "residential" ? "Жилой дом" : 
                      formData.objectType === "apartment" ? "Квартира" : 
                      formData.objectType === "commercial" ? "Коммерческий объект" : 
                      formData.objectType === "industrial" ? "Промышленный объект" : "";
    addText(objectType, 50, 460, fontSize);
    addText(formData.objectAddress || "", 50, 500, fontSize, false, 500);

    // Пункт 6 - Требуется подключение
    const connectionTypes = [];
    if (formData.connectionTypeWater) connectionTypes.push("холодного водоснабжения");
    if (formData.connectionTypeSewerage) connectionTypes.push("водоотведения");
    addText(connectionTypes.join(", ") || "", 50, 540, fontSize);

    // Пункт 7 - Виды ресурсов
    addText(formData.resourceType || "получение питьевой воды, сброс хозяйственно-бытовых сточных вод", 50, 580, fontSize, false, 500);

    // Пункт 8 - Параметры
    const params = [];
    if (formData.objectHeight) params.push(`Высота: ${formData.objectHeight} м`);
    if (formData.objectFloors) params.push(`Этажность: ${formData.objectFloors}`);
    if (formData.networkLength) params.push(`Протяженность: ${formData.networkLength} м`);
    if (formData.pipeDiameter) params.push(`Диаметр: ${formData.pipeDiameter} мм`);
    addText(params.join(", ") || "", 50, 620, fontSize, false, 500);

    // Пункт 9 - Срок ввода
    addText(formData.plannedCommissioningDate || "", 50, 660, fontSize);

    // Пункт 10 - Мощность (разбиваем на строки)
    addText(`потребления холодной воды ${formData.maxWaterConsumptionLps || "____"} л/с, ${formData.maxWaterConsumptionM3h || "____"} куб.м/час, ${formData.maxWaterConsumptionM3day || "____"} куб. м./сутки,`, 50, 700, fontSize, false, 500);
    addText(`в том числе на нужды пожаротушения - наружного ${formData.fireExtinguishingExternal || "____"} л/сек, внутреннего ${formData.fireExtinguishingInternal || "____"} л/сек.`, 50, 720, fontSize, false, 500);
    addText(`(количество пожарных кранов ${formData.fireHydrantsCount || "____"} штук), автоматическое ${formData.fireExtinguishingAutomatic || "____"} л/сек.`, 50, 740, fontSize, false, 500);
    addText(`водоотведения ${formData.wastewaterLps || "____"} л/с ${formData.wastewaterM3h || "____"} куб. м/час, ${formData.wastewaterM3day || "____"} куб. м/сутки`, 50, 760, fontSize, false, 500);

    // Пункт 11 - Способ уведомления
    addText(formData.notificationMethod || "на адрес электронной почты", 50, 800, fontSize, false, 500);

    // Дата и подпись (внизу страницы)
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleDateString("ru-RU", { month: "long" });
    const year = today.getFullYear();
    const dateStr = `«${day}» ${month} ${year} г.`;
    addText(dateStr, 50, height - 50, fontSize);
    
    const fullName = `${formData.lastName} ${formData.firstName} ${formData.middleName}`;
    addText(fullName, width - 250, height - 50, fontSize);

    // Сохраняем PDF
    const filledPdfBytes = await pdfDoc.save();

    // Возвращаем PDF
    return new NextResponse(Buffer.from(filledPdfBytes), {
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

