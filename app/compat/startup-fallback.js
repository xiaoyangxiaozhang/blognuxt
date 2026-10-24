// Keep this independent of Nuxt and ES modules: it also handles script failures.
(function () {
  var timer = window.setTimeout(showFallback, 12000)
  var fallback

  function showFallback() {
    if (fallback || !document.body) return
    fallback = document.createElement('section')
    fallback.id = 'blog-startup-fallback'
    fallback.setAttribute('role', 'alert')
    fallback.setAttribute('aria-label', '页面加载提示')
    fallback.style.cssText = 'position:fixed;inset:0;top:0;right:0;bottom:0;left:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#0e0e0e;color:#fff;padding:24px;text-align:center;font:16px/1.8 system-ui,sans-serif;'
    var content = document.createElement('div')
    var title = document.createElement('h1')
    title.textContent = '页面暂时未能打开'
    title.style.cssText = 'font-size:24px;margin:0 0 12px;'
    var description = document.createElement('p')
    description.textContent = '加载时间较长，请稍候或刷新页面重试。'
    var retry = document.createElement('button')
    retry.type = 'button'
    retry.textContent = '刷新页面'
    retry.style.cssText = 'padding:10px 24px;border:1px solid #999;border-radius:8px;background:#fff;color:#111;font:inherit;cursor:pointer;'
    retry.onclick = function () { window.location.reload() }
    content.appendChild(title)
    content.appendChild(description)
    content.appendChild(retry)
    fallback.appendChild(content)
    document.body.appendChild(fallback)
  }

  window.addEventListener('blog:ready', function () {
    window.clearTimeout(timer)
    if (fallback && fallback.parentNode) fallback.parentNode.removeChild(fallback)
  })
}())
