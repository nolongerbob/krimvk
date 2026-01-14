const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestContract() {
  try {
    const contract = await prisma.contract.create({
      data: {
        contractNumber: "ДГ-2024-001",
        contractDate: "26.06.2020",
        status: "COMPLETED",
        
        // Информация об абоненте
        lastName: "Артемов",
        firstName: "Александр",
        middleName: "Вячеславович",
        birthDate: "15.03.1985",
        registrationAddress: "Россия, Челябинская обл., г. Челябинск, ул. Косарева, дом 8, кв. 121",
        passportSeries: "4501",
        passportNumber: "234567",
        passportIssuedBy: "Отделом УФМС России по Челябинской области в Ленинском районе г. Челябинска",
        passportIssueDate: "20.05.2005",
        passportDivisionCode: "450-001",
        phone: "+7 912 307 15 42",
        
        // Информация об объекте
        objectType: "Земельный участок",
        objectPurpose: "индивидуальное жилищное строительство",
        cadastralNumber: "90:11:210101:917",
        objectAddress: "Россия, Республика Крым, Сакский р-н, с. Суворовское, ул. Полевая, д. 3",
        objectArea: "800",
        siteMaster: "Иванов Иван Иванович",
        position: "Мастер участка",
        objectBasis: "договора купли-продажи земельного участка от 21.03.2019",
        
        // Параметры присоединения
        hasWaterSupply: true,
        hasSewerage: false,
        connectionType: "with-well",
        wellType: "planned",
        requestedLoad: "1.00",
        connectionPoint: "по ул. Полевая, в районе земельного участка № 2",
        pipeDiameter: "220",
        pipeMaterial: "Чугун",
        waterSupplyRestriction: false,
        privateNetworkPermission: false,
        
        // Ход подключения
        receiptDate: "24.05.2019",
        technicalConditionsIssueDate: "27.05.2019",
        technicalConditionsNumber: "246",
        connectionAgreementIssueDate: "25.06.2019",
        connectionAgreementNumber: "360",
        designAgreementIssueDate: "24.05.2019",
        designAgreementNumber: "223/05/0-2019",
        costWithVAT: "6685",
        
        contractFileUrl: null,
        contractFileName: null,
        contractFileSize: null,
        contractFileMimeType: null,
      },
    });

    console.log('✅ Тестовый договор успешно создан!');
    console.log('ID:', contract.id);
    console.log('Номер договора:', contract.contractNumber);
    console.log('ФИО:', `${contract.lastName} ${contract.firstName} ${contract.middleName}`);
    console.log('\nДоговор доступен по адресу: /admin/contracts');
  } catch (error) {
    console.error('❌ Ошибка при создании договора:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestContract();
