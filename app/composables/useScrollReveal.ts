import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

interface ScrollRevealOptions {
  selector?: string
  rootMargin?: string
  threshold?: number | number[]
}

export const useScrollReveal = (
  root: Ref<HTMLElement | null>,
  options: ScrollRevealOptions = {}
) => {
  const {
    selector = '[data-scroll-reveal]',
    rootMargin = '0px 0px -8% 0px',
    threshold = 0.12
  } = options

  let observer: IntersectionObserver | null = null
  const isReady = ref(false)

  const revealAll = () => {
    if (!root.value) return

    root.value.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      element.classList.add('is-revealed')
    })
  }

  const observeTargets = () => {
    if (!import.meta.client || !root.value) return

    const targets = root.value.querySelectorAll<HTMLElement>(selector)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      revealAll()
      return
    }

    if (!observer) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          entry.target.classList.add('is-revealed')
          observer?.unobserve(entry.target)
        })
      }, {
        rootMargin,
        threshold
      })
    }

    targets.forEach((target) => {
      if (!target.classList.contains('is-revealed')) {
        observer?.observe(target)
      }
    })
  }

  const refresh = () => {
    void nextTick(observeTargets)
  }

  onMounted(() => {
    isReady.value = true
    refresh()
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { isReady, refresh }
}
