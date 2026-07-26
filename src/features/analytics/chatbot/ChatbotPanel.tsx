import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Mic, MicOff, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Skeleton } from '@/components/ui'
import { apiClient } from '@/lib/api/client'
import { APP_CONFIG } from '@/config/app.config'
import { cn } from '@/lib/utils'
import { useChatbot } from './useChatbot'
import ChatMessage from './ChatMessage'
import type { DateRangeValue } from '../DateRangePicker'
import type { TranscribeResponse } from '@/types/api'

interface ChatbotPanelProps {
    range: DateRangeValue
    activeDays: string[]
    hourStart: number
    hourEnd: number
}

function getRangeDays(from: string, to: string) {
    const start = new Date(from)
    const end   = new Date(to)
    const diff  = Math.max(0, end.getTime() - start.getTime())
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
}

export default function ChatbotPanel({ range, activeDays, hourStart, hourEnd }: ChatbotPanelProps) {
    const [input, setInput]               = useState('')
    const [isRecording, setIsRecording]   = useState(false)
    const [isTranscribing, setIsTranscribing] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef        = useRef<Blob[]>([])
    const messagesEndRef   = useRef<HTMLDivElement>(null)

    const {
        messages, csvData, isLoading, isCsvLoading,
        sendMessage, loadCsvForRange, clearConversation,
    } = useChatbot()

    const rangeLabel = useMemo(() => `${range.from} to ${range.to}`, [range.from, range.to])
    const rangeDays  = useMemo(() => getRangeDays(range.from, range.to), [range.from, range.to])

    // Auto-scroll to newest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    // Reload data when range changes
    useEffect(() => {
        clearConversation()
        void loadCsvForRange(range.from, range.to, activeDays, hourStart, hourEnd)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range.from, range.to])

    const handleSend = async () => {
        if (!input.trim()) return
        const text = input
        setInput('')
        await sendMessage(text)
    }

    const startRecording = async () => {
        try {
            const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)
            chunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            recorder.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop())
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                setIsTranscribing(true)
                try {
                    const formData = new FormData()
                    formData.append('file', blob, 'recording.webm')
                    const res = await apiClient.post<TranscribeResponse>(
                        APP_CONFIG.api.analysisTranscribePath,
                        formData,
                    )
                    setInput((prev) => (prev ? `${prev} ${res.data.text}` : res.data.text))
                } catch {
                    toast.error('Transcription failed. Try again.')
                } finally {
                    setIsTranscribing(false)
                }
            }

            recorder.start()
            mediaRecorderRef.current = recorder
            setIsRecording(true)
        } catch {
            toast.error('Microphone access denied.')
        }
    }

    const stopRecording = () => {
        mediaRecorderRef.current?.stop()
        mediaRecorderRef.current = null
        setIsRecording(false)
    }

    const canSend = !!csvData && !isLoading && !!input.trim()

    return (
        <div className="flex flex-col gap-4">
            {/* Top bar: range info + action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--foreground-muted))]">
                    <span>Range</span>
                    <span className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-raised))] px-2 py-1 font-mono">
                        {rangeLabel}
                    </span>
                    {isCsvLoading ? (
                        <Badge variant="outline" className="text-[11px] font-medium uppercase tracking-wide gap-1">
                            <Loader2 size={10} className="animate-spin" />
                            Loading…
                        </Badge>
                    ) : csvData ? (
                        <Badge variant="secondary" className="text-[11px] font-medium uppercase tracking-wide">
                            {rangeDays} days loaded
                        </Badge>
                    ) : null}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={clearConversation}>
                        Clear
                    </Button>
                </div>
            </div>

            {/* Message list */}
            <div className="flex h-[340px] flex-col gap-3 overflow-y-auto rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4">
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--accent-purple)/0.1)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--accent-purple))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/>
                                <path d="M2 14h2"/><path d="M20 14h2"/>
                                <path d="M15 13v2"/><path d="M9 13v2"/>
                            </svg>
                        </span>
                        <p className="text-xs text-[hsl(var(--foreground-muted))]">
                            {isCsvLoading
                                ? 'Loading data for the selected range…'
                                : 'Ask about anomalies, ETAs, or district trends for the selected range.'}
                        </p>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <ChatMessage key={`${message.role}-${index}`} message={message} />
                    ))
                )}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex items-start gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--accent-purple)/0.15)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--accent-purple))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/>
                                <path d="M2 14h2"/><path d="M20 14h2"/>
                                <path d="M15 13v2"/><path d="M9 13v2"/>
                            </svg>
                        </span>
                        <Skeleton className="h-12 w-2/3 rounded-xl" />
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="flex flex-col gap-2">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                void handleSend()
                            }
                        }}
                        placeholder={
                            csvData
                                ? 'Ask about the data… (Enter to send, Shift+Enter for newline)'
                                : 'Loading data for the selected range…'
                        }
                        rows={3}
                        className={cn(
                            'w-full resize-none rounded-xl border bg-[hsl(var(--surface))] px-3 py-2.5 pr-12',
                            'text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--foreground-subtle,var(--foreground-muted)))]',
                            'outline-none transition-colors',
                            'border-[hsl(var(--border))]',
                            'focus:border-[hsl(var(--accent-purple)/0.5)] focus:ring-2 focus:ring-[hsl(var(--accent-purple)/0.12)]',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                        )}
                        disabled={!csvData || isLoading}
                    />
                    {/* Send button inset bottom-right */}
                    <button
                        type="button"
                        onClick={() => void handleSend()}
                        disabled={!canSend}
                        className={cn(
                            'absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-lg transition-all',
                            canSend
                                ? 'bg-[hsl(var(--accent-purple))] text-white hover:opacity-90'
                                : 'bg-[hsl(var(--surface-raised))] text-[hsl(var(--foreground-subtle,var(--foreground-muted)))] cursor-not-allowed',
                        )}
                        aria-label="Send message"
                    >
                        {isLoading
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Send size={13} />
                        }
                    </button>
                </div>

                {/* Voice button + keyboard hint */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isTranscribing}
                        title={isRecording ? 'Stop recording' : 'Record voice input'}
                        aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
                        className={cn(
                            'relative flex h-8 w-8 items-center justify-center rounded-full border transition-all',
                            isRecording
                                ? 'border-[hsl(var(--destructive)/0.5)] bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]'
                                : 'border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))] hover:text-[hsl(var(--foreground))]',
                            isTranscribing ? 'opacity-50 cursor-not-allowed' : '',
                        )}
                    >
                        {isRecording && (
                            <span className="absolute inset-0 rounded-full border border-[hsl(var(--destructive)/0.5)] animate-ping" />
                        )}
                        {isTranscribing
                            ? <Loader2 size={13} className="animate-spin" />
                            : isRecording
                                ? <MicOff size={13} />
                                : <Mic size={13} />
                        }
                    </button>
                    {isRecording && (
                        <span className="text-[11px] font-medium text-[hsl(var(--destructive))] animate-pulse">
                            Recording…
                        </span>
                    )}
                    {isTranscribing && (
                        <span className="text-[11px] text-[hsl(var(--foreground-muted))]">Transcribing…</span>
                    )}
                    {!isRecording && !isTranscribing && (
                        <span className="text-[10px] text-[hsl(var(--foreground-subtle,var(--foreground-muted)))]">
                            ↵ send · ⇧↵ newline
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
