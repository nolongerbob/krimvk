// Компонент для отображения заявления в формате, соответствующем оригинальному PDF
export function ApplicationForm({ formData, isPreview = false }: { formData: any; isPreview?: boolean }) {
  const containerClass = isPreview 
    ? "border rounded-lg p-6 bg-white mb-4 max-h-[600px] overflow-y-auto"
    : "bg-white";
  
  const textClass = isPreview ? "text-xs" : "text-[11pt]";
  const borderClass = isPreview ? "border-gray-400" : "border-black";

  return (
    <div className={containerClass} style={{ fontFamily: "Times New Roman, serif", lineHeight: "1.5" }}>
      <div className={textClass}>
        {/* Приложение №1 справа */}
        <div className="text-right mb-2">
          <p>Приложение №1</p>
        </div>

        {/* Заголовок */}
        <div className="text-center mb-4">
          <p className="mb-2 leading-relaxed">
            к Правилам подключения (технологического присоединения) объектов капитального строительства к централизованным системам горячего водоснабжения, холодного водоснабжения и (или) водоотведения
          </p>
          <h2 className="text-base font-bold mb-1 mt-3">ЗАПРОС</h2>
          <p>о выдаче технических условий на подключение</p>
          <p>(технологическое присоединение) к централизованным системам</p>
          <p>холодного водоснабжения и (или) водоотведения</p>
        </div>

        <div className="space-y-4">
          {/* Пункт 1 */}
          <div>
            <p className="mb-1 font-semibold">1. Наименование исполнителя, которому направлен запрос</p>
            <p className="ml-4">ООО «Крымская Водная Компания»</p>
          </div>

          {/* Пункт 2 */}
          <div>
            <p className="mb-1 font-semibold">2. Сведения о лице, обратившемся с запросом</p>
            <p className="ml-4 text-[9px] leading-tight mb-2 text-gray-600">
              (для органов государственной власти и местного самоуправления - полное и сокращенное наименование органа, реквизиты нормативного правового акта, в соответствии с которым осуществляется деятельность этого органа;<br/>
              для юридических лиц - полное и сокращенное наименования, основной государственный регистрационный номер записи в Едином государственном реестре юридических лиц, идентификационный номер налогоплательщика;<br/>
              для индивидуальных предпринимателей - наименование, основной государственный регистрационный номер записи в Едином государственном реестре индивидуальных предпринимателей, идентификационный номер налогоплательщика;<br/>
              для физических лиц - фамилия, имя, отчество (последнее - при наличии), дата рождения, данные паспорта или иного документа, удостоверяющего личность, идентификационный номер налогоплательщика, страховой номер индивидуального лицевого счета)
            </p>
            <div className={`ml-4 border-b ${borderClass} min-h-[60px] py-1`}>
              {formData.lastName} {formData.firstName} {formData.middleName}
              {formData.birthDate && `, дата рождения: ${formData.birthDate}`}
              {formData.passportSeries && formData.passportNumber && `, паспорт серия ${formData.passportSeries} № ${formData.passportNumber}`}
              {formData.passportIssuedBy && `, выдан ${formData.passportIssuedBy}`}
              {formData.passportIssueDate && `, дата выдачи ${formData.passportIssueDate}`}
              {formData.passportDivisionCode && `, код подразделения ${formData.passportDivisionCode}`}
              {formData.inn && `, ИНН ${formData.inn}`}
              {formData.snils && `, СНИЛС ${formData.snils}`}
            </div>
          </div>

          {/* Пункт 3 */}
          <div>
            <p className="mb-1 font-semibold">3. Контактные данные лица, обратившегося за выдачей технических условий</p>
            <p className="ml-4 text-[9px] leading-tight mb-2 text-gray-600">
              (для органов государственной власти и местного самоуправления - место нахождения, почтовый адрес, контактный телефон, адрес электронной почты, для юридических лиц - место нахождения и адрес, указанные в Едином государственном реестре юридических лиц, почтовый адрес, фактический адрес, контактный телефон, адрес электронной почты;<br/>
              для индивидуальных предпринимателей - адрес регистрации по месту жительства, почтовый адрес, контактный телефон, адрес электронной почты;<br/>
              для физических лиц - адрес регистрации по месту жительства, почтовый адрес, контактный телефон, адрес электронной почты)
            </p>
            <div className={`ml-4 border-b ${borderClass} min-h-[40px] py-1`}>
              Адрес регистрации: {formData.registrationAddress || "_________________"}
              {formData.phone && `, телефон: ${formData.phone}`}
            </div>
          </div>

          {/* Пункт 4 */}
          <div>
            <p className="mb-1 font-semibold">4. Основания обращения с запросом о выдаче технических условий:</p>
            <p className="ml-4 text-[9px] leading-tight mb-2 text-gray-600">
              (указание, кем именно из перечня лиц, имеющих право обратиться с запросом о выдаче технических условий, указанных в пунктах 9 и 11 Правил подключения (технологического присоединения) объектов капитального строительства к централизованным системам горячего водоснабжения, холодного водоснабжения и (или) водоотведения, утвержденных постановлением Правительства Российской Федерации от 30 ноября 2021 г. № 2130 является данное лицо, а для правообладателя земельного участка также информация о праве лица на земельный участок, на который расположен подключаемый объект основания возникновения такого права)
            </p>
            <div className={`ml-4 border-b ${borderClass} min-h-[40px] py-1`}>
              Правообладатель земельного участка
            </div>
          </div>

          {/* Пункт 5 */}
          <div>
            <p className="mb-1 font-semibold">
              5. В связи с <span className={`border-b ${borderClass} inline-block min-w-[200px] px-1`}>{formData.constructionType || "_________________"}</span> прошу выдать технические условия на подключение (технологическое присоединение)
            </p>
            <p className="ml-4 text-[9px] leading-tight mb-1 text-gray-600">(новым строительством, реконструкцией, модернизацией - указать нужное)</p>
            <p className="ml-4 mb-1">объекта капитального строительства, водопроводных и (или) канализационных сетей, иного объекта, не относящегося к объектам капитального строительства (указать нужное):</p>
            <div className={`ml-4 border-b ${borderClass} min-h-[30px] mb-1 py-1`}>
              {formData.objectType === "residential" ? "Жилой дом" : formData.objectType === "apartment" ? "Квартира" : formData.objectType === "commercial" ? "Коммерческий объект" : formData.objectType === "industrial" ? "Промышленный объект" : "_________________"}
            </div>
            <p className="ml-4 text-[9px] leading-tight mb-1 text-gray-600">(наименование объекта или сетей)</p>
            <p className="ml-4 mt-1">расположенного (проектируемого) по адресу:</p>
            <div className={`ml-4 border-b ${borderClass} min-h-[30px] mb-1 py-1`}>
              {formData.objectAddress || "_________________"}
            </div>
            <p className="ml-4 text-[9px] leading-tight text-gray-600">(место нахождения объекта или сетей)</p>
          </div>

          {/* Пункт 6 */}
          <div>
            <p className="mb-1 font-semibold">6. Требуется подключение к централизованной системе</p>
            <p className="ml-4 text-[9px] leading-tight mb-1 text-gray-600">(холодного водоснабжения, водоотведения – указать нужное)</p>
            <div className={`ml-4 border-b ${borderClass} min-h-[30px] mb-1 py-1`}>
              {formData.connectionTypeWater && "холодного водоснабжения"} {formData.connectionTypeWater && formData.connectionTypeSewerage && ", "} {formData.connectionTypeSewerage && "водоотведения"}
              {!formData.connectionTypeWater && !formData.connectionTypeSewerage && "_________________"}
            </div>
          </div>

          {/* Пункт 7 */}
          <div>
            <p className="mb-1 font-semibold">7. Необходимые виды ресурсов или услуг, планируемых к получению через централизованную систему</p>
            <p className="ml-4 text-[9px] leading-tight mb-1 text-gray-600">(получение питьевой или технической воды, сброс хозяйственно-бытовых, сточных вод)</p>
            <div className={`ml-4 border-b ${borderClass} min-h-[30px] mb-1 py-1`}>
              {formData.resourceType || "получение питьевой воды, сброс хозяйственно-бытовых сточных вод"}
            </div>
          </div>

          {/* Пункт 8 */}
          <div>
            <p className="mb-1 font-semibold">8. Информация о предельных параметрах разрешенного строительства (реконструкции) подключаемых объектов, соответствующих указанному земельному участку</p>
            <p className="ml-4 text-[9px] leading-tight mb-1 text-gray-600">(высота объекта, этажность, протяженность и диаметр сети)</p>
            <div className={`ml-4 border-b ${borderClass} min-h-[30px] mb-1 py-1`}>
              {formData.objectHeight && `Высота: ${formData.objectHeight} м, `}
              {formData.objectFloors && `Этажность: ${formData.objectFloors}, `}
              {formData.networkLength && `Протяженность сети: ${formData.networkLength} м, `}
              {formData.pipeDiameter && `Диаметр: ${formData.pipeDiameter} мм`}
              {!formData.objectHeight && !formData.objectFloors && !formData.networkLength && !formData.pipeDiameter && "_________________"}
            </div>
          </div>

          {/* Пункт 9 */}
          <div>
            <p className="mb-1 font-semibold">9. Планируемый срок ввода в эксплуатацию подключаемого объекта</p>
            <p className="ml-4 text-[9px] leading-tight mb-1 text-gray-600">(указывается при наличии соответствующей информации)</p>
            <div className={`ml-4 border-b ${borderClass} min-h-[30px] mb-1 py-1`}>
              {formData.plannedCommissioningDate || "_________________"}
            </div>
          </div>

          {/* Пункт 10 */}
          <div>
            <p className="mb-1 font-semibold">10. Планируемая величина максимальной необходимой мощности (нагрузки) составляет для:</p>
            <p className="ml-4">
              потребления холодной воды <span className={`border-b ${borderClass} inline-block min-w-[40px] text-center px-1`}>{formData.maxWaterConsumptionLps || "____"}</span> л/с, <span className={`border-b ${borderClass} inline-block min-w-[40px] text-center px-1`}>{formData.maxWaterConsumptionM3h || "____"}</span> куб.м/час, <span className={`border-b ${borderClass} inline-block min-w-[40px] text-center px-1`}>{formData.maxWaterConsumptionM3day || "____"}</span> куб. м./сутки,
            </p>
            <p className="ml-4">
              в том числе на нужды пожаротушения - наружного <span className={`border-b ${borderClass} inline-block min-w-[40px] text-center px-1`}>{formData.fireExtinguishingExternal || "____"}</span> л/сек, внутреннего <span className={`border-b ${borderClass} inline-block min-w-[40px] text-center px-1`}>{formData.fireExtinguishingInternal || "____"}</span> л/сек. (количество пожарных кранов <span className={`border-b ${borderClass} inline-block min-w-[40px] text-center px-1`}>{formData.fireHydrantsCount || "____"}</span> штук), автоматическое <span className={`border-b ${borderClass} inline-block min-w-[40px] text-center px-1`}>{formData.fireExtinguishingAutomatic || "____"}</span> л/сек.
            </p>
            <p className="ml-4">
              водоотведения <span className={`border-b ${borderClass} inline-block min-w-[40px] text-center px-1`}>{formData.wastewaterLps || "____"}</span> л/с <span className={`border-b ${borderClass} inline-block min-w-[40px] text-center px-1`}>{formData.wastewaterM3h || "____"}</span> куб. м/час, <span className={`border-b ${borderClass} inline-block min-w-[40px] text-center px-1`}>{formData.wastewaterM3day || "____"}</span> куб. м/сутки
            </p>
          </div>

          {/* Пункт 11 */}
          <div>
            <p className="mb-1 font-semibold">11. Результаты рассмотрения запроса прошу направить (выбрать один из способов уведомления)</p>
            <p className="ml-4 text-[9px] leading-tight mb-1 text-gray-600">(на адрес электронной почты, письмом посредством почтовой связи по адресу, иной способ)</p>
            <div className={`ml-4 border-b ${borderClass} min-h-[30px] mb-1 py-1`}>
              {formData.notificationMethod || "на адрес электронной почты"}
            </div>
          </div>

          {/* Согласие */}
          <div className="mt-4">
            <p className="text-xs">Заявитель дает согласие на обработку персональных данных для оформления процедуры выдачи ТУ и заключения ДТП.</p>
          </div>

          {/* Примечание */}
          <div className="mt-4">
            <p className="text-[9px] leading-tight text-gray-600">
              <strong>Примечание.</strong> К настоящему запросу прилагаются документы, предусмотренные пунктом 14 Правил подключения (технологического присоединения) объектов капитального строительства к централизованным системам горячего водоснабжения, холодного водоснабжения и (или) водоотведения, утвержденных постановлением Правительства Российской Федерации от 30 ноября 2021 г. №2130 «Об утверждении Правил подключения (технологического присоединения) объектов капитального строительства к централизованным системам горячего водоснабжения, холодного водоснабжения и (или) водоотведения и о внесении изменений и признании утратившими силу некоторых актов Правительства Российской Федерации».
            </p>
          </div>

          {/* Дата и подпись */}
          <div className="mt-6 flex justify-between items-end">
            <div>
              <p className="text-xs">«____»_____________20__ г.</p>
            </div>
            <div className="text-right">
              <p className="text-xs mb-8 border-b border-black inline-block min-w-[150px]"></p>
              <p className="text-xs">(М.П., подпись)</p>
              <p className="text-xs mt-2 border-b border-black inline-block min-w-[150px]">{formData.lastName} {formData.firstName} {formData.middleName}</p>
              <p className="text-xs">(Ф.И.О.)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

