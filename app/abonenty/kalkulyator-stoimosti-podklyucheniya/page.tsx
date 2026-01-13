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
import { Calculator, AlertCircle, Info, Droplet, Waves, RotateCcw, CheckCircle2, HelpCircle, Download } from "lucide-react";

// Тарифы из приказа № 31/7 от 9 октября 2025 года
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

// Диапазоны диаметров для водоснабжения
const WATER_DIAMETER_RANGES = [
  { key: "<=40", label: "до 40 мм" },
  { key: "40-70", label: "40-70 мм" },
  { key: "70-100", label: "70-100 мм" },
  { key: "100-150", label: "100-150 мм" },
  { key: "150-200", label: "150-200 мм" },
  { key: "200-250", label: "200-250 мм" },
];

// Диапазоны диаметров для водоотведения
const SEWERAGE_DIAMETER_RANGES = [
  { key: "100-200", label: "100-200 мм" },
];

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

  const totalCost = calculateWaterCost() + calculateSewerageCost();

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
    <div className="container py-8 px-4 max-w-7xl">
      {/* Заголовок */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Calculator className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          Калькулятор стоимости подключения
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Рассчитайте стоимость подключения к системам водоснабжения и водоотведения
        </p>
      </div>

      {/* Информационное сообщение */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800">
          Расчет основан на тарифах приказа № 31/7 от 9 октября 2025 года. 
          Тарифы действуют с 1 января 2026 года по 31 декабря 2026 года. 
          Стоимость указана в тысячах рублей без учета НДС.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Левая колонка - Параметры */}
        <div className="lg:col-span-2 space-y-4">
          {/* Выбор типа подключения */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Шаг 1: Выберите тип подключения</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setWaterEnabled(!waterEnabled)}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    waterEnabled
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      waterEnabled ? "border-blue-500 bg-blue-500" : "border-gray-300"
                    }`}>
                      {waterEnabled && <CheckCircle2 className="h-4 w-4 text-white" />}
                    </div>
                    <Droplet className="h-6 w-6 text-blue-600" />
                    <span className="font-semibold text-lg">Водоснабжение</span>
                  </div>
                  <p className="text-sm text-gray-600">Подключение к системе водоснабжения</p>
                </button>

                <button
                  onClick={() => setSewerageEnabled(!sewerageEnabled)}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    sewerageEnabled
                      ? "border-cyan-500 bg-cyan-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      sewerageEnabled ? "border-cyan-500 bg-cyan-500" : "border-gray-300"
                    }`}>
                      {sewerageEnabled && <CheckCircle2 className="h-4 w-4 text-white" />}
                    </div>
                    <Waves className="h-6 w-6 text-cyan-600" />
                    <span className="font-semibold text-lg">Водоотведение</span>
                  </div>
                  <p className="text-sm text-gray-600">Подключение к системе водоотведения</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Параметры водоснабжения */}
          {waterEnabled && (
            <Card className="border-l-4 border-l-blue-500 rounded-lg overflow-hidden">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Droplet className="h-5 w-5 text-blue-600" />
                  Параметры водоснабжения
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="waterLoad" className="text-base font-semibold">
                      Подключаемая нагрузка <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="waterLoad"
                        type="number"
                        step="0.01"
                        min="0"
                        value={waterLoad}
                        onChange={(e) => setWaterLoad(e.target.value)}
                        placeholder="2.5"
                        className="text-lg h-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        куб. м/сутки
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Определяется исходя из диаметра подключаемой сети</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="waterDiameter" className="text-base font-semibold">
                      Диаметр водопроводной сети
                    </Label>
                    <Select value={waterDiameter} onValueChange={setWaterDiameter}>
                      <SelectTrigger id="waterDiameter" className="text-lg h-12">
                        <SelectValue placeholder="Выберите диапазон диаметра" />
                      </SelectTrigger>
                      <SelectContent>
                        {WATER_DIAMETER_RANGES.map((range) => (
                          <SelectItem key={range.key} value={range.key}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Выберите диапазон диаметра</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waterLength" className="text-base font-semibold">
                    Протяженность сети
                  </Label>
                  <div className="relative">
                    <Input
                      id="waterLength"
                      type="number"
                      step="0.1"
                      min="0"
                      value={waterLength}
                      onChange={(e) => setWaterLength(e.target.value)}
                      placeholder="150"
                      className="text-lg h-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      метров
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Расстояние от точки подключения до объекта</p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="waterWithWells"
                    checked={waterWithWells}
                    onChange={(e) => setWaterWithWells(e.target.checked)}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <Label htmlFor="waterWithWells" className="text-base cursor-pointer flex-1">
                    С учетом строительства колодцев
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Параметры водоотведения */}
          {sewerageEnabled && (
            <Card className="border-l-4 border-l-cyan-500 rounded-lg overflow-hidden">
              <CardHeader className="bg-cyan-50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Waves className="h-5 w-5 text-cyan-600" />
                  Параметры водоотведения
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="sewerageLoad" className="text-base font-semibold">
                      Подключаемая нагрузка <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="sewerageLoad"
                        type="number"
                        step="0.01"
                        min="0"
                        value={sewerageLoad}
                        onChange={(e) => setSewerageLoad(e.target.value)}
                        placeholder="2.5"
                        className="text-lg h-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        куб. м/сутки
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Определяется исходя из диаметра подключаемой сети</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sewerageDiameter" className="text-base font-semibold">
                      Диаметр канализационной сети
                    </Label>
                    <Select value={sewerageDiameter} onValueChange={setSewerageDiameter}>
                      <SelectTrigger id="sewerageDiameter" className="text-lg h-12">
                        <SelectValue placeholder="Выберите диапазон диаметра" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEWERAGE_DIAMETER_RANGES.map((range) => (
                          <SelectItem key={range.key} value={range.key}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Выберите диапазон диаметра</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sewerageLength" className="text-base font-semibold">
                    Протяженность сети
                  </Label>
                  <div className="relative">
                    <Input
                      id="sewerageLength"
                      type="number"
                      step="0.1"
                      min="0"
                      value={sewerageLength}
                      onChange={(e) => setSewerageLength(e.target.value)}
                      placeholder="150"
                      className="text-lg h-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      метров
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Расстояние от точки подключения до объекта</p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="sewerageWithWells"
                    checked={sewerageWithWells}
                    onChange={(e) => setSewerageWithWells(e.target.checked)}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <Label htmlFor="sewerageWithWells" className="text-base cursor-pointer flex-1">
                    С учетом строительства колодцев
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Кнопка сброса */}
          {(waterEnabled || sewerageEnabled) && (
            <Button
              onClick={resetCalculator}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Сбросить все параметры
            </Button>
          )}
        </div>

        {/* Правая колонка - Результаты */}
        <div className="lg:col-span-1">
          <Card className="w-full border-2 border-blue-200 shadow-xl h-full flex flex-col rounded-lg overflow-hidden sticky top-4">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Calculator className="h-6 w-6 text-blue-600" />
                Результат расчета
              </CardTitle>
              <CardDescription className="text-sm">
                Стоимость подключения (без учета НДС)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 pb-6 flex-1 flex flex-col">
              {waterEnabled && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Droplet className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">Водоснабжение</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-blue-900 block">
                        {(calculateWaterCost() * 1000).toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <p className="text-xs text-blue-700 font-medium">рублей</p>
                    </div>
                  </div>
                  {parseFloat(waterLoad) > 0 && (
                    <div className="text-xs text-blue-600 bg-white/50 p-2 rounded mt-2">
                      <div className="flex justify-between">
                        <span>За нагрузку:</span>
                        <span className="font-medium">{(TARIFFS.water.loadRate * parseFloat(waterLoad || "0") * 1000).toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} руб.</span>
                      </div>
                    </div>
                  )}
                  {parseFloat(waterLength) > 0 && waterDiameter && (() => {
                    const rates = waterWithWells ? TARIFFS.water.lengthRates.withWells : TARIFFS.water.lengthRates.withoutWells;
                    const rate = rates[waterDiameter as keyof typeof rates] || 0;
                    const lengthCost = rate * (parseFloat(waterLength || "0") / 1000);
                    return (
                      <div className="text-xs text-blue-600 bg-white/50 p-2 rounded mt-1">
                        <div className="flex justify-between">
                          <span>За протяженность:</span>
                          <span className="font-medium">{(lengthCost * 1000).toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} руб.</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {sewerageEnabled && (
                <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Waves className="h-5 w-5 text-cyan-600" />
                      <span className="font-semibold text-cyan-900">Водоотведение</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-cyan-900 block">
                        {(calculateSewerageCost() * 1000).toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <p className="text-xs text-cyan-700 font-medium">рублей</p>
                    </div>
                  </div>
                  {parseFloat(sewerageLoad) > 0 && (
                    <div className="text-xs text-cyan-600 bg-white/50 p-2 rounded mt-2">
                      <div className="flex justify-between">
                        <span>За нагрузку:</span>
                        <span className="font-medium">{(TARIFFS.sewerage.loadRate * parseFloat(sewerageLoad || "0") * 1000).toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} руб.</span>
                      </div>
                    </div>
                  )}
                  {parseFloat(sewerageLength) > 0 && sewerageDiameter === "100-200" && (
                    <div className="text-xs text-cyan-600 bg-white/50 p-2 rounded mt-1">
                      <div className="flex justify-between">
                        <span>За протяженность:</span>
                        <span className="font-medium">{(((sewerageWithWells ? TARIFFS.sewerage.lengthRates.withWells : TARIFFS.sewerage.lengthRates.withoutWells)["100-200"] * (parseFloat(sewerageLength || "0") / 1000)) * 1000).toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} руб.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1"></div>

              <div className="pt-4 border-t-2 border-gray-200 mt-auto">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-lg font-bold text-gray-900">Итого:</span>
                    <p className="text-sm text-gray-600 font-medium mt-0.5">рублей</p>
                  </div>
                  <span className="text-3xl font-bold text-blue-600">
                    {((calculateWaterCost() + calculateSewerageCost()) * 1000).toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {!waterEnabled && !sewerageEnabled && (
                <div className="mt-4 text-center py-4">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">
                    Выберите тип подключения для расчета
                  </p>
                </div>
              )}

              <Alert className="bg-amber-50 border-amber-200 mt-4">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-xs leading-relaxed">
                  <strong>Примечание:</strong> Расчет является предварительным. 
                  Окончательная стоимость определяется при заключении договора о подключении.
                </AlertDescription>
              </Alert>

              {/* Кнопка скачать тарифы */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button asChild variant="outline" className="w-full gap-2">
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
  );
}
