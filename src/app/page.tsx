import Link from "next/link";
import { ArrowRight, BarChart3, Smartphone, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="text-center">
            <div className="mb-8 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-4xl shadow-xl">
                💰
              </div>
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Controle suas finanças
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                de forma simples
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600 sm:text-xl">
              Sistema completo de controle financeiro pessoal e familiar com
              entrada automática via WhatsApp e dashboards em tempo real.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:w-auto"
              >
                Começar Grátis
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 text-lg font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md sm:w-auto"
              >
                Fazer Login
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-3xl bg-white p-8 shadow-sm transition-all hover:shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg transition-transform group-hover:scale-110">
                <Smartphone className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">
                Mobile First
              </h3>
              <p className="text-slate-600">
                Interface otimizada para celular. Controle suas finanças de
                qualquer lugar, a qualquer momento.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-3xl bg-white p-8 shadow-sm transition-all hover:shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg transition-transform group-hover:scale-110">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">
                Entrada Automática
              </h3>
              <p className="text-slate-600">
                Registre gastos enviando mensagens no WhatsApp. AI inteligente
                categoriza automaticamente.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-3xl bg-white p-8 shadow-sm transition-all hover:shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg transition-transform group-hover:scale-110">
                <BarChart3 className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">
                Dashboards em Tempo Real
              </h3>
              <p className="text-slate-600">
                Visualize seus gastos com gráficos interativos. Acompanhe metas
                e previsões mensais.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 p-8 shadow-2xl sm:p-12">
            <div className="grid gap-8 text-center sm:grid-cols-3">
              <div>
                <p className="mb-2 text-4xl font-bold text-white">3</p>
                <p className="text-sm font-medium text-blue-100">
                  Tipos de Contas
                </p>
              </div>
              <div>
                <p className="mb-2 text-4xl font-bold text-white">∞</p>
                <p className="text-sm font-medium text-blue-100">Transações</p>
              </div>
              <div>
                <p className="mb-2 text-4xl font-bold text-white">100%</p>
                <p className="text-sm font-medium text-blue-100">Seguro</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm text-slate-600">
            © 2024 FinControl. Feito com ❤️ para ajudar você a controlar suas
            finanças.
          </p>
        </div>
      </footer>
    </main>
  );
}
