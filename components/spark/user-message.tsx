// components/spark/user-message.tsx
interface UserMessageProps {
  content: string;
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end animate-fade-up">
      <div className="bg-primary/10 border border-primary/20 text-foreground rounded-2xl rounded-tr-sm px-6 py-4 max-w-lg shadow-[0_0_20px_rgba(59,130,246,0.1)]">
        <p className="text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  );
}