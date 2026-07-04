import 'maplibre-gl/dist/maplibre-gl.css'
import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Register the map tile cache service worker.
// The SW intercepts requests to Esri (tiles) and CARTO (glyphs) only —
// it does not touch API, SignalR, or any other request.
// First boot: pre-caches Damascus z10-z12 tiles (~10 MB, one-time).
// Subsequent boots / offline: serves tiles from Cache Storage immediately.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .then((reg) => {
                // Check for SW updates in the background. New version activates
                // after the next page reload (skipWaiting is called in install).
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing
                    if (!newWorker) return
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // A new SW is waiting — it will take over on next reload.
                            console.info('[GridTrack SW] Update available — will apply on next reload.')
                        }
                    })
                })
            })
            .catch((err) => {
                // Non-fatal: map still works without SW, just without offline/cache support.
                console.warn('[GridTrack SW] Registration failed:', err)
            })
    })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
