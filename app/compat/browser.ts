// These imports must execute before Nuxt restores SSR data or starts routing.
import 'core-js/es/object/has-own'
import 'core-js/es/array/at'
import 'core-js/es/string/at'
import 'core-js/es/string/replace-all'
import 'core-js/es/promise/any'
import 'core-js/es/promise/all-settled'
import 'core-js/es/array/flat-map'
import 'core-js/es/object/from-entries'
import { ResizeObserver as ResizeObserverPolyfill } from '@juggle/resize-observer'

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = ResizeObserverPolyfill
}

// Safari before 14 exposes the legacy MediaQueryList listener methods only.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const query = window.matchMedia('all')
  if (!query.addEventListener && query.addListener) {
    const matchMedia = window.matchMedia.bind(window)
    window.matchMedia = (media) => {
      const result = matchMedia(media)
      result.addEventListener = (type, listener) => {
        if (type === 'change' && listener) result.addListener(listener as (event: MediaQueryListEvent) => void)
      }
      result.removeEventListener = (type, listener) => {
        if (type === 'change' && listener) result.removeListener(listener as (event: MediaQueryListEvent) => void)
      }
      return result
    }
  }
}
