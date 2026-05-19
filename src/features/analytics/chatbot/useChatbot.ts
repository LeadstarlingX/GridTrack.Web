import { useCallback, useMemo, useState } from 'react'
import type { ChatMessage } from '@/types/chatbot'

interface ChatbotState {
    messages: ChatMessage[]
    csvData: string | null
    isLoading: boolean
    isCsvLoading: boolean
    sendMessage: (text: string) => Promise<void>
    loadCsvForRange: (from: string, to: string, days: string[], fromHour: number, toHour: number) => Promise<void>
    clearConversation: () => void
}

function buildApiUrl(path: string) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
    return `${baseUrl}${path}`
}

function trimCsvForContext(csvData: string) {
    const maxLength = 80000
    if (csvData.length <= maxLength) return csvData
    return csvData.slice(0, maxLength)
}

export function useChatbot(): ChatbotState {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [csvData, setCsvData] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isCsvLoading, setIsCsvLoading] = useState(false)

    const loadCsvForRange = useCallback(async (from: string, to: string, days: string[], fromHour: number, toHour: number) => {
        setIsCsvLoading(true)
        try {
            const response = await fetch(buildApiUrl('/api/export/csv'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'range', from, to, days, fromHour, toHour }),
            })
            if (!response.ok) {
                throw new Error('Failed to load CSV')
            }
            const text = await response.text()
            setCsvData(trimCsvForContext(text))
        } finally {
            setIsCsvLoading(false)
        }
    }, [])

    const sendMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim()
            if (!trimmed || !csvData) return

            const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }]
            setMessages(nextMessages)
            setIsLoading(true)

            try {
                const response = await fetch(buildApiUrl('/api/analysis/chat'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: nextMessages, csvData }),
                })

                if (!response.ok) {
                    throw new Error('Failed to send message')
                }

                const data: { reply?: string } = await response.json()
                setMessages((prev) => [...prev, { role: 'assistant', content: data.reply ?? 'No reply received.' }])
            } catch {
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: 'Unable to reach the analysis service. Try again.' },
                ])
            } finally {
                setIsLoading(false)
            }
        },
        [csvData, messages]
    )

    const clearConversation = useCallback(() => {
        setMessages([])
    }, [])

    return useMemo(
        () => ({ messages, csvData, isLoading, isCsvLoading, sendMessage, loadCsvForRange, clearConversation }),
        [messages, csvData, isLoading, isCsvLoading, sendMessage, loadCsvForRange, clearConversation]
    )
}
