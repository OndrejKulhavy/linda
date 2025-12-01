import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart3, Users, Clock, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
            <span className="text-4xl">📊</span>
          </div>
          <h1 className="text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Linda
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Tvůj přehled odpracovaných hodin
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          <Link href="/charts/user-hours" className="group">
            <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10">
              <CardHeader className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Users className="w-7 h-7 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="flex items-center justify-between text-xl">
                    Uživatelé
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Odpracované hodiny jednotlivých členů týmu
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/charts/work-hours" className="group">
            <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/10">
              <CardHeader className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Clock className="w-7 h-7 text-green-500" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="flex items-center justify-between text-xl">
                    Časová osa
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Vývoj odpracovaných hodin v čase
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/charts/projects" className="group">
            <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10">
              <CardHeader className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <BarChart3 className="w-7 h-7 text-purple-500" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="flex items-center justify-between text-xl">
                    Projekty
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Přehled hodin na jednotlivých projektech
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
