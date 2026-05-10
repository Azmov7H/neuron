// components/spark/spark-chat-area.tsx
"use client";

import { useState } from "react";
import { WelcomeState } from "./welcome-state";
import { UserMessage } from "./user-message";
import { AiMessage } from "./ai-message";
import { LearningModes } from "./learning-modes";
import { InputArea } from "./input-area";

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

const mockAiResponse = {
  content: "Gravity doesn't just bend space; it warps time itself. According to Einstein's General Relativity, massive objects like stars create a depression in the fabric of spacetime. The closer you are to this gravitational pull, the slower time passes relative to an observer far away. This is known as gravitational time dilation. We've proven this using atomic clocks on Earth and in orbit—they tick at slightly different rates.",
  concepts: [
    { title: "Spacetime Curvature", domain: "Physics" },
    { title: "Time Dilation", domain: "Relativity" }
  ],
  followUps: [
    "How does speed affect time?",
    "What happens to time inside a black hole?",
    "Is time travel theoretically possible?"
  ]
};

export function SparkChatArea() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMode, setSelectedMode] = useState("Deep Dive");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "ai",
      content: "",
      concepts: [],
      followUps: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setIsGenerating(true);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessage.id
            ? { ...msg, content: mockAiResponse.content, concepts: mockAiResponse.concepts, followUps: mockAiResponse.followUps, isStreaming: false }
            : msg
        )
      );
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-0 py-8">
        {messages.length === 0 ? (
          <WelcomeState onPromptClick={handleSendMessage} />
        ) : (
          <div className="space-y-8">
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