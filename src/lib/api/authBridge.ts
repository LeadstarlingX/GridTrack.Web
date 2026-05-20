type GetTokenFn = () => Promise<string | null>
type SignOutFn = () => Promise<void>

let tokenFn: GetTokenFn | null = null
let signOutFn: SignOutFn | null = null

export function setAuthBridge(fns: { getToken: GetTokenFn; signOut: SignOutFn }) {
    tokenFn = fns.getToken
    signOutFn = fns.signOut
}

export async function getAuthToken(): Promise<string | null> {
    return tokenFn?.() ?? null
}

export async function signOutUser(): Promise<void> {
    return signOutFn?.()
}
