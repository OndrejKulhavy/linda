"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles } from "lucide-react"

interface ChangelogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangelogDialog({ open, onOpenChange }: ChangelogDialogProps) {
  const [content, setContent] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      fetchChangelog()
      // Mark as viewed when dialog is opened
      localStorage.setItem('lastViewedChangelog', new Date().toISOString())
    }
  }, [open])

  const fetchChangelog = async () => {
    try {
      const response = await fetch('/api/changelog')
      const data = await response.json()
      setContent(data.content || "")
    } catch (error) {
      console.error('Error fetching changelog:', error)
      setContent("Failed to load changelog.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const formatChangelog = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        return null // Skip main title
      }
      if (line.startsWith('## [Unreleased]')) {
        return null // Skip unreleased section header
      }
      if (line.startsWith('## [')) {
        const date = line.match(/\[([^\]]+)\]/)?.[1]
        return (
          <div key={index} className="mb-6 mt-8 first:mt-0">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="default" className="text-sm font-semibold">
                {date}
              </Badge>
            </div>
          </div>
        )
      }
      // Category headers
      if (line.startsWith('### ')) {
        const category = line.replace('### ', '')
        return (
          <h4 key={index} className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 mt-6">
            {category}
          </h4>
        )
      }
      // List items
      if (line.startsWith('- ')) {
        const content = line.replace('- ', '')
        // Parse markdown links [text](url)
        const parts = content.split(/(\[.*?\]\(.*?\))/)
        return (
          <div key={index} className="flex gap-2 mb-2 text-sm">
            <span className="text-primary mt-1">•</span>
            <span className="flex-1">
              {parts.map((part, i) => {
                const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/)
                if (linkMatch) {
                  return (
                    <a
                      key={i}
                      href={linkMatch[2]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-mono text-xs"
                    >
                      {linkMatch[1]}
                    </a>
                  )
                }
                return <span key={i}>{part}</span>
              })}
            </span>
          </div>
        )
      }
      // Sub-items (indented)
      if (line.trim().startsWith('  - ')) {
        const content = line.trim().replace('- ', '')
        return (
          <div key={index} className="flex gap-2 mb-1 text-sm ml-6 text-muted-foreground">
            <span className="mt-1">◦</span>
            <span className="flex-1">{content}</span>
          </div>
        )
      }
      // Empty lines
      if (line.trim() === '') {
        return null
      }
      // Regular text
      if (line.startsWith('The format') || line.startsWith('and this project')) {
        return null // Skip metadata
      }
      return (
        <p key={index} className="text-sm text-muted-foreground mb-2">
          {line}
        </p>
      )
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            Co je nového?
          </DialogTitle>
          <DialogDescription>
            Nejnovější změny a vylepšení v aplikaci Linda
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-1">
              {formatChangelog(content)}
            </div>
          )}
        </ScrollArea>
        <div className="flex justify-end pt-4">
          <Button onClick={handleClose}>
            Zavřít
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
