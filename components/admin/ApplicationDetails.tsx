"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Phone, MapPin, FileText, Building, Settings, Calendar, Download, Eye } from "lucide-react";
import { ApplicationForm } from "@/app/stat-abonentom/application-form";

interface ApplicationDetailsProps {
  application: {
    id: string;
    status: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    createdAt: Date;
    user: {
      name: string | null;
      email: string;
      phone: string | null;
    };
  };
}

export function ApplicationDetails({ application }: ApplicationDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  let data: any = null;
  
  try {
    if (application.description) {
      data = JSON.parse(application.description);
    }
  } catch (e) {
    // Если не JSON, значит это старая заявка
  }

  const isTechnicalConditions = data && data.type === "technical_conditions";

  const handleDownloadPDF = async () => {
    if (!isTechnicalConditions) return;
    
    try {
      // Используем ту же логику, что и в форме
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      // Создаем временный элемент для генерации
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '170mm'; // 210mm - 40mm (20mm слева + 20mm справа)
      tempDiv.style.maxWidth = '170mm';
      tempDiv.style.minWidth = '170mm';
      tempDiv.style.padding = '0';
      tempDiv.style.margin = '0';
      tempDiv.style.fontFamily = 'Times New Roman, serif';
      tempDiv.style.fontSize = '10pt'; // Уменьшили еще для умещения на 2 листа
      tempDiv.style.lineHeight = '1.5';
      tempDiv.style.color = '#000000';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.boxSizing = 'border-box';
      tempDiv.style.overflow = 'visible';
      tempDiv.style.height = 'auto';
      document.body.appendChild(tempDiv);

      // Рендерим форму через React
      const React = await import("react");
      const ReactDOM = await import("react-dom/client");
      const { ApplicationForm } = await import("@/app/stat-abonentom/application-form");
      
      const root = ReactDOM.createRoot(tempDiv);
      root.render(React.createElement(ApplicationForm, { formData: data, isPreview: false }));

      // Ждем рендеринга
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(tempDiv, {
        scale: 1.5, // Уменьшаем scale для меньшего размера файла
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        removeContainer: false,
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
        windowWidth: tempDiv.scrollWidth,
        windowHeight: tempDiv.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      document.body.removeChild(tempDiv);
      root.unmount();

      const pdf = new jsPDF("p", "mm", "a4");
      // Используем JPEG с качеством 0.85 для меньшего размера файла
      const imgData = canvas.toDataURL("image/jpeg", 0.85);

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const scale = 1.5;
      const realWidthPx = imgWidth / scale;
      const realHeightPx = imgHeight / scale;
      const pxToMm = 25.4 / 96;

      const imgWidthMm = realWidthPx * pxToMm;
      const imgHeightMm = realHeightPx * pxToMm;

      const paddingTop = 15; // мм - отступ сверху на каждой странице
      const paddingLeft = 20;
      const paddingRight = 20;
      const paddingBottom = 15; // мм - отступ снизу на каждой странице
      // Добавляем небольшой запас для предотвращения обрезания текста
      const safetyMargin = 5; // мм
      const availableHeight = pdfHeight - paddingTop - paddingBottom - safetyMargin;
      const availableWidth = pdfWidth - paddingLeft - paddingRight;

      const widthRatio = availableWidth / imgWidthMm;
      const finalWidth = availableWidth;
      const finalHeight = imgHeightMm * widthRatio;

      if (finalHeight <= availableHeight) {
        pdf.addImage(imgData, "JPEG", paddingLeft, paddingTop, finalWidth, finalHeight);
      } else {
        // Высота одной страницы в мм (с учетом отступов и запаса)
        const pageHeightMm = availableHeight;
        // Вычисляем сколько пикселей исходного canvas соответствует одной странице
        const pageHeightRealPx = pageHeightMm / pxToMm / widthRatio;
        const pageHeightPx = pageHeightRealPx * scale;

        let sourceY = 0;
        let pageNumber = 0;

        while (sourceY < imgHeight) {
          const remainingHeight = imgHeight - sourceY;
          // Вычитаем небольшой запас для предотвращения обрезания строк
          const safetyMarginPx = (safetyMargin / pxToMm / widthRatio) * scale;
          let currentPageHeightPx = Math.min(pageHeightPx - safetyMarginPx, remainingHeight);
          
          // Убеждаемся, что не берем меньше чем нужно
          if (currentPageHeightPx < remainingHeight && pageNumber === 0 && sourceY === 0) {
            // На первой странице можем взять чуть больше
            currentPageHeightPx = Math.min(pageHeightPx, remainingHeight);
          }

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgWidth;
          pageCanvas.height = Math.ceil(currentPageHeightPx);
          const pageCtx = pageCanvas.getContext('2d');

          if (pageCtx) {
            pageCtx.drawImage(
              canvas,
              0, sourceY, imgWidth, currentPageHeightPx,
              0, 0, imgWidth, currentPageHeightPx
            );
            const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.85);

            if (pageNumber > 0) {
              pdf.addPage();
            }

            const currentPageHeightRealPx = currentPageHeightPx / scale;
            const currentPageHeightMm = currentPageHeightRealPx * pxToMm * widthRatio;
            // На каждой странице добавляем верхний отступ
            const yPosition = paddingTop;
            // Высота страницы должна быть точно равна availableHeight для всех страниц кроме последней
            const isLastPage = sourceY + currentPageHeightPx >= imgHeight - 1; // -1 для учета погрешности
            // На последней странице добавляем дополнительный запас снизу
            const lastPageExtraMargin = isLastPage ? 5 : 0; // мм - дополнительный запас для последней страницы
            const pageHeightForPdf = isLastPage 
              ? Math.min(currentPageHeightMm + (lastPageExtraMargin / pxToMm / widthRatio), availableHeight + lastPageExtraMargin) // На последней странице используем реальную высоту + запас
              : availableHeight; // На всех остальных - фиксированная высота
            pdf.addImage(pageImgData, "JPEG", paddingLeft, yPosition, finalWidth, pageHeightForPdf);
          }

          sourceY += currentPageHeightPx;
          pageNumber++;
        }
      }

      const fileName = `zayavlenie_TU_${data.lastName || 'application'}_${new Date(application.createdAt).toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Ошибка при генерации PDF");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Подробнее
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Детали заявки</DialogTitle>
          <DialogDescription>
            Полная информация о заявке от {application.user.name || application.user.email}
          </DialogDescription>
        </DialogHeader>

        {isTechnicalConditions ? (
          <div className="space-y-4">
            {/* Кнопка скачать PDF */}
            <div className="flex justify-end mb-4">
              <Button onClick={handleDownloadPDF} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Скачать заявление (PDF)
              </Button>
            </div>

            {/* Предпросмотр заявления */}
            <Card>
              <CardHeader>
                <CardTitle>Заявление на технические условия</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-white max-h-[400px] overflow-y-auto">
                  <ApplicationForm formData={data} isPreview={true} />
                </div>
              </CardContent>
            </Card>

            {/* Детальная информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Личные данные */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Личные данные
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">ФИО:</span>{" "}
                    <span className="font-medium">
                      {data.lastName || "-"} {data.firstName || "-"} {data.middleName || ""}
                    </span>
                  </div>
                  {data.birthDate && (
                    <div>
                      <span className="text-gray-600">Дата рождения:</span>{" "}
                      <span className="font-medium">{data.birthDate}</span>
                    </div>
                  )}
                  {data.registrationAddress && (
                    <div>
                      <span className="text-gray-600">Адрес регистрации:</span>{" "}
                      <span className="font-medium">{data.registrationAddress}</span>
                    </div>
                  )}
                  {data.passportSeries && data.passportNumber && (
                    <div>
                      <span className="text-gray-600">Паспорт:</span>{" "}
                      <span className="font-medium">
                        {data.passportSeries} № {data.passportNumber}
                      </span>
                    </div>
                  )}
                  {data.passportIssuedBy && (
                    <div>
                      <span className="text-gray-600">Выдан:</span>{" "}
                      <span className="font-medium">{data.passportIssuedBy}</span>
                    </div>
                  )}
                  {data.passportIssueDate && (
                    <div>
                      <span className="text-gray-600">Дата выдачи паспорта:</span>{" "}
                      <span className="font-medium">{data.passportIssueDate}</span>
                    </div>
                  )}
                  {data.passportDivisionCode && (
                    <div>
                      <span className="text-gray-600">Код подразделения:</span>{" "}
                      <span className="font-medium">{data.passportDivisionCode}</span>
                    </div>
                  )}
                  {data.inn && (
                    <div>
                      <span className="text-gray-600">ИНН:</span>{" "}
                      <span className="font-medium">{data.inn}</span>
                    </div>
                  )}
                  {data.snils && (
                    <div>
                      <span className="text-gray-600">СНИЛС:</span>{" "}
                      <span className="font-medium">{data.snils}</span>
                    </div>
                  )}
                  {(application.user.phone || data.phone) && (
                    <div>
                      <span className="text-gray-600">Телефон:</span>{" "}
                      <span className="font-medium">{application.user.phone || data.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Информация об объекте */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Информация об объекте
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {data.objectType && (
                    <div>
                      <span className="text-gray-600">Тип объекта:</span>{" "}
                      <span className="font-medium">{data.objectType}</span>
                    </div>
                  )}
                  {data.objectPurpose && (
                    <div>
                      <span className="text-gray-600">Назначение:</span>{" "}
                      <span className="font-medium">{data.objectPurpose}</span>
                    </div>
                  )}
                  {data.cadastralNumber && (
                    <div>
                      <span className="text-gray-600">Кадастровый номер:</span>{" "}
                      <span className="font-medium">{data.cadastralNumber}</span>
                    </div>
                  )}
                  {data.objectAddress && (
                    <div>
                      <span className="text-gray-600">Адрес объекта:</span>{" "}
                      <span className="font-medium">{data.objectAddress}</span>
                    </div>
                  )}
                  {data.area && (
                    <div>
                      <span className="text-gray-600">Площадь:</span>{" "}
                      <span className="font-medium">{data.area} кв.м</span>
                    </div>
                  )}
                  {data.constructionType && (
                    <div>
                      <span className="text-gray-600">Тип строительства:</span>{" "}
                      <span className="font-medium">{data.constructionType}</span>
                    </div>
                  )}
                  {data.objectHeight && (
                    <div>
                      <span className="text-gray-600">Высота:</span>{" "}
                      <span className="font-medium">{data.objectHeight} м</span>
                    </div>
                  )}
                  {data.objectFloors && (
                    <div>
                      <span className="text-gray-600">Этажность:</span>{" "}
                      <span className="font-medium">{data.objectFloors}</span>
                    </div>
                  )}
                  {data.networkLength && (
                    <div>
                      <span className="text-gray-600">Протяженность сети:</span>{" "}
                      <span className="font-medium">{data.networkLength} м</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Параметры подключения */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Параметры подключения
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Водоснабжение:</span>
                  <Badge variant={data.connectionTypeWater ? "default" : "secondary"}>
                    {data.connectionTypeWater ? "Да" : "Нет"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Водоотведение:</span>
                  <Badge variant={data.connectionTypeSewerage ? "default" : "secondary"}>
                    {data.connectionTypeSewerage ? "Да" : "Нет"}
                  </Badge>
                </div>
                {data.connectionMethod && (
                  <div>
                    <span className="text-gray-600">Тип подключения:</span>{" "}
                    <span className="font-medium">
                      {data.connectionMethod === "with-well" ? "С колодцем" : "По протяженности"}
                    </span>
                  </div>
                )}
                {data.wellType && (
                  <div>
                    <span className="text-gray-600">Тип колодца:</span>{" "}
                    <span className="font-medium">
                      {data.wellType === "existing" ? "Существующий" : "Проектируемый"}
                    </span>
                  </div>
                )}
                {data.requestedLoad && (
                  <div>
                    <span className="text-gray-600">Запрошенная нагрузка:</span>{" "}
                    <span className="font-medium">{data.requestedLoad} м³</span>
                  </div>
                )}
                {data.connectionPointLocation && (
                  <div>
                    <span className="text-gray-600">Расположение точки подключения:</span>{" "}
                    <span className="font-medium">{data.connectionPointLocation}</span>
                  </div>
                )}
                {data.pipeDiameter && (
                  <div>
                    <span className="text-gray-600">Диаметр водопровода:</span>{" "}
                    <span className="font-medium">{data.pipeDiameter} мм</span>
                  </div>
                )}
                {data.pipeMaterial && (
                  <div>
                    <span className="text-gray-600">Материал труб:</span>{" "}
                    <span className="font-medium">{data.pipeMaterial}</span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Ограничение водоснабжения:</span>
                  <Badge variant={data.waterSupplyRestriction ? "default" : "secondary"}>
                    {data.waterSupplyRestriction ? "Да" : "Нет"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Разрешение на подключение к частным сетям:</span>
                  <Badge variant={data.privateNetworkPermission ? "default" : "secondary"}>
                    {data.privateNetworkPermission ? "Да" : "Нет"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Параметры потребления */}
            {(data.maxWaterConsumptionLps || data.maxWaterConsumptionM3h || data.maxWaterConsumptionM3day || 
              data.fireExtinguishingExternal || data.fireExtinguishingInternal || data.fireHydrantsCount ||
              data.fireExtinguishingAutomatic || data.wastewaterLps || data.wastewaterM3h || data.wastewaterM3day) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Параметры потребления
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {(data.maxWaterConsumptionLps || data.maxWaterConsumptionM3h || data.maxWaterConsumptionM3day) && (
                    <div>
                      <span className="text-gray-600">Макс. потребление холодной воды:</span>{" "}
                      <span className="font-medium">
                        {data.maxWaterConsumptionLps && `${data.maxWaterConsumptionLps} л/с`}
                        {data.maxWaterConsumptionLps && (data.maxWaterConsumptionM3h || data.maxWaterConsumptionM3day) && ", "}
                        {data.maxWaterConsumptionM3h && `${data.maxWaterConsumptionM3h} м³/ч`}
                        {data.maxWaterConsumptionM3h && data.maxWaterConsumptionM3day && ", "}
                        {data.maxWaterConsumptionM3day && `${data.maxWaterConsumptionM3day} м³/сут`}
                      </span>
                    </div>
                  )}
                  {(data.fireExtinguishingExternal || data.fireExtinguishingInternal || data.fireHydrantsCount || data.fireExtinguishingAutomatic) && (
                    <div className="mt-2 pt-2 border-t">
                      <span className="text-gray-600 font-medium">Пожаротушение:</span>
                      {data.fireExtinguishingExternal && (
                        <div className="ml-4">
                          <span className="text-gray-600">Наружное:</span>{" "}
                          <span className="font-medium">{data.fireExtinguishingExternal} л/сек</span>
                        </div>
                      )}
                      {data.fireExtinguishingInternal && (
                        <div className="ml-4">
                          <span className="text-gray-600">Внутреннее:</span>{" "}
                          <span className="font-medium">{data.fireExtinguishingInternal} л/сек</span>
                        </div>
                      )}
                      {data.fireHydrantsCount && (
                        <div className="ml-4">
                          <span className="text-gray-600">Количество пожарных кранов:</span>{" "}
                          <span className="font-medium">{data.fireHydrantsCount} шт</span>
                        </div>
                      )}
                      {data.fireExtinguishingAutomatic && (
                        <div className="ml-4">
                          <span className="text-gray-600">Автоматическое:</span>{" "}
                          <span className="font-medium">{data.fireExtinguishingAutomatic} л/сек</span>
                        </div>
                      )}
                    </div>
                  )}
                  {(data.wastewaterLps || data.wastewaterM3h || data.wastewaterM3day) && (
                    <div>
                      <span className="text-gray-600">Водоотведение:</span>{" "}
                      <span className="font-medium">
                        {data.wastewaterLps && `${data.wastewaterLps} л/с`}
                        {data.wastewaterLps && (data.wastewaterM3h || data.wastewaterM3day) && " "}
                        {data.wastewaterM3h && `${data.wastewaterM3h} м³/ч`}
                        {data.wastewaterM3h && data.wastewaterM3day && ", "}
                        {data.wastewaterM3day && `${data.wastewaterM3day} м³/сут`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Дополнительная информация */}
            {(data.resourceType || data.plannedCommissioningDate || data.notificationMethod) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Дополнительная информация
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {data.resourceType && (
                    <div>
                      <span className="text-gray-600">Виды ресурсов или услуг:</span>{" "}
                      <span className="font-medium">{data.resourceType}</span>
                    </div>
                  )}
                  {data.plannedCommissioningDate && (
                    <div>
                      <span className="text-gray-600">Планируемый срок ввода в эксплуатацию:</span>{" "}
                      <span className="font-medium">{data.plannedCommissioningDate}</span>
                    </div>
                  )}
                  {data.notificationMethod && (
                    <div>
                      <span className="text-gray-600">Способ уведомления:</span>{" "}
                      <span className="font-medium">{data.notificationMethod}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Приложенные документы */}
            {data.uploadedFiles && data.uploadedFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Приложенные документы ({data.uploadedFiles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.uploadedFiles.map((file: string, index: number) => (
                      <a
                        key={index}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        {file.split("/").pop()}
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Описание заявки</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{application.description || "Без описания"}</p>
              </CardContent>
            </Card>
            {application.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Адрес
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{application.address}</p>
                </CardContent>
              </Card>
            )}
            {application.phone && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Контакты
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{application.phone}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

