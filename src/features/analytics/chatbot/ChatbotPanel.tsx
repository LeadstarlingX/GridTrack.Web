import { useMemo, useState } from 'react'
import { Badge, Button, Skeleton } from '@/components/ui'
import { useChatbot } from './useChatbot'
import ChatMessage from './ChatMessage'
import type { DateRangeValue } from '../DateRangePicker'

interface ChatbotPanelProps {
    range: DateRangeValue
}

function getRangeDays(from: string, to: string) {
    const start = new Date(from)
    const end = new Date(to)
    const diff = Math.max(0, end.getTime() - start.getTime())
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
}

export default function ChatbotPanel({ range }: ChatbotPanelProps) {
    const [input, setInput] = useState('')
    const { messages, csvData, isLoading, isCsvLoading, sendMessage, loadCsvForRange, clearConversation } = useChatbot()

    const rangeLabel = useMemo(() => `${range.from} to ${range.to}`, [range.from, range.to])
    const rangeDays = useMemo(() => getRangeDays(range.from, range.to), [range.from, range.to])

    const handleSend = async () => {
        if (!input.trim()) return
        const text = input
        setInput('')
        await sendMessage(text)
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--foreground-muted))]">
                    <span>Range</span>
                    <span className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 py-1">
                        {rangeLabel}
                    </span>
                    {csvData && (
                        <Badge variant="secondary" className="text-[11px] font-medium uppercase tracking-wide">
                            {rangeDays} days loaded
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadCsvForRange(range.from, range.to)}>
                        {isCsvLoading ? 'Loading...' : 'Load Data'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearConversation}>
                        Clear
                    </Button>
                </div>
            </div>

            <div className="flex h-[340px] flex-col gap-3 overflow-y-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4">
                {messages.length === 0 ? (
                    <p className="text-xs text-[hsl(var(--foreground-subtle))] italic">
                        Load data to unlock AI analysis, then ask about anomalies, ETAs, or district trends.
                    </p>
                ) : (
                    messages.map((message, index) => <ChatMessage key={`${message.role}-${index}`} message={message} />)
                )}
                {isLoading && <Skeleton className="h-16 w-2/3" />}
            </div>

            <div className="flex flex-col gap-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={csvData ? 'Ask about the data...' : 'Load CSV data to start the conversation.'}
                    className="min-h-[90px] resize-none rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                    disabled={!csvData || isLoading}
                />
                <div className="flex items-center justify-end">
                    <Button size="sm" onClick={handleSend} disabled={!csvData || isLoading || !input.trim()}>
                        Send
                    </Button>
                </div>
            </div>
        </div>
    )
}
