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
                    <h1 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">AI Assistant</h1>
                    <p className="text-xs text-[hsl(var(--foreground-muted))]">Staffing forecast and a chatbot over the selected date range.</p>
                </div>
                <DateRangePicker value={range} onChange={setRange} onApply={setAppliedRange} />
            </header>

            <StaffingWidget />

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                        AI Analysis
                    </CardTitle>
                    <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                        Pick a date range — the conversation loads that export automatically.
                    </CardDescription>
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
    )
}
