<template>
  <section class="friends-page">
    <div class="friends-shell">
      <header class="friends-header">
        <h1 class="friends-title">友链</h1>
        <span class="friends-rule" aria-hidden="true"></span>
      </header>

      <p class="friends-empty">暂无友链</p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.friends-page {
  min-height: 60vh;
  background: var(--home-surface);
  color: var(--home-text);
}

.friends-shell {
  width: min(1000px, calc(100% - 60px));
  margin: 0 auto;
  padding: 104px 0 72px;
}

.friends-header {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 36px;
}

.friends-title {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
  line-height: 1.1;
}

.friends-rule {
  width: 56px;
  height: 1px;
  margin-bottom: 5px;
  background: var(--home-border);
}

.friends-empty {
  margin: 0;
  padding: 24px 0;
  border-top: 1px solid var(--home-border);
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.7;
}

@media (max-width: 768px) {
  .friends-shell {
    width: min(100% - 40px, 600px);
    padding: 80px 0 56px;
  }

  .friends-title {
    font-size: 28px;
  }
}
</style>
