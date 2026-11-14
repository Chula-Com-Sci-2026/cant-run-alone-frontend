import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { gateway } from '../api/gateway'

// Names the spot a map pin was dropped on. The 1 s wait keeps rapid clicks within Nominatim's limit,
// and a newer pin (or the runner typing a name) cancels the lookup still waiting.
export function usePlaceLookup(onName: (name: string) => void, hints: { found: string; missing: string; failed: string }) {
  const { i18n } = useTranslation()
  const [note, setNote] = useState('')
  const pending = useRef<{ timer?: number; controller?: AbortController }>({})
  const cancel = () => { window.clearTimeout(pending.current.timer); pending.current.controller?.abort() }
  useEffect(() => cancel, [])
  const lookup = (latitude: number, longitude: number) => {
    cancel()
    setNote('Finding the place name…')
    const controller = new AbortController()
    pending.current = { controller, timer: window.setTimeout(async () => {
      try {
        const name = await gateway.findPlaceName(latitude, longitude, i18n.language.slice(0, 2), controller.signal)
        if (name) onName(name)
        setNote(name ? hints.found : hints.missing)
      } catch { if (!controller.signal.aborted) setNote(hints.failed) }
    }, 1000) }
  }
  const stop = () => { cancel(); setNote('') }
  return { note, lookup, stop }
}
