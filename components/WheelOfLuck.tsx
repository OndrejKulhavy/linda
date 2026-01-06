'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectedFacilitator {
  name: string
  count: number
  daysSinceLastSession: number | null
  weight: number
}

interface SelectionResult {
  selected: string[]
  details: SelectedFacilitator[]
}

interface WheelOfLuckProps {
  dateRange: { start: string | null; end: string | null }
  onSelection?: () => void
}

export default function WheelOfLuck({ dateRange, onSelection }: WheelOfLuckProps) {
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<SelectionResult | null>(null)
  const [showResult, setShowResult] = useState(false)

  const spinWheel = async () => {
    setSpinning(true)
    setShowResult(false)
    setResult(null)

    try {
      const response = await fetch('/api/ts-facilitators/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: dateRange.start,
          endDate: dateRange.end,
          count: 2,
        }),
      })

      const data: SelectionResult = await response.json()

      // Simulate spinning animation
      await new Promise(resolve => setTimeout(resolve, 2000))

      setResult(data)
      setShowResult(true)
      onSelection?.()
    } catch (error) {
      console.error('Failed to select facilitators:', error)
    } finally {
      setSpinning(false)
    }
  }

  return (
    <Card className="border-2 border-primary bg-linear-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Sparkles className="w-6 h-6 text-primary" />
          Kolečko štěstí
        </CardTitle>
        <CardDescription>
          Náhodný výběr 2 facilitátorů pro další TS (upřednostňuje lidi s nejméně TS a nejdelším časem od poslední facilitace)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={spinWheel}
            disabled={spinning}
            className="relative overflow-hidden group h-16 px-8 text-lg"
          >
            {spinning ? (
              <>
                <RotateCw className="w-6 h-6 mr-2 animate-spin" />
                Točím...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
                Roztočit kolečko!
              </>
            )}
          </Button>
        </div>

        {/* Spinning Animation */}
        {spinning && (
          <div className="flex justify-center py-8">
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 rounded-full border-8 border-primary/20"></div>
              <div
                className={cn(
                  "absolute inset-0 rounded-full border-8 border-transparent border-t-primary",
                  "animate-spin"
                )}
                style={{ animationDuration: '1s' }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-primary animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {showResult && result && (
          <div
            className={cn(
              "space-y-4 animate-in fade-in-50 slide-in-from-bottom-5",
              "duration-700"
            )}
          >
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4 text-primary">
                🎉 Vybraní facilitátoři pro příští TS:
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {result.details.map((person, index) => (
                  <div
                    key={person.name}
                    className={cn(
                      "p-6 rounded-lg border-2 bg-card",
                      "animate-in fade-in-50 zoom-in-95",
                      index === 0 ? "border-primary" : "border-secondary"
                    )}
                    style={{
                      animationDelay: `${index * 200}ms`,
                      animationDuration: '500ms',
                    }}
                  >
                    <div className="text-2xl font-bold mb-2">{person.name}</div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>Počet TS: {person.count}</div>
                      {person.daysSinceLastSession !== null ? (
                        <div>Poslední facilitace: před {person.daysSinceLastSession} dny</div>
                      ) : (
                        <div>Ještě nefacilitoval/a</div>
                      )}
                      <div className="text-xs opacity-70">Váha: {person.weight}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
