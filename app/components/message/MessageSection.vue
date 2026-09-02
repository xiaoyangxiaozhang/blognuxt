<script setup lang="ts">
withDefaults(defineProps<{
  id?: string
  number: string
  title: string
}>(), {
  id: undefined
})
</script>

<template>
  <section :id="id" class="message-module">
    <aside class="module-marker">
      <div class="marker-heading">
        <span class="marker-number">{{ number }}</span>
        <h2>{{ title }}</h2>
      </div>
    </aside>

    <div class="module-content">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.message-module {
  display: grid;
  grid-template-columns: minmax(190px, 0.8fr) minmax(0, 2fr);
  gap: 32px;
  padding: 56px 0;
  scroll-margin-top: 110px;
}

.module-marker {
  display: grid;
  grid-template-rows: 1fr auto;
  min-height: 240px;
}

.marker-heading {
  align-self: end;
}

.marker-number {
  display: block;
  color: var(--home-text);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.marker-heading h2 {
  margin: 14px 0 0;
  color: var(--home-text);
  font-size: 32px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.035em;
}

.module-content {
  min-width: 0;
}

@media (max-width: 900px) {
  .message-module {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 40px 0;
  }

  .module-marker {
    display: block;
    min-height: 0;
  }

  .marker-heading h2 {
    margin-top: 10px;
    font-size: 28px;
  }

}

@media (max-width: 560px) {
  .message-module {
    gap: 18px;
    padding: 32px 0;
  }

  .marker-heading h2 {
    font-size: 24px;
  }
}
</style>
