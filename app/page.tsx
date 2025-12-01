import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart3, Users, Clock } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Čau, jsem Linda 👋</h1>
          <p className="text-xl text-muted-foreground">
            Vyber si, co chceš vidět
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          <Link href="/charts/user-hours">
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <CardTitle>Hodiny podle uživatelů</CardTitle>
                <CardDescription>
                  Treemap graf zobrazující odpracované hodiny jednotlivých členů týmu
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/charts/work-hours">
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-green-500" />
                </div>
                <CardTitle>Odpracované hodiny</CardTitle>
                <CardDescription>
                  Časová osa odpracovaných hodin v průběhu času
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/charts/projects">
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                </div>
                <CardTitle>Projekty</CardTitle>
                <CardDescription>
                  Přehled hodin strávených na jednotlivých projektech
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
