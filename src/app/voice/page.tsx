"use client"

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX, Sparkles, MessageSquareText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { CEFRLevel } from '@/lib/store'
import { progressiveConversation } from '@/ai/flows/progressive-conversation'
import { correctVoiceChatError } from '@/ai/flows/voice-chat-error-correction'
import { cn } from '@/lib/utils'

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function VoicePage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const level = (searchParams.get('level') || 'A1') as CEFRLevel
  const [voiceState, setVoiceState] = 'idle' as any;
  const [voiceMode, setVoiceMode] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState<string>('')
  const [lastResponse, setLastResponse] = useState<string>('')
  const [history, setHistory] = useState<{role: 'user' | 'tutor', content: string}[]>([])
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [correction, setCorrection] = useState<{explanation: string, followUp: string} | null>(null)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Mapping state to match component logic
  const currentVoiceState = voiceMode;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.lang = 'de-DE'
        recognition.interimResults = true

        recognition.onresult = (event: any) => {
          const currentTranscript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => (result as any).transcript)
            .join('')
          setTranscript(currentTranscript)
        }

        recognition.onend = () => {
          if (voiceMode === 'listening') {
            processSpeech()
          }
        }
        
        recognitionRef.current = recognition
      }
      synthRef.current = window.speechSynthesis
    }
  }, [voiceMode])

  const startListening = () => {
    setCorrection(null)
    setTranscript('')
    setVoiceMode('listening')
    recognitionRef.current?.start()
  }

  const stopListening = () => {
    if (voiceMode === 'listening') {
      recognitionRef.current?.stop()
    }
  }

  const speakText = (text: string, lang: string = 'de-DE') => {
    if (!synthRef.current || isAudioMuted) return
    
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    
    if (lang === 'de-DE') {
      utterance.rate = level === 'A1' ? 0.7 : level === 'A2' ? 0.85 : 1.0;
    }

    utterance.onstart = () => setVoiceMode('speaking')
    utterance.onend = () => setVoiceMode('idle')
    synthRef.current.speak(utterance)
  }

  const processSpeech = async () => {
    if (!transcript.trim()) {
      setVoiceMode('idle')
      return
    }

    setVoiceMode('thinking')
    const userMsg = transcript.trim()
    setHistory(prev => [...prev, {role: 'user', content: userMsg}])

    try {
      const result = await progressiveConversation({
        level: level,
        topic: "Daily conversation",
        userMessage: userMsg,
        conversationHistory: history
      })

      setLastResponse(result.tutorMessage)
      setHistory(prev => [...prev, {role: 'tutor', content: result.tutorMessage}])

      speakText(result.tutorMessage, 'de-DE')

      // Simple common mistake detection for A1 level
      if (userMsg.toLowerCase().includes('ich bin hunger')) {
        const errResult = await correctVoiceChatError({
          userMessage: userMsg,
          correctedMessage: "Ich habe Hunger.",
          explanation: "In German, you say 'I have hunger' (Ich habe Hunger) instead of 'I am hungry'.",
          germanLevel: level
        })
        
        setTimeout(() => {
          setCorrection({
            explanation: errResult.englishExplanation,
            followUp: errResult.germanFollowUp
          })
          speakText(errResult.englishExplanation, 'en-US')
          setTimeout(() => {
             speakText(errResult.germanFollowUp, 'de-DE')
          }, 4000)
        }, 3000)
      }

    } catch (error: any) {
      console.error('Voice Processing Error:', error)
      setVoiceMode('idle')
      
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Something went wrong. Please check your internet connection and try again."
      })
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex flex-col items-center">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-1">
            German Level {level}
          </Badge>
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Voice Mode</div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={() => setIsAudioMuted(!isAudioMuted)}
        >
          {isAudioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-1000",
          currentVoiceState === 'listening' ? "opacity-20" : "opacity-0"
        )}>
          <div className="w-[300px] h-[300px] bg-accent rounded-full blur-[80px] animate-pulse" />
        </div>

        <div className="mb-12 text-center z-10">
          <h2 className={cn(
            "text-2xl font-bold transition-all duration-300",
            currentVoiceState === 'idle' ? "text-foreground/40" : "text-foreground"
          )}>
            {currentVoiceState === 'idle' && "Tap the mic to speak"}
            {currentVoiceState === 'listening' && "Listening..."}
            {currentVoiceState === 'thinking' && "Thinking..."}
            {currentVoiceState === 'speaking' && "Tutor Speaking"}
          </h2>
          
          {currentVoiceState === 'speaking' && (
            <div className="flex justify-center mt-4">
              <div className="voice-indicator-bar" />
              <div className="voice-indicator-bar" />
              <div className="voice-indicator-bar" />
              <div className="voice-indicator-bar" />
              <div className="voice-indicator-bar" />
            </div>
          )}
        </div>

        <div className="relative z-10 mb-12">
          {currentVoiceState === 'listening' && (
            <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
          )}
          <Button
            size="lg"
            className={cn(
              "w-28 h-28 rounded-full shadow-2xl transition-all duration-500",
              currentVoiceState === 'listening' ? "bg-accent hover:bg-accent scale-110" : "bg-primary hover:bg-primary/90"
            )}
            onClick={currentVoiceState === 'listening' ? stopListening : startListening}
          >
            {currentVoiceState === 'listening' ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          </Button>
        </div>

        <div className="w-full max-w-md space-y-4 z-10">
          {(transcript || lastResponse) && (
            <Card className="bg-card/50 backdrop-blur-md border-border/50 shadow-sm overflow-hidden rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {currentVoiceState === 'listening' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Live Transcript
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MessageSquareText className="w-3 h-3" />
                      Current Conversation
                    </div>
                  )}
                </div>
                <div className="space-y-4 max-h-[150px] overflow-y-auto">
                   {transcript && (
                     <p className="text-lg font-medium leading-tight">"{transcript}"</p>
                   )}
                   {currentVoiceState !== 'listening' && lastResponse && (
                     <p className="text-base text-primary leading-tight font-medium italic">{lastResponse}</p>
                   )}
                </div>
              </CardContent>
            </Card>
          )}

          {correction && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-accent text-accent-foreground border-none shadow-xl rounded-3xl overflow-hidden">
                <CardContent className="p-6 flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Explanation</h4>
                    <p className="text-sm opacity-90 leading-relaxed mb-2">{correction.explanation}</p>
                    <p className="text-sm font-bold italic">"{correction.followUp}"</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <footer className="p-6 text-center text-xs text-muted-foreground/40">
        AI responses adapted for your level. Speak clearly.
      </footer>
    </div>
  )
}
