import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Building2, Award } from "lucide-react";

export default function RukovodstvoPage() {
  return (
    <div className="container py-12 px-4 max-w-5xl">
      {/* Заголовок */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
          <User className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Руководство
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Руководители и учредители ООО «Крымская Водная Компания»
        </p>
      </div>

      {/* Руководители */}
      <Card className="mb-8 animate-fade-in animate-delay-100 shadow-lg border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-2xl">Руководители</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Пуришева Ольга Николаевна</h3>
              <p className="text-lg text-gray-700">Генеральный Директор</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Учредители */}
      <Card className="mb-8 animate-fade-in animate-delay-200 shadow-lg border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-green-600" />
            <CardTitle className="text-2xl">Учредители</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Кожемякин Владимир Петрович</h3>
              <p className="text-gray-600">Физическое лицо</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Черкашин Эдуард Станиславович</h3>
              <p className="text-gray-600">Физическое лицо</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Нахлупина Виктория Павловна</h3>
              <p className="text-gray-600">Физическое лицо</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

