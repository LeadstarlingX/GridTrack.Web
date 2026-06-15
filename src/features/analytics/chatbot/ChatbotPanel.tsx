import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Badge, Button, Skeleton } from '@/components/ui'
import { apiClient } from '@/lib/api/client'
import { APP_CONFIG } from '@/config/app.config'
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
    const end = new Date(to)
    const diff = Math.max(0, end.getTime() - start.getTime())
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
}

export default function ChatbotPanel({ range, activeDays, hourStart, hourEnd }: ChatbotPanelProps) {
    const [input, setInput] = useState('')
    const [isRecording, setIsRecording] = useState(false)
    const [isTranscribing, setIsTranscribing] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    const { messages, csvData, isLoading, isCsvLoading, sendMessage, loadCsvForRange, clearConversation } = useChatbot()

    const rangeLabel = useMemo(() => `${range.from} to ${range.to}`, [range.from, range.to])
    const rangeDays = useMemo(() => getRangeDays(range.from, range.to), [range.from, range.to])

    const handleSend = async () => {
        if (!input.trim()) return
        const text = input
        setInput('')
        await sendMessage(text)
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
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
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadCsvForRange(range.from, range.to, activeDays, hourStart, hourEnd)}
                    >
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
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <Skeleton className="h-16 w-2/3" />
                )}
            </div>

            <div className="flex flex-col gap-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            void handleSend()
                        }
                    }}
                    placeholder={csvData ? 'Ask about the data… (Enter to send, Shift+Enter for newline)' : 'Load CSV data to start the conversation.'}
                    className="min-h-[90px] resize-none rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                    disabled={!csvData || isLoading}
                />
                <div className="flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isTranscribing}
                        title={isRecording ? 'Stop recording' : 'Record voice input'}
                        className={[
                            'flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors',
                            isRecording
                                ? 'animate-pulse border-red-500 bg-red-500/10 text-red-400'
                                : 'border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))]',
                            isTranscribing ? 'opacity-50 cursor-not-allowed' : '',
                        ].join(' ')}
                    >
                        {isTranscribing ? '…' : isRecording ? '⏹' : '🎙'}
                    </button>
                    <Button size="sm" onClick={handleSend} disabled={!csvData || isLoading || !input.trim()}>
                        Send
                    </Button>
                </div>
            </div>
        </div>
    )
}
