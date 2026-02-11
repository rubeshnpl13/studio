"use client"

import { useState, useRef, useEffect } from 'react'
import { useSearchParams as getParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { textChatFeedback, TextChatFeedbackOutput } from '@/ai/flows/text-chat-feedback'
import { CEFRLevel } from '@/lib/store'
import { cn } from '@/lib/utils'

type Message = {
  role: 'user' | 'tutor';
  content: string;
  feedback?: TextChatFeedbackOutput;
  timestamp: Date;
}

export default function ChatPage() {
  const searchParams = getParams()
  const level = (searchParams.get('level') || 'A1') as CEFRLevel
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const greet = async () => {
      setIsTyping(true)
      const greeting = level === 'A1' ? "Hallo! Wie geht es dir?" : 
                       level === 'A2' ? "Guten Tag! Worüber möchtest du heute sprechen?" :
                       level === 'B1' ? "Hallo! Hast du heute etwas Interessantes erlebt?" :
                       "Herzlich willkommen! Möchtest du over ein aktuelles Thema diskutieren?";
      
      setTimeout(() => {
        setMessages([{
          role: 'tutor',
          content: greeting,
          timestamp: new Date()
        }])
        setIsTyping(false)
      }, 1000)
    }
    greet()
  }, [level])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage = input.trim()
    setInput('')
    
    const newUserMsg: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newUserMsg])
    setIsTyping(true)

    try {
      const history = messages.map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n')
      const feedback = await textChatFeedback({
        germanText: userMessage,
        languageLevel: level,
        conversationHistory: history
      })

      const tutorResponse: Message = {
        role: 'tutor',
        content: feedback.followUpQuestion,
        feedback: feedback,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, tutorResponse])
    } catch (error) {
      console.error('Chat Feedback Error:', error)
      const errorMsg: Message = {
        role: 'tutor',
        content: "Entschuldigung, ich habe ein technisches Problem. Können wir das noch einmal versuchen?",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card border-b flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              Sprachheld <Badge variant="secondary" className="font-mono">{level}</Badge>
            </h1>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Online Tutor
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn(
                "flex flex-col gap-2",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                {msg.role === 'tutor' && msg.feedback && (
                  <Card className="p-3 bg-accent/5 border-accent/20 mb-2 max-w-[90%] text-sm rounded-xl">
                    <div className="flex gap-2 items-start">
                      <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-accent font-semibold mb-1">Feedback</p>
                        <p className="text-foreground/80 mb-2 font-medium italic">"{msg.feedback.correctedText}"</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">{msg.feedback.explanation}</p>
                      </div>
                    </div>
                  </Card>
                )}
                
                <div className={cn(
                  "max-w-[85%] px-4 py-3 rounded-2xl shadow-sm",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-card border rounded-tl-none"
                )}>
                  <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>
                </div>
                <span className="text-[10px] text-muted-foreground opacity-50 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-muted-foreground animate-pulse ml-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                </div>
                <span className="text-xs font-medium">Tutor schreibt...</span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </div>

      <footer className="p-4 bg-card border-t border-border/50">
        <div className="max-w-2xl mx-auto relative flex items-center gap-2">
          <Input 
            placeholder="Schreibe auf Deutsch..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
            className="flex-1 bg-muted/50 border-none h-12 rounded-full px-6 focus-visible:ring-primary/20"
          />
          <Button 
            size="icon" 
            className="rounded-full h-12 w-12 shrink-0 shadow-lg" 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </footer>
    </div>
  )
}
