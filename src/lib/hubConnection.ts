import type { HubConnection } from '@microsoft/signalr'

let conn: HubConnection | null = null

export function setHubConnection(c: HubConnection | null) { conn = c }
export function getHubConnection(): HubConnection | null { return conn }
