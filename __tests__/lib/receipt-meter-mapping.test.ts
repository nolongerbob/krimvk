import { buildMeterReadingsFromDevices, hasValidMeterReadings, syncChargesWithMeterReadings } from "@/lib/receipt-meter-mapping";

describe("receipt charge readings synchronization", () => {
  const serviceKey = (value: string) => value.trim().toLowerCase();

  it("replaces stale upper readings with the final IPU pair, preserving billing amounts", () => {
    const charges = [{ Service: "Водоснабжение", StartReading: 260, EndReading: 269, Volume: "10.000", Charge: "479.60" }];
    const rows = [{ Service: "Водоснабжение", PastReading: "269,00", Reading: "279,00", Volume: 10 }];
    syncChargesWithMeterReadings(charges, rows, serviceKey);
    expect(charges[0]).toEqual({ Service: "Водоснабжение", StartReading: 269, EndReading: 279, Volume: "10.000", Charge: "479.60" });
    expect(rows[0].PastReading).toBe("269,00");
  });

  it("does not select an arbitrary device for a service with multiple meters", () => {
    const charges = [{ Service: "ХВС", StartReading: 1, EndReading: 2 }];
    syncChargesWithMeterReadings(charges, [
      { Service: "ХВС", PastReading: 10, Reading: 20 },
      { Service: "ХВС", PastReading: 30, Reading: 40 },
    ], serviceKey);
    expect(charges[0].StartReading).toBe(1);
    expect(charges[0].EndReading).toBe(2);
  });

  it("does not copy a full meter interval to multiple charge rows", () => {
    const charges = [{ Service: "ХВС", StartReading: 1 }, { Service: "ХВС", StartReading: 2 }];
    syncChargesWithMeterReadings(charges, [{ Service: "ХВС", PastReading: 10, Reading: 20 }], serviceKey);
    expect(charges.map((row) => row.StartReading)).toEqual([1, 2]);
  });

  it.each([undefined, "", "garbage"])("keeps existing readings when the previous value is invalid: %s", (past) => {
    const charges = [{ Service: "ХВС", StartReading: 1, EndReading: 2 }];
    syncChargesWithMeterReadings(charges, [{ Service: "ХВС", PastReading: past, Reading: 20 }], serviceKey);
    expect(charges[0]).toEqual({ Service: "ХВС", StartReading: 1, EndReading: 2 });
  });

  it("supports zero and spaced decimal values without touching other services", () => {
    const charges = [{ Service: " ХВС ", StartReading: 5 }, { Service: "ГВС", StartReading: 7 }];
    syncChargesWithMeterReadings(charges, [{ Service: "хвс", PastReading: 0, Reading: "1 234,50" }], serviceKey);
    expect(charges[0]).toMatchObject({ StartReading: 0, EndReading: 1234.5 });
    expect(charges[1]).toEqual({ Service: "ГВС", StartReading: 7 });
  });
});

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
