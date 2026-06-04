"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  Info,
  Droplet,
  Waves,
  RotateCcw,
  Check,
  HelpCircle,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TARIFFS = {
  water: {
    loadRate: 8.407,
    lengthRates: {
      withoutWells: {
        "<=40": 2675.715,
        "40-70": 3340.971,
        "70-100": 3521.074,
        "100-150": 4322.978,
        "150-200": 6314.340,
        "200-250": 9826.715,
      },
      withWells: {
        "<=40": 4636.810,
        "40-70": 5380.088,
        "70-100": 5768.875,
        "100-150": 6162.326,
        "150-200": 8763.493,
        "200-250": 11185.978,
      },
    },
  },
  sewerage: {
    loadRate: 3.525,
    lengthRates: {
      withoutWells: {
        "100-200": 7329.304,
      },
      withWells: {
        "100-200": 8685.163,
      },
    },
  },
};

const WATER_DIAMETER_RANGES = [
  { key: "<=40", label: "до 40 мм" },
  { key: "40-70", label: "40-70 мм" },
  { key: "70-100", label: "70-100 мм" },
  { key: "100-150", label: "100-150 мм" },
  { key: "150-200", label: "150-200 мм" },
  { key: "200-250", label: "200-250 мм" },
];

const SEWERAGE_DIAMETER_RANGES = [{ key: "100-200", label: "100-200 мм" }];

const squareControlClass =
  "h-12 min-h-12 rounded-none border-0 bg-transparent px-3 py-0 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0";
const squareSelectClass = "h-12 min-h-12 rounded-none px-3 py-0 text-base";

function InputWithSuffix({
  suffix,
  id,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { suffix: string }) {
  return (
    <div className="flex h-12 overflow-hidden rounded-none border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <Input id={id} className={cn(squareControlClass, "min-w-0 flex-1", className)} {...props} />
      <span className="flex shrink-0 items-center border-l border-gray-200 bg-gray-100 px-3 text-sm text-gray-600">
        {suffix}
      </span>
    </div>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1.5 flex items-start gap-2 rounded-none bg-gray-50 p-2 text-xs text-gray-500">
      <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function ConnectionTypeCard({
  selected,
  onClick,
  icon,
  iconBoxClass,
  title,
  description,
  selectedBorderClass,
  checkClass,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  iconBoxClass: string;
  title: string;
  description: string;
  selectedBorderClass: string;
  checkClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full border-2 p-6 text-left transition-all duration-200 rounded-none",
        selected
          ? selectedBorderClass
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      {selected && (
        <span
          className={cn(
            "absolute right-3 top-3 flex h-6 w-6 items-center justify-center text-white",
            checkClass
          )}
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </span>
      )}
      <div className="mb-2 flex items-center gap-3">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-none",
            iconBoxClass
          )}
        >
          {icon}
        </div>
        <span className="text-lg font-semibold text-gray-900">{title}</span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}

export default function KalkulyatorStoimostiPodklyucheniyaPage() {
  const [waterEnabled, setWaterEnabled] = useState(false);
  const [sewerageEnabled, setSewerageEnabled] = useState(false);
  const [waterLoad, setWaterLoad] = useState("");
  const [sewerageLoad, setSewerageLoad] = useState("");
  const [waterDiameter, setWaterDiameter] = useState<string>("");
  const [sewerageDiameter, setSewerageDiameter] = useState<string>("");
  const [waterLength, setWaterLength] = useState("");
  const [sewerageLength, setSewerageLength] = useState("");
  const [waterWithWells, setWaterWithWells] = useState(false);
  const [sewerageWithWells, setSewerageWithWells] = useState(false);

  const calculateWaterCost = (): number => {
    if (!waterEnabled) return 0;

    let cost = 0;
    const load = parseFloat(waterLoad) || 0;
    if (load > 0) {
      cost += TARIFFS.water.loadRate * load;
    }

    const length = parseFloat(waterLength) || 0;
    if (waterDiameter && length > 0) {
      const rates = waterWithWells
        ? TARIFFS.water.lengthRates.withWells
        : TARIFFS.water.lengthRates.withoutWells;
      const rate = rates[waterDiameter as keyof typeof rates];
      if (rate) {
        cost += rate * (length / 1000);
      }
    }

    return cost;
  };

  const calculateSewerageCost = (): number => {
    if (!sewerageEnabled) return 0;

    let cost = 0;
    const load = parseFloat(sewerageLoad) || 0;
    if (load > 0) {
      cost += TARIFFS.sewerage.loadRate * load;
    }

    const length = parseFloat(sewerageLength) || 0;
    if (sewerageDiameter === "100-200" && length > 0) {
      const rates = sewerageWithWells
        ? TARIFFS.sewerage.lengthRates.withWells
        : TARIFFS.sewerage.lengthRates.withoutWells;
      const rate = rates["100-200"];
      if (rate) {
        cost += rate * (length / 1000);
      }
    }

    return cost;
  };

  const waterCost = calculateWaterCost();
  const sewerageCost = calculateSewerageCost();
  const totalCost = waterCost + sewerageCost;
  const hasSelection = waterEnabled || sewerageEnabled;
  const totalRub = totalCost * 1000;

  const resetCalculator = () => {
    setWaterEnabled(false);
    setSewerageEnabled(false);
    setWaterLoad("");
    setSewerageLoad("");
    setWaterDiameter("");
    setSewerageDiameter("");
    setWaterLength("");
    setSewerageLength("");
    setWaterWithWells(false);
    setSewerageWithWells(false);
  };

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-gray-50 py-8 md:py-12 pb-14 lg:min-h-[calc(100dvh-4.5rem)]">
      <div className="container max-w-7xl flex-1 px-4">
        <div className="mb-8 text-center md:mb-10">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-none bg-cyan-100">
            <Calculator className="h-7 w-7 text-cyan-600" />
          </div>
          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Калькулятор стоимости подключения
          </h1>
          <p className="mx-auto max-w-2xl text-base text-gray-600 md:text-lg">
            Рассчитайте стоимость подключения к системам водоснабжения и водоотведения
          </p>
        </div>

        <Alert className="mb-6 rounded-none border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            Расчет основан на тарифах приказа № 31/7 от 9 октября 2025 года. Тарифы действуют с 1
            января 2026 года по 31 декабря 2026 года. Стоимость указана в тысячах рублей без учета
            НДС.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
          <div className="space-y-4 lg:col-span-2">
            <Card className="rounded-none border shadow-none transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Шаг 1: Выберите тип подключения</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ConnectionTypeCard
                    selected={waterEnabled}
                    onClick={() => setWaterEnabled(!waterEnabled)}
                    icon={<Droplet className="h-6 w-6 text-blue-600" />}
                    iconBoxClass="bg-blue-100"
                    title="Водоснабжение"
                    description="Подключение к системе водоснабжения"
                    selectedBorderClass="border-blue-500 bg-blue-50"
                    checkClass="bg-blue-600"
                  />
                  <ConnectionTypeCard
                    selected={sewerageEnabled}
                    onClick={() => setSewerageEnabled(!sewerageEnabled)}
                    icon={<Waves className="h-6 w-6 text-cyan-600" />}
                    iconBoxClass="bg-cyan-100"
                    title="Водоотведение"
                    description="Подключение к системе водоотведения"
                    selectedBorderClass="border-cyan-500 bg-cyan-50"
                    checkClass="bg-cyan-600"
                  />
                </div>

                <div
                  className={cn(
                    "grid transition-all duration-300 ease-out",
                    hasSelection ? "mt-6 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-6 border-t border-gray-200 pt-6">
                      {waterEnabled && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                            <Droplet className="h-5 w-5 text-blue-600" />
                            Шаг 2: Параметры водоснабжения
                          </h3>
                          <div className="space-y-5">
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="waterLoad" className="text-base font-semibold">
                                  Подключаемая нагрузка <span className="text-red-500">*</span>
                                </Label>
                                <InputWithSuffix
                                  id="waterLoad"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={waterLoad}
                                  onChange={(e) => setWaterLoad(e.target.value)}
                                  placeholder="2.5"
                                  suffix="куб. м/сутки"
                                />
                                <FieldHint>Определяется исходя из диаметра подключаемой сети</FieldHint>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="waterDiameter" className="text-base font-semibold">
                                  Диаметр водопроводной сети
                                </Label>
                                <Select value={waterDiameter} onValueChange={setWaterDiameter}>
                                  <SelectTrigger id="waterDiameter" className={squareSelectClass}>
                                    <SelectValue placeholder="Выберите диапазон диаметра" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-none">
                                    {WATER_DIAMETER_RANGES.map((range) => (
                                      <SelectItem key={range.key} value={range.key}>
                                        {range.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="hidden md:block md:invisible" aria-hidden>
                                  <FieldHint>Определяется исходя из диаметра подключаемой сети</FieldHint>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="waterLength" className="text-base font-semibold">
                                Протяженность сети
                              </Label>
                              <InputWithSuffix
                                id="waterLength"
                                type="number"
                                step="0.1"
                                min="0"
                                value={waterLength}
                                onChange={(e) => setWaterLength(e.target.value)}
                                placeholder="150"
                                suffix="метров"
                              />
                            </div>

                            <label className="flex cursor-pointer items-center gap-3 rounded-none border border-gray-200 bg-gray-50 p-4">
                              <input
                                type="checkbox"
                                id="waterWithWells"
                                checked={waterWithWells}
                                onChange={(e) => setWaterWithWells(e.target.checked)}
                                className="h-5 w-5 cursor-pointer rounded-none"
                              />
                              <span className="text-base">С учетом строительства колодцев</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {waterEnabled && sewerageEnabled && (
                        <div className="border-t border-gray-200" aria-hidden />
                      )}

                      {sewerageEnabled && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                            <Waves className="h-5 w-5 text-cyan-600" />
                            Шаг 2: Параметры водоотведения
                          </h3>
                          <div className="space-y-5">
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="sewerageLoad" className="text-base font-semibold">
                                  Подключаемая нагрузка <span className="text-red-500">*</span>
                                </Label>
                                <InputWithSuffix
                                  id="sewerageLoad"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={sewerageLoad}
                                  onChange={(e) => setSewerageLoad(e.target.value)}
                                  placeholder="2.5"
                                  suffix="куб. м/сутки"
                                />
                                <FieldHint>Определяется исходя из диаметра подключаемой сети</FieldHint>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="sewerageDiameter" className="text-base font-semibold">
                                  Диаметр канализационной сети
                                </Label>
                                <Select value={sewerageDiameter} onValueChange={setSewerageDiameter}>
                                  <SelectTrigger id="sewerageDiameter" className={squareSelectClass}>
                                    <SelectValue placeholder="Выберите диапазон диаметра" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-none">
                                    {SEWERAGE_DIAMETER_RANGES.map((range) => (
                                      <SelectItem key={range.key} value={range.key}>
                                        {range.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="hidden md:block md:invisible" aria-hidden>
                                  <FieldHint>Определяется исходя из диаметра подключаемой сети</FieldHint>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="sewerageLength" className="text-base font-semibold">
                                Протяженность сети
                              </Label>
                              <InputWithSuffix
                                id="sewerageLength"
                                type="number"
                                step="0.1"
                                min="0"
                                value={sewerageLength}
                                onChange={(e) => setSewerageLength(e.target.value)}
                                placeholder="150"
                                suffix="метров"
                              />
                            </div>

                            <label className="flex cursor-pointer items-center gap-3 rounded-none border border-gray-200 bg-gray-50 p-4">
                              <input
                                type="checkbox"
                                id="sewerageWithWells"
                                checked={sewerageWithWells}
                                onChange={(e) => setSewerageWithWells(e.target.checked)}
                                className="h-5 w-5 cursor-pointer rounded-none"
                              />
                              <span className="text-base">С учетом строительства колодцев</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {hasSelection && (
              <Button
                onClick={resetCalculator}
                variant="outline"
                className="w-fit rounded-none hover:scale-100 active:scale-100"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Сбросить все параметры
              </Button>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <Card className="flex w-full flex-col overflow-hidden rounded-none border border-gray-200 shadow-none">
              <CardHeader className="border-b border-gray-200 bg-white pb-4">
                <CardTitle className="text-xl font-semibold">Стоимость подключения</CardTitle>
                {!hasSelection ? (
                  <p className="mt-1 text-sm text-gray-500">
                    Выберите тип подключения для расчёта
                  </p>
                ) : (
                  <CardDescription className="text-sm">Без учёта НДС</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-4 pb-6 pt-5">
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <span
                        className={cn(
                          "text-lg font-semibold",
                          hasSelection ? "text-gray-900" : "text-gray-400"
                        )}
                      >
                        Итого
                      </span>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          hasSelection ? "text-gray-600" : "text-gray-300"
                        )}
                      >
                        рублей
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-3xl font-bold tabular-nums",
                        hasSelection ? "text-blue-600" : "text-gray-300"
                      )}
                    >
                      {totalRub.toLocaleString("ru-RU", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </div>

                {waterEnabled && (
                  <div className="rounded-none border border-blue-200 bg-blue-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Droplet className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Водоснабжение</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-xl font-bold text-blue-900">
                          {(waterCost * 1000).toLocaleString("ru-RU", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </span>
                        <p className="text-xs font-medium text-blue-700">рублей</p>
                      </div>
                    </div>
                    {parseFloat(waterLoad) > 0 && (
                      <div className="mt-2 rounded-none bg-white/60 p-2 text-xs text-blue-600">
                        <div className="flex justify-between">
                          <span>За нагрузку:</span>
                          <span className="font-medium">
                            {(TARIFFS.water.loadRate * parseFloat(waterLoad || "0") * 1000).toLocaleString(
                              "ru-RU",
                              { minimumFractionDigits: 0, maximumFractionDigits: 0 }
                            )}{" "}
                            руб.
                          </span>
                        </div>
                      </div>
                    )}
                    {parseFloat(waterLength) > 0 &&
                      waterDiameter &&
                      (() => {
                        const rates = waterWithWells
                          ? TARIFFS.water.lengthRates.withWells
                          : TARIFFS.water.lengthRates.withoutWells;
                        const rate = rates[waterDiameter as keyof typeof rates] || 0;
                        const lengthCost = rate * (parseFloat(waterLength || "0") / 1000);
                        return (
                          <div className="mt-1 rounded-none bg-white/60 p-2 text-xs text-blue-600">
                            <div className="flex justify-between">
                              <span>За протяженность:</span>
                              <span className="font-medium">
                                {(lengthCost * 1000).toLocaleString("ru-RU", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}{" "}
                                руб.
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                )}

                {sewerageEnabled && (
                  <div className="rounded-none border border-cyan-200 bg-cyan-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Waves className="h-5 w-5 text-cyan-600" />
                        <span className="font-semibold text-cyan-900">Водоотведение</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-xl font-bold text-cyan-900">
                          {(sewerageCost * 1000).toLocaleString("ru-RU", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </span>
                        <p className="text-xs font-medium text-cyan-700">рублей</p>
                      </div>
                    </div>
                    {parseFloat(sewerageLoad) > 0 && (
                      <div className="mt-2 rounded-none bg-white/60 p-2 text-xs text-cyan-600">
                        <div className="flex justify-between">
                          <span>За нагрузку:</span>
                          <span className="font-medium">
                            {(TARIFFS.sewerage.loadRate * parseFloat(sewerageLoad || "0") * 1000).toLocaleString(
                              "ru-RU",
                              { minimumFractionDigits: 0, maximumFractionDigits: 0 }
                            )}{" "}
                            руб.
                          </span>
                        </div>
                      </div>
                    )}
                    {parseFloat(sewerageLength) > 0 && sewerageDiameter === "100-200" && (
                      <div className="mt-1 rounded-none bg-white/60 p-2 text-xs text-cyan-600">
                        <div className="flex justify-between">
                          <span>За протяженность:</span>
                          <span className="font-medium">
                            {(
                              (sewerageWithWells
                                ? TARIFFS.sewerage.lengthRates.withWells
                                : TARIFFS.sewerage.lengthRates.withoutWells)["100-200"] *
                                (parseFloat(sewerageLength || "0") / 1000) *
                                1000
                            ).toLocaleString("ru-RU", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}{" "}
                            руб.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-auto space-y-3">
                  <Alert className="rounded-none border-amber-200 bg-amber-50 px-3 py-2.5">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs leading-relaxed text-amber-800">
                      <strong>Примечание:</strong> расчёт предварительный. Окончательная стоимость
                      определяется при заключении договора.
                    </AlertDescription>
                  </Alert>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full gap-2 rounded-none hover:scale-100 active:scale-100"
                  >
                    <a href="/documents/31.7 (1).pdf" download="Тарифы на подключение.pdf">
                      <Download className="h-4 w-4" />
                      Скачать актуальные тарифы
                    </a>
                  </Button>
                </div>
              </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
