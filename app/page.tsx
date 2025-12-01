import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart3, Users, Clock, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-12 sm:py-24">
        <div className="text-center mb-12 sm:mb-20">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 mb-4 sm:mb-6">
            <span className="text-3xl sm:text-4xl">L</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-3 sm:mb-4 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text">
            Linda
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto px-4">
            Jsem geniální asistentka týmu Tuuli, kterému generuji grafy o jejich výkonnosti. 
          </p>
        </div>

        <div className="grid gap-4 sm:gap-8 grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto">
          <Link href="/charts/user-hours" className="group">
            <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 active:scale-[0.98]">
              <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                    Družstevníci
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-100 sm:opacity-0 translate-x-0 sm:-translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Kdo jak maká na JZD? Tady to zjistíš!
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/charts/work-hours" className="group">
            <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/10 active:scale-[0.98]">
              <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-green-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                    Čtyřicethodin
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-100 sm:opacity-0 translate-x-0 sm:-translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Kolik hodin už uteklo? Časová osa neúprosně běží!
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/charts/projects" className="group">
            <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 active:scale-[0.98]">
              <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-purple-500" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                    Koláček
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-100 sm:opacity-0 translate-x-0 sm:-translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Kdo si ukrojil největší díl koláče? Projekty v kostce!
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
