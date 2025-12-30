"use client";

// Компонент для отображения заявления в формате, соответствующем оригинальному PDF
export function ApplicationForm({ formData, isPreview = false }: { formData: any; isPreview?: boolean }) {
  const containerClass = isPreview 
    ? "border rounded-lg p-6 bg-white mb-4 max-h-[600px] overflow-y-auto"
    : "bg-white";
  
  const containerStyle = isPreview ? {} : {
    width: "170mm", // 210mm - 40mm (20mm слева + 20mm справа)
    maxWidth: "170mm",
    margin: "0",
    padding: "0",
    boxSizing: "border-box" as const,
  };
  
  const fontSize = isPreview ? "10px" : "9pt"; // Еще уменьшили шрифт
  const fontSizeLarge = isPreview ? "17px" : "14pt"; // Уменьшили заголовок пропорционально

  // Функция для создания строки подчеркивания с данными
  const underlineField = (text: string, length: number = 70) => {
    const textLength = text ? text.length : 0;
    const underlineLength = Math.max(0, length - textLength);
    return text + "_".repeat(underlineLength);
  };

  // Собираем данные для пункта 2
  const personData = [
    formData.lastName && formData.firstName && formData.middleName ? `${formData.lastName} ${formData.firstName} ${formData.middleName}` : "",
    formData.birthDate ? `, дата рождения: ${formData.birthDate}` : "",
    formData.passportSeries && formData.passportNumber ? `, паспорт серия ${formData.passportSeries} № ${formData.passportNumber}` : "",
    formData.passportIssuedBy ? `, выдан ${formData.passportIssuedBy}` : "",
    formData.passportIssueDate ? `, дата выдачи ${formData.passportIssueDate}` : "",
    formData.passportDivisionCode ? `, код подразделения ${formData.passportDivisionCode}` : "",
    formData.inn ? `, ИНН ${formData.inn}` : "",
    formData.snils ? `, СНИЛС ${formData.snils}` : ""
  ].filter(Boolean).join("");

  // Контактные данные для пункта 3
  const contactData = [
    formData.registrationAddress ? `Адрес регистрации: ${formData.registrationAddress}` : "",
    formData.phone ? (formData.registrationAddress ? ", " : "") + `телефон: ${formData.phone}` : ""
  ].filter(Boolean).join("");

  return (
    <div className={containerClass} style={{ fontFamily: "Times New Roman, serif", lineHeight: "1.5", fontSize: fontSize, ...containerStyle }}>
      {/* Приложение №1 */}
      <p style={{ margin: 0, textAlign: "right", textIndent: "34.9pt", fontWeight: "bold" }}>
        <span>Приложение №1<br/>к </span>
        <span>Правилам</span>
        <span> подключения<br/>(технологического присоединения)<br/>объектов капитального строительства<br/>к централизованным системам<br/>горячего водоснабжения,<br/>холодного водоснабжения<br/>и (или) водоотведения</span>
      </p>
      
      {/* ЗАПРОС */}
      <p style={{ margin: 0, textAlign: "center", fontWeight: "bold", fontSize: fontSizeLarge }}>
        <span>ЗАПРОС</span>
      </p>
      <p style={{ margin: 0, textAlign: "center", fontWeight: "bold" }}>
        <span>о выдаче технических условий на подключение</span>
      </p>
      <p style={{ margin: 0, textAlign: "center", fontWeight: "bold" }}>
        <span>(технологическое присоединение) к централизованным системам</span>
      </p>
      <p style={{ margin: 0, textAlign: "center", fontWeight: "bold" }}>
        <span>холодного водоснабжения и (или) водоотведения</span>
      </p>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
        <span> </span>
      </p>
      
      {/* Пункт 1 */}
      <div style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
        <ol style={{ listStyleType: "decimal", marginLeft: "43.4px" }}>
          <li style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
            <span>Наименование исполнителя, которому направлен запрос</span>
          </li>
        </ol>
      </div>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}> </p>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: 0, textDecoration: "underline", fontSize: fontSizeLarge, fontWeight: "bold" }}>
        <span> <strong>ООО «Крымская Водная Компания»</strong></span>
      </p>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
        <span> </span>
      </p>
      
      {/* Пункт 2 */}
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <span>2. Сведения о лице, обратившемся с запросом</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: 0, fontSize: fontSize }}>
        <span>{underlineField(personData.substring(0, 70), 70)}</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: 0 }}>
        {underlineField(personData.substring(70, 140), 70)}
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: 0 }}>
        {underlineField(personData.substring(140, 210), 70)}
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: 0 }}>
        {underlineField(personData.substring(210, 280), 70)}
      </p>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <strong><span>(для органов государственной  власти  и  местного   самоуправления</span></strong><span> - полное  и  сокращенное  наименование  органа,  реквизиты  нормативного правового акта, в соответствии  с  которым  осуществляется  деятельность этого органа;</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <strong><span>для юридических лиц</span></strong><span> - полное и сокращенное  наименования,  основной государственный регистрационный номер записи  в  Едином  государственном реестре юридических лиц, идентификационный номер налогоплательщика;</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <strong><span>для  индивидуальных  предпринимателей</span></strong><span>  -  наименование,  основной государственный регистрационный номер записи  в  Едином  государственном реестре  индивидуальных  предпринимателей,  идентификационный  номер налогоплательщика;</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <strong><span>для физических лиц</span></strong><span>  -  фамилия,  имя,  отчество  (последнее  -  при наличии),  дата  рождения,  данные  паспорта  или  иного  документа, удостоверяющего личность,  идентификационный  номер  налогоплательщика, страховой номер индивидуального лицевого счета)</span>
      </p>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
        <span> </span>
      </p>
      
      {/* Пункт 3 */}
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <span>3. Контактные данные лица, обратившегося  за  выдачей   технических условий</span>
      </p>
      {formData.registrationAddress && (
        <p style={{ margin: 0, textAlign: "justify", textIndent: 0, fontSize: fontSize }}>
          <span>{underlineField(`Адрес регистрации: ${formData.registrationAddress}`, 70)}</span>
        </p>
      )}
      {formData.phone && (
        <p style={{ margin: 0, textAlign: "justify", textIndent: 0, fontSize: fontSize }}>
          <span>{underlineField(`телефон: ${formData.phone}`, 70)}</span>
        </p>
      )}
      {!formData.registrationAddress && !formData.phone && (
        <p style={{ margin: 0, textAlign: "justify", textIndent: 0, fontSize: fontSize }}>
          <span>{underlineField("", 70)}</span>
        </p>
      )}
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <span>(<strong>для органов государственной власти  и  местного  самоуправления</strong> - место нахождения, почтовый адрес, контактный телефон, адрес   электронной почты, для юридических лиц - место нахождения и адрес, указанные в Едином государственном реестре юридических  лиц,  почтовый  адрес,   фактический адрес, контактный телефон, адрес электронной почты; </span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <strong><span>для  индивидуальных предпринимателей</span></strong><span> - адрес регистрации по месту жительства, почтовый адрес, контактный телефон, адрес электронной почты;</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <strong><span>для физических лиц </span></strong><span>-  адрес регистрации по месту жительства,  почтовый  адрес,  контактный  телефон, адрес электронной почты)</span>
      </p>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
        <span> </span>
      </p>
      
      {/* Пункт 4 */}
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <span>4. Основания обращения с запросом о выдаче технических условий:</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: 0, fontSize: fontSize }}>
        <span>{underlineField(formData.lastName ? "Правообладатель земельного участка" : "", 70)}</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: 0 }}>
        <span>  </span><span>(указание, кем именно из перечня лиц, имеющих  право  обратиться  с запросом о выдаче технических условий, указанных в </span>
        <span>пунктах 9</span>
        <span>  и </span>
        <span>11</span>
        <span> Правил подключения  (технологического  присоединения)  объектов  капитального строительства  к  централизованным  системам  горячего  водоснабжения, холодного  водоснабжения  и (или)  водоотведения,  утвержденных</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: 0 }}>
        <span>постановлением</span>
        <span> Правительства Российской Федерации от 30 ноября  2021  г. № 2130 является данное лицо, а для  правообладателя  земельного  участка также информация о праве лица на земельный участок, на который расположен подключаемый объект основания возникновения такого права)</span>
      </p>
      
      <p style={{ margin: 0 }}> </p>
      
      {/* Пункт 5 */}
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <span>5. В связи с {underlineField(formData.constructionType || "", 60)}</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: 0, fontSize: isPreview ? "11px" : "10pt" }}>
        <span>                                                                     (новым строительством, реконструкцией, модернизацией - указать нужное)</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: 0 }}>
        <span>прошу выдать технические условия  на  подключение  (технологическое присоединение) объекта капитального строительства, водопроводных и (или) канализационных  сетей,  иного  объекта,  не  относящегося  к   объектам капитального строительства (указать нужное):</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: 0, fontSize: fontSize }}>
        <span>{underlineField(
          formData.objectType === "residential" ? "Жилой дом" : 
          formData.objectType === "apartment" ? "Квартира" : 
          formData.objectType === "commercial" ? "Коммерческий объект" : 
          formData.objectType === "industrial" ? "Промышленный объект" : "", 
          70
        )}</span>
      </p>
      <p style={{ margin: 0, textAlign: "center", fontSize: isPreview ? "13px" : "12pt" }}>
        <span>(наименование объекта или сетей)</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: 0 }}>
        <span>расположенного (проектируемого) по адресу {underlineField(formData.objectAddress || "", 50)}</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: 0, fontSize: fontSize }}>
        <span>{underlineField("", 70)}</span>
      </p>
      <p style={{ margin: 0, textAlign: "center", fontSize: isPreview ? "11px" : "10pt" }}>
        <span>(место нахождения объекта или сетей)</span>
      </p>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
        <span> </span>
      </p>
      
      {/* Пункт 6 */}
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <span>6. Требуется подключение к централизованной системе</span>
        <span> {underlineField(
          formData.connectionTypeWater && formData.connectionTypeSewerage 
            ? "холодного водоснабжения, водоотведения" 
            : formData.connectionTypeWater 
              ? "холодного водоснабжения" 
              : formData.connectionTypeSewerage 
                ? "водоотведения" 
                : "", 
          20
        )}</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: 0 }}>
        {underlineField("", 70)}
      </p>
      <p style={{ margin: 0, textAlign: "center", fontSize: isPreview ? "9px" : "9pt" }}>
        <span>(холодного водоснабжения, водоотведения – указать нужное)</span>
      </p>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
        <span> </span>
      </p>
      
      {/* Пункт 7 */}
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <span>7. Необходимые виды ресурсов или  услуг,  планируемых  к   получению через централизованную систему {underlineField(
          formData.resourceType || "получение питьевой воды, сброс хозяйственно-бытовых сточных вод", 
          60
        )}</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt", fontSize: isPreview ? "9px" : "9pt" }}>
        <span>                                                                     (получение питьевой или технической воды, сброс хозяйственно-бытовых, сточных вод)</span>
      </p>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
        <span> </span>
      </p>
      
      {/* Пункт 8 */}
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <span>8. Информация о предельных  параметрах  разрешенного  строительства (реконструкции)  подключаемых объектов,  соответствующих указанному земельному участку</span>
        <span>{underlineField(
          [
            formData.objectHeight && `Высота: ${formData.objectHeight} м`,
            formData.objectFloors && `Этажность: ${formData.objectFloors}`,
            formData.networkLength && `Протяженность сети: ${formData.networkLength} м`,
            formData.pipeDiameter && `Диаметр: ${formData.pipeDiameter} мм`
          ].filter(Boolean).join(", ") || "", 
          60
        )}</span>
      </p>
      <p style={{ margin: 0, textAlign: "center", fontSize: isPreview ? "9px" : "9pt" }}>
        <span>(высота объекта, этажность, протяженность и диаметр сети)</span>
      </p>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
        <span> </span>
      </p>
      
      {/* Пункт 9 */}
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <span>9. Планируемый срок  ввода  в  эксплуатацию  подключаемого объекта {underlineField(formData.plannedCommissioningDate || "", 15)}</span>
      </p>
      <p style={{ margin: "0 0 0 247.8pt", fontSize: isPreview ? "9px" : "9pt" }}>
        <span>  (указывается при наличии соответствующей информации)</span>
      </p>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
        <span> </span>
      </p>
      
      {/* Пункт 10 */}
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <span>10.  Планируемая  величина  максимальной  необходимой мощности (нагрузки) составляет для:</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <strong><span>потребления холодной воды</span></strong>
        <span> {underlineField(formData.maxWaterConsumptionLps || "", 7)}л/с, {underlineField(formData.maxWaterConsumptionM3h || "", 7)}  куб.м/час, {underlineField(formData.maxWaterConsumptionM3day || "", 5)}куб. м./сутки,</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: 0 }}>
        <span>в том числе на нужды пожаротушения - наружного  {underlineField(formData.fireExtinguishingExternal || "", 5)}  л/сек, внутреннего {underlineField(formData.fireExtinguishingInternal || "", 4)}  л/сек.  (количество  пожарных  кранов  {underlineField(formData.fireHydrantsCount || "", 5)}  штук), автоматическое {underlineField(formData.fireExtinguishingAutomatic || "", 5)} л/сек.</span>
      </p>
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <strong><span>водоотведения</span></strong>
        <span> {underlineField(formData.wastewaterLps || "", 7)}л/с {underlineField(formData.wastewaterM3h || "", 7)}куб. м/час, {underlineField(formData.wastewaterM3day || "", 5)}куб. м/сутки</span>
      </p>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
        <span> </span>
      </p>
      
      {/* Пункт 11 */}
      <p style={{ margin: 0, textAlign: "justify", textIndent: "35.4pt" }}>
        <span>11. Результаты рассмотрения запроса прошу направить</span>
        <span> </span>
        <span>(выбрать один из</span>
        <span> способов уведомления)</span>
        <span>{underlineField(formData.notificationMethod || "на адрес электронной почты", 60)}</span>
      </p>
      <p style={{ margin: 0, textAlign: "center", fontSize: isPreview ? "11px" : "10pt" }}>
        <span>                                                                     (на адрес электронной почты, письмом посредством почтовой связи по адресу, иной способ)</span>
      </p>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
        <span> </span>
      </p>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
        <span> </span>
      </p>
      
      {/* Согласие */}
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
        <span>Заявитель дает согласие на обработку персональных данных для оформления процедуры выдачи ТУ и заключения ДТП.</span>
      </p>
      
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt" }}>
        <span> </span>
      </p>
      
      {/* Примечание */}
      <p style={{ margin: 0, textAlign: "justify", textIndent: "36pt", fontSize: isPreview ? "13px" : "12pt", lineHeight: "1.4" }}>
        <span><span>Примечание</span></span>
        <span>. К настоящему запросу прилагаются документы,</span>
        <span> предусмотренные  </span>
        <span>пунктом  14</span>
        <span>  Правил  подключения  (технологического присоединения) объектов капитального  строительства  к  централизованным системам  горячего  водоснабжения,  холодного  водоснабжения  и  (или) водоотведения,  утвержденных  </span>
        <span>постановлением</span>
        <span>  Правительства Российской Федерации от 30 ноября 2021 г. №2130 «Об утверждении Правил подключения (технологического присоединения) объектов капитального строительства к централизованным системам горячего водоснабжения, холодного водоснабжения и (или) водоотведения и о внесении изменений и признании утратившими силу некоторых актов Правительства Российской Федерации».</span>
      </p>
      
      <p style={{ margin: "15pt 0 5pt 0", textAlign: "justify", textIndent: 0 }}></p>
      
      {/* Дата и подпись */}
      <div style={{ margin: 0, textAlign: "justify", textIndent: 0, fontSize: fontSize, lineHeight: "1.5" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3pt" }}>
          <span style={{ whiteSpace: "nowrap" }}>«____»_____________20__ г.</span>
          <span style={{ whiteSpace: "nowrap" }}>{underlineField("", 15)}</span>
          <span style={{ whiteSpace: "nowrap" }}>{underlineField(
            formData.lastName && formData.firstName 
              ? `${formData.lastName} ${formData.firstName} ${formData.middleName || ""}`.trim()
              : "", 
            20
          )}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "top" }}>
          <span style={{ width: "30%" }}></span>
          <span style={{ textAlign: "center", width: "35%" }}>(М.П., подпись)</span>
          <span style={{ textAlign: "right", width: "35%" }}>(Ф.И.О.)</span>
        </div>
      </div>
    </div>
  );
}
