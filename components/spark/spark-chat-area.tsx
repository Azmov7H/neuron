// components/spark/spark-chat-area.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { WelcomeState } from "./welcome-state";
import { UserMessage } from "./user-message";
import { AiMessage } from "./ai-message";
import { LearningModes } from "./learning-modes";
import { InputArea } from "./input-area";
import { Sparkles, Trophy } from "lucide-react";

interface ConceptCard {
  title: string;
  domain: string;
}

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  concepts?: ConceptCard[];
  followUps?: string[];
  isStreaming?: boolean;
}

export function SparkChatArea() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMode, setSelectedMode] = useState("Deep Dive");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Progression notifications state
  const [xpNotification, setXpNotification] = useState<{ amount: number; isRankUp: boolean } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat as tokens stream in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Clean XP notification after 4 seconds
  useEffect(() => {
    if (xpNotification) {
      const timer = setTimeout(() => {
        setXpNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [xpNotification]);

  /**
   * Automatically detect the learning domain based on keyword analysis of user query
   */
  const detectDomain = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes("conscious") || q.includes("philosophy") || q.includes("mind") || q.includes("existential") || q.includes("meaning")) {
      return "philosophy";
    }
    if (q.includes("network") || q.includes("ai") || q.includes("machine learning") || q.includes("computer") || q.includes("code") || q.includes("technology")) {
      return "technology";
    }
    if (q.includes("math") || q.includes("equation") || q.includes("number") || q.includes("calculus") || q.includes("geometry")) {
      return "mathematics";
    }
    if (q.includes("economic") || q.includes("money") || q.includes("market") || q.includes("finance")) {
      return "economics";
    }
    return "science"; // Default physics/science focus
  };

  const handleSendMessage = async (content: string) => {
    if (isGenerating) return;

    const userMsgId = Date.now().toString();
    const aiMsgId = (Date.now() + 1).toString();

    const userMessage: Message = {
      id: userMsgId,
      role: "user",
      content,
    };

    const aiMessage: Message = {
      id: aiMsgId,
      role: "ai",
      content: "",
      concepts: [],
      followUps: [],
      isStreaming: true,
    };

    // Append to list and trigger loader
    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setIsGenerating(true);

    const domain = detectDomain(content);

    try {
      // Use httpOnly session cookie via credentials: same-origin — no localStorage token required
      const response = await fetch("/api/spark/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId || "new",
          content,
          domain,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to establish educational stream: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        throw new Error("No reader found on streaming response");
      }

      let completeText = "";
      let isDone = false;

      while (!isDone) {
        const { done, value } = await reader.read();
        if (done) {
          isDone = true;
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        completeText += chunk;

        // Clean out raw metadata blocks from streaming output to prevent formatting leakage in UI
        let visibleContent = completeText;
        if (visibleContent.includes("[METADATA_EVENT]")) {
          visibleContent = visibleContent.split("[METADATA_EVENT]")[0].trim();
        }
        if (visibleContent.includes("[METADATA]")) {
          const metaIdx = visibleContent.indexOf("[METADATA]");
          visibleContent = visibleContent.substring(0, metaIdx).trim();
          if (visibleContent.endsWith("---")) {
            visibleContent = visibleContent.substring(0, visibleContent.length - 3).trim();
          }
        }

        // Check if stream contains the metadata event
        if (completeText.includes("[METADATA_EVENT]")) {
          const parts = completeText.split("[METADATA_EVENT]");
          const metadataRaw = parts[1]?.split("[END]")[0]?.trim();

          // Stream visible explanation normally
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId ? { ...msg, content: visibleContent } : msg
            )
          );

          if (metadataRaw) {
            try {
              const metadata = JSON.parse(metadataRaw);
              
              // Persist session ID
              if (metadata.sessionId) {
                setSessionId(metadata.sessionId);
              }

              // Update AI Message details with actual parsed concepts & questions
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId
                    ? {
                        ...msg,
                        content: visibleContent,
                        concepts: metadata.concepts || [],
                        followUps: metadata.followUps || [],
                        isStreaming: false,
                      }
                    : msg
                )
              );

              // Trigger XP gain toast notifier
              if (metadata.addedXp > 0) {
                setXpNotification({
                  amount: metadata.addedXp,
                  isRankUp: metadata.isRankUp || false,
                });
              }
            } catch (jsonErr) {
              console.error("Error parsing streaming metadata block:", jsonErr);
              // Safe fallback removal of tags
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
                )
              );
            }
          }
        } else {
          // Regular stream updates
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId ? { ...msg, content: visibleContent } : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("[Spark UI Stream Error]:", error);
      
      // Gentle error fallback in chat UI
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content: "I ran into a temporary disruption in my neural pathway. Please try asking again in a moment, and I will be ready!",
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full w-full max-w-4xl mx-auto">
      {/* Gamified floating XP and Level-up Toast alerts */}
      {xpNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <Trophy size={12} className="text-white" />
          </div>
          <span className="text-sm font-bold text-emerald-400">+{xpNotification.amount} XP Added</span>
          {xpNotification.isRankUp && (
            <span className="text-xs uppercase tracking-widest px-2 py-0.5 bg-yellow-500/20 text-yellow-300 font-black rounded-lg border border-yellow-500/30">
              Rank Up!
            </span>
          )}
        </div>
      )}

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-0 py-8 scrollbar-thin">
        {messages.length === 0 ? (
          <WelcomeState onPromptClick={handleSendMessage} />
        ) : (
          <div className="space-y-8 pb-10">
            {messages.map((msg) =>
              msg.role === "user" ? (
                <UserMessage key={msg.id} content={msg.content} />
              ) : (
                <AiMessage
                  key={msg.id}
                  content={msg.content}
                  concepts={msg.concepts}
                  followUps={msg.followUps}
                  isStreaming={msg.isStreaming || false}
                  onFollowUpClick={handleSendMessage}
                />
              )
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* Bottom Input Section */}
      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4 px-4 lg:px-0">
        <LearningModes selectedMode={selectedMode} onModeChange={setSelectedMode} />
        <InputArea onSend={handleSendMessage} isGenerating={isGenerating} />
      </div>
    </div>
  );
}