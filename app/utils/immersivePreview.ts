export type PreparedPreview<T> = { item: T, imageUrl: string | null, instant?: boolean }

export type PreviewSnapshot<T> = {
  requestedId: number | null
  settled: PreparedPreview<T> | null
  entering: PreparedPreview<T> | null
  phase: 'idle' | 'preparing' | 'transitioning' | 'disposed'
}

type PreviewItem = { id: number }

export function createImmersivePreview<T extends PreviewItem>(
  initial: PreparedPreview<T> | null,
  options: {
    prepare: (item: T) => Promise<string | null>
    isAllowed: (item: T) => boolean
    onChange: (snapshot: PreviewSnapshot<T>) => void
    onBegin: (instant: boolean) => void
    onHurry: () => void
    onCancel: () => void
  }
) {
  let requested = initial?.item || null
  let settled = initial
  let entering: PreparedPreview<T> | null = null
  let pending: PreparedPreview<T> | null = null
  let version = 0
  let preparing = false
  let disposed = false

  const snapshot = (): PreviewSnapshot<T> => ({
    requestedId: requested?.id ?? null,
    settled,
    entering,
    phase: disposed ? 'disposed' : entering ? 'transitioning' : preparing ? 'preparing' : 'idle'
  })

  const publish = () => options.onChange(snapshot())

  const begin = (next: PreparedPreview<T>) => {
    if (!settled) {
      settled = next
      publish()
      return
    }
    entering = next
    publish()
    options.onBegin(Boolean(next.instant))
  }

  const request = async (item: T, instant = false) => {
    if (disposed || !options.isAllowed(item)) return
    if (requested?.id === item.id && (preparing || entering?.item.id === item.id || settled?.item.id === item.id && !entering)) return

    requested = item
    pending = null
    const ownVersion = ++version
    preparing = true
    publish()

    let imageUrl: string | null = null
    try {
      imageUrl = await options.prepare(item)
    } catch {
      // A failed cover still leaves the article and its link usable.
    }
    if (disposed || ownVersion !== version || !options.isAllowed(item)) return

    preparing = false
    const ready = { item, imageUrl, instant }
    if (entering) {
      if (entering.item.id !== item.id) {
        pending = ready
        options.onHurry()
      }
      publish()
      return
    }
    if (settled?.item.id === item.id) {
      publish()
      return
    }
    begin(ready)
  }

  const complete = () => {
    if (disposed || !entering) return
    settled = entering
    entering = null
    publish()

    const next = pending
    pending = null
    if (next && requested?.id === next.item.id && options.isAllowed(next.item) && settled.item.id !== next.item.id) {
      begin(next)
    }
  }

  const reconcile = () => {
    if (disposed) return null
    const preferred = requested && options.isAllowed(requested) ? requested : null
    ++version
    preparing = false
    pending = null
    if (entering && !options.isAllowed(entering.item)) {
      entering = null
      options.onCancel()
    }
    if (settled && !options.isAllowed(settled.item)) settled = null
    if (entering && !settled) {
      settled = entering
      entering = null
      options.onCancel()
    }
    requested = entering?.item || settled?.item || null
    publish()
    return preferred
  }

  const markImageFailed = (id: number) => {
    if (settled?.item.id === id) settled = { ...settled, imageUrl: null }
    if (entering?.item.id === id) entering = { ...entering, imageUrl: null }
    publish()
  }

  const dispose = () => {
    if (disposed) return
    disposed = true
    ++version
    pending = null
    entering = null
    options.onCancel()
    publish()
  }

  return { request, complete, reconcile, markImageFailed, dispose, snapshot }
}
