import { Bot } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '@/types/chatbot'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
    message: ChatMessageType
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user'

    return (
        <div className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}>
            {!isUser && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--accent-purple)/0.15)]">
                    <Bot size={12} className="text-[hsl(var(--accent-purple))]" />
                </div>
            )}
            <div
                className={cn(
                    'max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                    isUser
                        ? 'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--foreground))] border border-[hsl(var(--primary)/0.2)]'
                        : 'bg-[hsl(var(--accent-purple)/0.08)] text-[hsl(var(--foreground))] border border-[hsl(var(--accent-purple)/0.15)]',
                )}
            >
                {message.content}
                {!isUser && message.toolsUsed && message.toolsUsed.length > 0 && (
                    <p className="mt-1 text-[10px] text-[hsl(var(--foreground-muted))] font-mono opacity-70">
                        Used: {message.toolsUsed.join(', ')}
                    </p>
                )}
            </div>
        </div>
    )
}
