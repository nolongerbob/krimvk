"use client";

// Компонент для отображения заявления в формате, соответствующем оригинальному PDF
export function ApplicationForm({ formData, isPreview = false }: { formData: any; isPreview?: boolean }) {
  const containerClass = isPreview 
    ? "border rounded-lg p-6 bg-white mb-4 max-h-[600px] overflow-y-auto"
    : "bg-white";
  
  const fontSize = isPreview ? "11px" : "10pt";
  const fontSizeLarge = isPreview ? "19px" : "19pt";
  const fontSizeTitle = isPreview ? "19px" : "19pt";

  // Функция для создания строки подчеркивания с данными
  const underlineField = (text: string, length: number = 70) => {
    const textLength = text ? text.length : 0;
    const underlineLength = Math.max(0, length - textLength);
    return text + "_".repeat(underlineLength);
  };

  return (
    <div className={containerClass} style={{ fontFamily: "Times New Roman, serif", lineHeight: "1.5", fontSize: fontSize }}>
      {/* Приложение №1 и заголовок */}
      <div className="text-right mb-4" style={{ fontSize: fontSize, textIndent: "35pt" }}>
        <p style={{ margin: 0, fontWeight: "bold" }}>
          Приложение №1<br/>
          к Правилам подключения<br/>
          (технологического присоединения)<br/>
          объектов капитального строительства<br/>
          к централизованным системам<br/>
          горячего водоснабжения,<br/>
          холодного водоснабжения<br/>
          и (или) водоотведения
        </p>
      </div>

      {/* Заголовок ЗАПРОС */}
      <div className="text-center mb-6" style={{ marginTop: "1rem" }}>
        <p style={{ margin: 0, fontWeight: "bold", fontSize: fontSizeTitle }}>ЗАПРОС</p>
        <p style={{ margin: "0.5rem 0 0 0", fontSize: fontSize, fontWeight: "bold" }}>о выдаче технических условий на подключение</p>
        <p style={{ margin: "0.25rem 0 0 0", fontSize: fontSize, fontWeight: "bold" }}>(технологическое присоединение) к централизованным системам</p>
        <p style={{ margin: "0.25rem 0 0 0", fontSize: fontSize, fontWeight: "bold" }}>холодного водоснабжения и (или) водоотведения</p>
      </div>

      <div style={{ fontSize: fontSize, textIndent: "36pt" }}>
        <div className="space-y-3">
          {/* Пункт 1 */}
          <div>
            <p style={{ margin: 0 }}>1. Наименование исполнителя, которому направлен запрос</p>
            <p style={{ margin: "0.5rem 0 0 0", textIndent: 0, textDecoration: "underline", fontSize: fontSizeLarge, fontWeight: "bold" }}>
              ООО «Крымская Водная Компания»
            </p>
          </div>

          {/* Пункт 2 */}
          <div>
            <p style={{ margin: "0 0 0.5rem 0", textIndent: "35.4pt" }}>2. Сведения о лице, обратившемся с запросом</p>
            <p style={{ margin: 0, fontSize: fontSizeLarge, fontFamily: "Times New Roman, serif" }}>
              {underlineField("", 70)}
            </p>
            <p style={{ margin: 0 }}>{underlineField("", 70)}</p>
            <p style={{ margin: 0 }}>{underlineField("", 70)}</p>
            <p style={{ margin: "0 0 0.5rem 0" }}>{underlineField("", 70)}</p>
            <div style={{ margin: "0 0 0.5rem 0", textIndent: "35.4pt" }}>
              {formData.lastName} {formData.firstName} {formData.middleName}
              {formData.birthDate && `, дата рождения: ${formData.birthDate}`}
              {formData.passportSeries && formData.passportNumber && `, паспорт серия ${formData.passportSeries} № ${formData.passportNumber}`}
              {formData.passportIssuedBy && `, выдан ${formData.passportIssuedBy}`}
              {formData.passportIssueDate && `, дата выдачи ${formData.passportIssueDate}`}
              {formData.passportDivisionCode && `, код подразделения ${formData.passportDivisionCode}`}
              {formData.inn && `, ИНН ${formData.inn}`}
              {formData.snils && `, СНИЛС ${formData.snils}`}
            </div>
            <p style={{ margin: "0 0 0.25rem 0", textIndent: "35.4pt" }}>
              <strong>(для органов государственной власти и местного самоуправления</strong> - полное и сокращенное наименование органа, реквизиты нормативного правового акта, в соответствии с которым осуществляется деятельность этого органа;
            </p>
            <p style={{ margin: "0 0 0.25rem 0", textIndent: "35.4pt" }}>
              <strong>для юридических лиц</strong> - полное и сокращенное наименования, основной государственный регистрационный номер записи в Едином государственном реестре юридических лиц, идентификационный номер налогоплательщика;
            </p>
            <p style={{ margin: "0 0 0.25rem 0", textIndent: "35.4pt" }}>
              <strong>для индивидуальных предпринимателей</strong> - наименование, основной государственный регистрационный номер записи в Едином государственном реестре индивидуальных предпринимателей, идентификационный номер налогоплательщика;
            </p>
            <p style={{ margin: "0 0 0.5rem 0", textIndent: "35.4pt" }}>
              <strong>для физических лиц</strong> - фамилия, имя, отчество (последнее - при наличии), дата рождения, данные паспорта или иного документа, удостоверяющего личность, идентификационный номер налогоплательщика, страховой номер индивидуального лицевого счета)
            </p>
          </div>

          {/* Пункт 3 */}
          <div>
            <p style={{ margin: "0 0 0.5rem 0", textIndent: "35.4pt" }}>3. Контактные данные лица, обратившегося за выдачей технических условий</p>
            <p style={{ margin: "0 0 0.5rem 0", fontSize: fontSizeLarge, fontFamily: "Times New Roman, serif" }}>
              {underlineField("", 140)}
            </p>
            <div style={{ margin: "0 0 0.5rem 0", textIndent: "35.4pt" }}>
              Адрес регистрации: {formData.registrationAddress || ""}
              {formData.phone && `, телефон: ${formData.phone}`}
            </div>
            <p style={{ margin: "0 0 0.25rem 0", textIndent: "35.4pt" }}>
              (<strong>для органов государственной власти и местного самоуправления</strong> - место нахождения, почтовый адрес, контактный телефон, адрес электронной почты, для юридических лиц - место нахождения и адрес, указанные в Едином государственном реестре юридических лиц, почтовый адрес, фактический адрес, контактный телефон, адрес электронной почты;
            </p>
            <p style={{ margin: "0 0 0.25rem 0", textIndent: "35.4pt" }}>
              <strong>для индивидуальных предпринимателей</strong> - адрес регистрации по месту жительства, почтовый адрес, контактный телефон, адрес электронной почты;
            </p>
            <p style={{ margin: "0 0 0.5rem 0", textIndent: "35.4pt" }}>
              <strong>для физических лиц</strong> - адрес регистрации по месту жительства, почтовый адрес, контактный телефон, адрес электронной почты)
            </p>
          </div>

          {/* Пункт 4 */}
          <div>
            <p style={{ margin: "0 0 0.5rem 0", textIndent: "35.4pt" }}>4. Основания обращения с запросом о выдаче технических условий:</p>
            <p style={{ margin: "0 0 0.5rem 0", fontSize: fontSizeLarge, fontFamily: "Times New Roman, serif" }}>
              {underlineField(formData.lastName ? "Правообладатель земельного участка" : "", 70)}
            </p>
            <div style={{ margin: "0 0 0.5rem 0", textIndent: "35.4pt" }}>
              Правообладатель земельного участка
            </div>
            <p style={{ margin: 0, textIndent: 0 }}>
              (указание, кем именно из перечня лиц, имеющих право обратиться с запросом о выдаче технических условий, указанных в пунктах 9 и 11 Правил подключения (технологического присоединения) объектов капитального строительства к централизованным системам горячего водоснабжения, холодного водоснабжения и (или) водоотведения, утвержденных постановлением Правительства Российской Федерации от 30 ноября 2021 г. № 2130 является данное лицо, а для правообладателя земельного участка также информация о праве лица на земельный участок, на который расположен подключаемый объект основания возникновения такого права)
            </p>
          </div>

          {/* Пункт 5 */}
          <div>
            <p style={{ margin: "0 0 0.5rem 0", textIndent: "35.4pt" }}>
              5. В связи с {underlineField(formData.constructionType || "", 60)} прошу выдать технические условия на подключение (технологическое присоединение)
            </p>
            <p style={{ margin: "0 0 0.25rem 0", textIndent: 0, fontSize: isPreview ? "11px" : "10pt" }}>
              (новым строительством, реконструкцией, модернизацией - указать нужное)
            </p>
            <p style={{ margin: "0 0 0.5rem 0", textIndent: 0 }}>
              объекта капитального строительства, водопроводных и (или) канализационных сетей, иного объекта, не относящегося к объектам капитального строительства (указать нужное):
            </p>
            <p style={{ margin: "0 0 0.25rem 0", fontSize: fontSizeLarge, fontFamily: "Times New Roman, serif" }}>
              {underlineField(
                formData.objectType === "residential" ? "Жилой дом" : 
                formData.objectType === "apartment" ? "Квартира" : 
                formData.objectType === "commercial" ? "Коммерческий объект" : 
                formData.objectType === "industrial" ? "Промышленный объект" : "", 
                70
              )}
            </p>
            <p style={{ margin: "0 0 0.5rem 0", textAlign: "center", fontSize: isPreview ? "13px" : "12pt" }}>
              (наименование объекта или сетей)
            </p>
            <p style={{ margin: "0 0 0.5rem 0", textIndent: 0 }}>
              расположенного (проектируемого) по адресу {underlineField(formData.objectAddress || "", 50)}
            </p>
            <p style={{ margin: "0 0 0.25rem 0", fontSize: fontSizeLarge, fontFamily: "Times New Roman, serif" }}>
              {underlineField("", 70)}
            </p>
            <p style={{ margin: 0, textAlign: "center", fontSize: isPreview ? "11px" : "10pt" }}>
              (место нахождения объекта или сетей)
            </p>
          </div>

          {/* Пункт 6 */}
          <div>
            <p style={{ margin: "0 0 0.5rem 0", textIndent: "35.4pt" }}>
              6. Требуется подключение к централизованной системе {underlineField(
                formData.connectionTypeWater && formData.connectionTypeSewerage 
                  ? "холодного водоснабжения, водоотведения" 
                  : formData.connectionTypeWater 
                    ? "холодного водоснабжения" 
                    : formData.connectionTypeSewerage 
                      ? "водоотведения" 
                      : "", 
                20
              )}
            </p>
            <p style={{ margin: 0 }}>{underlineField("", 70)}</p>
            <p style={{ margin: "0.25rem 0 0 0", textAlign: "center", fontSize: isPreview ? "9px" : "9pt" }}>
              (холодного водоснабжения, водоотведения – указать нужное)
            </p>
          </div>

          {/* Пункт 7 */}
          <div>
            <p style={{ margin: "0 0 0.5rem 0", textIndent: "35.4pt" }}>
              7. Необходимые виды ресурсов или услуг, планируемых к получению через централизованную систему {underlineField(
                formData.resourceType || "получение питьевой воды, сброс хозяйственно-бытовых сточных вод", 
                60
              )}
            </p>
            <p style={{ margin: 0, textIndent: "35.4pt", fontSize: isPreview ? "9px" : "9pt" }}>
              (получение питьевой или технической воды, сброс хозяйственно-бытовых, сточных вод)
            </p>
          </div>

          {/* Пункт 8 */}
          <div>
            <p style={{ margin: "0 0 0.5rem 0", textIndent: "35.4pt" }}>
              8. Информация о предельных параметрах разрешенного строительства (реконструкции) подключаемых объектов, соответствующих указанному земельному участку{underlineField(
                [
                  formData.objectHeight && `Высота: ${formData.objectHeight} м`,
                  formData.objectFloors && `Этажность: ${formData.objectFloors}`,
                  formData.networkLength && `Протяженность сети: ${formData.networkLength} м`,
                  formData.pipeDiameter && `Диаметр: ${formData.pipeDiameter} мм`
                ].filter(Boolean).join(", ") || "", 
                60
              )}
            </p>
            <p style={{ margin: 0, textAlign: "center", fontSize: isPreview ? "9px" : "9pt" }}>
              (высота объекта, этажность, протяженность и диаметр сети)
            </p>
          </div>

          {/* Пункт 9 */}
          <div>
            <p style={{ margin: "0 0 0.5rem 0", textIndent: "35.4pt" }}>
              9. Планируемый срок ввода в эксплуатацию подключаемого объекта{underlineField(formData.plannedCommissioningDate || "", 15)}
            </p>
            <p style={{ margin: "0 0 0 247.8pt", fontSize: isPreview ? "9px" : "9pt" }}>
              (указывается при наличии соответствующей информации)
            </p>
          </div>

          {/* Пункт 10 */}
          <div>
            <p style={{ margin: "0 0 0.5rem 0", textIndent: "35.4pt" }}>
              10. Планируемая величина максимальной необходимой мощности (нагрузки) составляет для:
            </p>
            <p style={{ margin: "0 0 0.25rem 0", textIndent: "35.4pt" }}>
              <strong>потребления холодной воды</strong> {underlineField(formData.maxWaterConsumptionLps || "", 7)}л/с, {underlineField(formData.maxWaterConsumptionM3h || "", 7)} куб.м/час, {underlineField(formData.maxWaterConsumptionM3day || "", 5)}куб. м./сутки,
            </p>
            <p style={{ margin: "0 0 0.25rem 0", textIndent: 0 }}>
              в том числе на нужды пожаротушения - наружного {underlineField(formData.fireExtinguishingExternal || "", 5)} л/сек, внутреннего {underlineField(formData.fireExtinguishingInternal || "", 4)} л/сек. (количество пожарных кранов {underlineField(formData.fireHydrantsCount || "", 5)} штук), автоматическое {underlineField(formData.fireExtinguishingAutomatic || "", 5)} л/сек.
            </p>
            <p style={{ margin: 0, textIndent: "35.4pt" }}>
              <strong>водоотведения</strong> {underlineField(formData.wastewaterLps || "", 7)}л/с {underlineField(formData.wastewaterM3h || "", 7)}куб. м/час, {underlineField(formData.wastewaterM3day || "", 5)}куб. м/сутки
            </p>
          </div>

          {/* Пункт 11 */}
          <div>
            <p style={{ margin: "0 0 0.5rem 0", textIndent: "35.4pt" }}>
              11. Результаты рассмотрения запроса прошу направить (выбрать один из способов уведомления){underlineField(formData.notificationMethod || "на адрес электронной почты", 60)}
            </p>
            <p style={{ margin: 0, textAlign: "center", fontSize: isPreview ? "11px" : "10pt" }}>
              (на адрес электронной почты, письмом посредством почтовой связи по адресу, иной способ)
            </p>
          </div>

          {/* Согласие */}
          <div style={{ marginTop: "1rem", textIndent: "36pt" }}>
            <p style={{ margin: 0 }}>Заявитель дает согласие на обработку персональных данных для оформления процедуры выдачи ТУ и заключения ДТП.</p>
          </div>

          {/* Примечание */}
          <div style={{ marginTop: "1rem", textIndent: "36pt" }}>
            <p style={{ margin: 0, fontSize: isPreview ? "13px" : "12pt", lineHeight: "1.4" }}>
              <strong>Примечание.</strong> К настоящему запросу прилагаются документы, предусмотренные пунктом 14 Правил подключения (технологического присоединения) объектов капитального строительства к централизованным системам горячего водоснабжения, холодного водоснабжения и (или) водоотведения, утвержденных постановлением Правительства Российской Федерации от 30 ноября 2021 г. №2130 «Об утверждении Правил подключения (технологического присоединения) объектов капитального строительства к централизованным системам горячего водоснабжения, холодного водоснабжения и (или) водоотведения и о внесении изменений и признании утратившими силу некоторых актов Правительства Российской Федерации».
            </p>
          </div>

          {/* Дата и подпись */}
          <div style={{ marginTop: "2rem", textIndent: 0 }}>
            <p style={{ margin: 0 }}>
              «____»_____________20__ г. {underlineField("", 20)} (М.П., подпись) {underlineField(formData.lastName && formData.firstName ? `${formData.lastName} ${formData.firstName} ${formData.middleName || ""}` : "", 20)} (Ф.И.О.)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
