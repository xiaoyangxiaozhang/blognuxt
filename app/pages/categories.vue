<template>
  <section class="placeholder-page">
    <h1>分类</h1>
   <div v-for="item in categories" :key="item.id">
      {{ item.name }} : {{ item.count }}
    </div>
  </section>
</template>
<script setup lang="ts">
// 基础用法
import { getCategoryList } from '~/composables/api/category'

const categories = ref<Category[]>([])
type Category = {
  id: number
  name: string
  count: number
}

onMounted(async () => {
  const res = await getCategoryList({ page_size: 10 })
  categories.value = res.data.list
})



</script>
<style scoped lang="scss">
.placeholder-page {
  min-height: 60vh;
  display: grid;
  place-content: center;
  gap: 12px;
  text-align: center;
  color: var(--text-primary);
}
</style>
