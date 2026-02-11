"use client"

import { Button } from "@/components/ui/button"
import { CEFRLevel, LEVELS } from "@/lib/store"
import { cn } from "@/lib/utils"

interface LevelSelectorProps {
  value: CEFRLevel;
  onChange: (level: CEFRLevel) => void;
}

export function LevelSelector({ value, onChange }: LevelSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
      {LEVELS.map((level) => (
        <Button
          key={level.id}
          variant={value === level.id ? "default" : "outline"}
          className={cn(
            "flex flex-col h-auto py-4 px-2 gap-1 rounded-xl transition-all duration-300",
            value === level.id ? "bg-primary text-primary-foreground shadow-lg scale-105" : "hover:border-primary/50"
          )}
          onClick={() => onChange(level.id)}
        >
          <span className="text-lg font-bold">{level.id}</span>
          <span className="text-[10px] uppercase tracking-wider opacity-80 font-medium">
            {level.label}
          </span>
        </Button>
      ))}
    </div>
  )
}
