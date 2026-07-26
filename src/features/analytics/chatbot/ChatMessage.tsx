import type { ChatMessage as ChatMessageType } from '@/types/chatbot'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
    message: ChatMessageType
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user'

    return (
        <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[70%] rounded-lg border px-3 py-2 text-sm leading-relaxed',
                    isUser
                        ? 'bg-[hsl(var(--surface-raised))] text-[hsl(var(--foreground))] border-[hsl(var(--border))]'
                        : 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] border-[hsl(var(--border))]'
                )}
            >
                {message.content}
                {!isUser && message.toolsUsed && message.toolsUsed.length > 0 && (
                    <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))] font-mono opacity-70">
                        Used: {message.toolsUsed.join(', ')}
                    </p>
                )}
            </div>
        </div>
    )
}
