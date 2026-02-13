
"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, Mic, GraduationCap, ChevronRight, Globe } from 'lucide-react'
import { LevelSelector } from '@/components/LanguageLevelSelector'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CEFRLevel } from '@/lib/store'

export default function Home() {
  const [level, setLevel] = useState<CEFRLevel>('A1')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sprachheld_level')
    if (saved) setLevel(saved as CEFRLevel)
  }, [])

  const handleLevelChange = (l: CEFRLevel) => {
    setLevel(l)
    localStorage.setItem('sprachheld_level', l)
  }

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-background flex flex-col items-center px-6 py-12 md:py-24">
      <div className="max-w-md w-full space-y-12">
        <header className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl rotate-3 hover:rotate-0 transition-transform">
              <GraduationCap className="text-white w-10 h-10" />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-primary">Deutsch</h1>
          <p className="text-muted-foreground text-lg">Your personal German language buddy.</p>
        </header>

        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold">Choose Your Level</h2>
          </div>
          <LevelSelector value={level} onChange={handleLevelChange} />
          <div className="bg-card/50 p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground italic leading-relaxed text-center">
              Current focus: <span className="text-foreground font-medium">
                {level === 'A1' && "Very simple greetings and colors."}
                {level === 'A2' && "Everyday shopping and directions."}
                {level === 'B1' && "Expressing opinions and future plans."}
                {level === 'B2' && "Abstract topics and complex grammar."}
              </span>
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <Link href={`/chat?level=${level}`}>
            <Card className="hover:border-primary cursor-pointer transition-all duration-300 group overflow-hidden bg-card/40 backdrop-blur-sm border-2">
              <CardContent className="p-6 flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Text Chat</h3>
                  <p className="text-sm text-muted-foreground">Grammar checks & feedback</p>
                </div>
                <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Link href={`/voice?level=${level}`}>
            <Card className="hover:border-accent cursor-pointer transition-all duration-300 group overflow-hidden bg-card/40 backdrop-blur-sm border-2">
              <CardContent className="p-6 flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                  <Mic className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Voice Chat</h3>
                  <p className="text-sm text-muted-foreground">Real-time speaking practice</p>
                </div>
                <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
              </CardContent>
              <div className="absolute top-0 right-0">
                <Badge className="rounded-none rounded-bl-lg bg-accent/20 text-accent hover:bg-accent/20 border-none">In_Progress</Badge>
              </div>
            </Card>
          </Link>
        </section>

        <footer className="text-center">
          <p className="text-xs text-muted-foreground/60">
            Nishant N
          </p>
        </footer>
      </div>
    </main>
  )
}
