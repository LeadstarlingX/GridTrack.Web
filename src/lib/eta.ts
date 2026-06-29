export function toEtaDeadline(etaSeconds: number | null | undefined): string | null {
    if (etaSeconds == null || etaSeconds <= 0) return null
    return new Date(Date.now() + etaSeconds * 1000).toISOString()
}
