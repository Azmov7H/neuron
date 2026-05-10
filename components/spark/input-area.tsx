// components/spark/input-area.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { SendHorizontal, Sparkles } from "lucide-react";

interface InputAreaProps {
  onSend: (message: string) => void;
  isGenerating: boolean;
}

export function InputArea({ onSend, isGenerating }: InputAreaProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (input.trim() && !isGenerating) {
      onSend(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative flex items-end gap-3 bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-[0_0_30px_rgba(0,0,0,0.3)] focus-within:border-primary/30 focus-within:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all">
      <div className="absolute top-3 left-4 text-secondary/50">
        <Sparkles size={16} />
      </div>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Spark anything..."
        rows={1}
        className="flex-1 bg-transparent pl-8 pr-4 py-1 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none max-h-32 scrollbar-none"
      />
      <button 
        onClick={handleSubmit}
        disabled={!input.trim() || isGenerating}
        className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 disabled:bg-muted transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] active:scale-95"
      >
        <SendHorizontal size={16} />
      </button>
    </div>
  );
}