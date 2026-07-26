import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { APP_CONFIG } from '@/config/app.config'
import { PAGE_CONFIG } from '@/config/pages.config'
import DateRangePicker, { type DateRangeValue } from './DateRangePicker'
import ChatbotPanel from './chatbot/ChatbotPanel'
import StaffingWidget from './staffing/StaffingWidget'

const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const FULL_HOUR_START = 0
const FULL_HOUR_END = 23

export default function AssistantPage() {
    const chatbotEnabled = PAGE_CONFIG.analyticsChatbot.enabled
    const [range, setRange] = useState<DateRangeValue>(() => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - (APP_CONFIG.analytics.defaultRangeDays - 1))
        return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) }
    })
    const [appliedRange, setAppliedRange] = useState<DateRangeValue>(range)

    return (
        <div className="flex flex-col gap-6 p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">AI Assistant</h1>
                    <p className="text-xs text-[hsl(var(--foreground-muted))]">Staffing forecast and a chatbot over the selected date range.</p>
                </div>
                <DateRangePicker value={range} onChange={setRange} onApply={setAppliedRange} />
            </header>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr] items-start">
                <StaffingWidget />

                <Card>
                    <CardHeader className="border-b border-[hsl(var(--border))] bg-[hsl(var(--accent-purple)/0.06)]">
                        <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--accent-purple)/0.15)] text-[hsl(var(--accent-purple))]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                        </span>
                            <div>
                                <CardTitle className="text-sm font-semibold text-[hsl(var(--foreground))]">
                                    AI Analysis
                                </CardTitle>
                                <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                    Pick a date range — the conversation loads that export automatically.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {chatbotEnabled ? (
                            <ChatbotPanel
                                range={appliedRange}
                                activeDays={ALL_DAYS}
                                hourStart={FULL_HOUR_START}
                                hourEnd={FULL_HOUR_END}
                            />
                        ) : (
                            <div className="rounded-lg border border-dashed border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                                <p className="text-xs text-[hsl(var(--foreground-subtle))] italic">
                                    {PAGE_CONFIG.analyticsChatbot.disabledMessage}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
