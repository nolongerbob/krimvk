import { buildMeterReadingsFromDevices, hasValidMeterReadings } from "@/lib/receipt-meter-mapping";

describe("receipt meter mapping", () => {
  it("maps full MeteringDevices payload without losing values", () => {
    const rows = buildMeterReadingsFromDevices([
      {
        Service: "Водоснабжение",
        NumberOfDevice: "12345",
        PastReading: "10.5",
        PastDate: "2026-01-25",
        Reading: "18.5",
        Date: "2026-02-25",
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      Service: "Водоснабжение",
      PastDate: "2026-01-25",
      PastReading: "10.5",
      Reading: "18.5",
    });
    expect(rows[0].Volume).toBeCloseTo(8);
  });

  it("falls back to Reading/Date when PastReading/PastDate are empty", () => {
    const rows = buildMeterReadingsFromDevices([
      {
        Service: "Водоснабжение",
        PastReading: "",
        PastDate: "",
        Reading: "25",
        Date: "2026-02-25",
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].PastReading).toBe("25");
    expect(rows[0].PastDate).toBe("2026-02-25");
    expect(rows[0].Reading).toBe("25");
    expect(rows[0].Volume).toBeCloseTo(0);
  });

  it("supports russian field names from 1C", () => {
    const rows = buildMeterReadingsFromDevices([
      {
        Услуга: "ХВС",
        Показание: "40",
        ПредыдущееПоказание: "34",
        Дата: "2026-03-01",
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].Service).toBe("ХВС");
    expect(rows[0].PastReading).toBe("34");
    expect(rows[0].Reading).toBe("40");
    expect(rows[0].Volume).toBeCloseTo(6);
  });

  it("ignores devices without current reading", () => {
    const rows = buildMeterReadingsFromDevices([
      { Service: "ХВС", Reading: "", PastReading: "12" },
      { Service: "ГВС" },
    ]);
    expect(rows).toHaveLength(0);
    expect(hasValidMeterReadings(rows)).toBe(false);
  });
});
