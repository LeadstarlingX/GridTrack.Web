import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { APP_CONFIG } from '@/config/app.config'
import { apiClient } from '@/lib/api/client'
import { getAuthToken } from '@/lib/api/authBridge'
import type { ChatMessage } from '@/types/chatbot'

interface ChatbotState {
    messages: ChatMessage[]
    csvData: string | null
    isLoading: boolean
    isCsvLoading: boolean
    isGeneratingReport: boolean
    sendMessage: (text: string) => Promise<void>
    loadCsvForRange: (from: string, to: string, days: string[], fromHour: number, toHour: number) => Promise<void>
    clearConversation: () => void
    transcribeAudio: (blob: Blob, mimeType: string) => Promise<string | null>
    generateReport: () => Promise<void>
}

function trimCsvForContext(csvData: string) {
    const max = APP_CONFIG.chatbot.csvMaxChars
    return csvData.length <= max ? csvData : csvData.slice(0, max)
}

export function useChatbot(): ChatbotState {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [csvData, setCsvData] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isCsvLoading, setIsCsvLoading] = useState(false)
    const [isGeneratingReport, setIsGeneratingReport] = useState(false)
    const abortRef = useRef<AbortController | null>(null)

    const loadCsvForRange = useCallback(
        async (from: string, to: string, days: string[], fromHour: number, toHour: number) => {
            setIsCsvLoading(true)
            try {
                const response = await apiClient.post<string>(
                    APP_CONFIG.api.exportCsvPath,
                    { mode: 'range', from, to, days, fromHour, toHour },
                    { responseType: 'text' },
                )
                setCsvData(trimCsvForContext(response.data))
            } catch {
                toast.error('Could not load export data. Try again.')
            } finally {
                setIsCsvLoading(false)
            }
        },
        [],
    )

    const sendMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim()
            if (!trimmed || !csvData) return

            // Cancel any in-flight stream
            abortRef.current?.abort()
            const abort = new AbortController()
            abortRef.current = abort

            setMessages((prev) => [
                ...prev,
                { role: 'user', content: trimmed },
                { role: 'assistant', content: '', toolsUsed: [] },
            ])
            setIsLoading(true)

            try {
                const token = await getAuthToken()
                const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
                const response = await fetch(`${baseUrl}${APP_CONFIG.api.analysisChatStreamPath}`, {
                    method: 'POST',
                    signal: abort.signal,
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        question: trimmed,
                        csvData: trimCsvForContext(csvData),
                    }),
                })

                if (!response.ok || !response.body) throw new Error('Stream failed')

                const reader = response.body.getReader()
                const decoder = new TextDecoder()
                let buf = ''

                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buf += decoder.decode(value, { stream: true })
                    const lines = buf.split('\n')
                    buf = lines.pop() ?? ''

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue
                        const data = line.slice('data: '.length)
                        if (data === '[DONE]') {
                            setIsLoading(false)
                            return
                        }
                        try {
                            const parsed = JSON.parse(data) as { token?: string; tool?: string }
                            if (parsed.tool) {
                                setMessages((prev) => {
                                    const updated = [...prev]
                                    const last = updated[updated.length - 1]
                                    if (last?.role === 'assistant') {
                                        updated[updated.length - 1] = {
                                            ...last,
                                            toolsUsed: [...(last.toolsUsed ?? []), parsed.tool!],
                                        }
                                    }
                                    return updated
                                })
                            }
                            if (parsed.token) {
                                setIsLoading(false)
                                setMessages((prev) => {
                                    const updated = [...prev]
                                    const last = updated[updated.length - 1]
                                    if (last?.role === 'assistant') {
                                        updated[updated.length - 1] = {
                                            ...last,
                                            content: last.content + parsed.token,
                                        }
                                    }
                                    return updated
                                })
                            }
                        } catch {
                            // malformed SSE frame, skip
                        }
                    }
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name === 'AbortError') return
                setMessages((prev) => {
                    const updated = [...prev]
                    const last = updated[updated.length - 1]
                    if (last?.role === 'assistant' && !last.content) {
                        updated[updated.length - 1] = {
                            ...last,
                            content: 'Unable to reach the analysis service. Try again.',
                        }
                    }
                    return updated
                })
            } finally {
                setIsLoading(false)
            }
        },
        [csvData],
    )

    const clearConversation = useCallback(() => {
        abortRef.current?.abort()
        setMessages([])
    }, [])

    const generateReport = useCallback(async () => {
        if (!messages.length) return
        setIsGeneratingReport(true)
        try {
            const token = await getAuthToken()
            const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
            const response = await fetch(`${baseUrl}${APP_CONFIG.api.analysisChatReportPath}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    messages: messages.map((m) => ({ role: m.role, content: m.content })),
                    csvData: csvData ?? '',
                }),
            })
            if (!response.ok) throw new Error('Report generation failed')
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'gridtrack-report.pdf'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch {
            toast.error('Could not generate report. Try again.')
        } finally {
            setIsGeneratingReport(false)
        }
    }, [messages, csvData])

    const transcribeAudio = useCallback(async (blob: Blob, mimeType: string): Promise<string | null> => {
        try {
            const token = await getAuthToken()
            const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
            const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'ogg'
            const form = new FormData()
            form.append('file', blob, `recording.${ext}`)
            const res = await fetch(`${baseUrl}${APP_CONFIG.api.analysisTranscribePath}`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: form,
            })
            if (!res.ok) return null
            const json = await res.json() as { text: string }
            return json.text ?? null
        } catch {
            return null
        }
    }, [])

    return useMemo(
        () => ({ messages, csvData, isLoading, isCsvLoading, isGeneratingReport, sendMessage, loadCsvForRange, clearConversation, transcribeAudio, generateReport }),
        [messages, csvData, isLoading, isCsvLoading, isGeneratingReport, sendMessage, loadCsvForRange, clearConversation, transcribeAudio, generateReport],
    )
}
