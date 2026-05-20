import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { APP_CONFIG } from '@/config/app.config'
import { apiClient } from '@/lib/api/client'
import type { ChatMessage } from '@/types/chatbot'
import type { ChatRequest, ChatResponse } from '@/types/api'

interface ChatbotState {
    messages: ChatMessage[]
    csvData: string | null
    isLoading: boolean
    isCsvLoading: boolean
    sendMessage: (text: string) => Promise<void>
    loadCsvForRange: (from: string, to: string, days: string[], fromHour: number, toHour: number) => Promise<void>
    clearConversation: () => void
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

            const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }]
            setMessages(nextMessages)
            setIsLoading(true)

            try {
                const body: ChatRequest = { messages: nextMessages, csvData }
                const response = await apiClient.post<ChatResponse>(APP_CONFIG.api.analysisChatPath, body)
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: response.data.reply ?? 'No reply received.' },
                ])
            } catch {
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: 'Unable to reach the analysis service. Try again.' },
                ])
            } finally {
                setIsLoading(false)
            }
        },
        [csvData, messages],
    )

    const clearConversation = useCallback(() => setMessages([]), [])

    return useMemo(
        () => ({ messages, csvData, isLoading, isCsvLoading, sendMessage, loadCsvForRange, clearConversation }),
        [messages, csvData, isLoading, isCsvLoading, sendMessage, loadCsvForRange, clearConversation],
    )
}
