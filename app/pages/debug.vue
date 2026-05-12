<template>
  <div class="debug-page">
    <h1>API 调试页面</h1>
    
    <div class="api-list">
      <button @click="testCategories" class="api-btn">
        📦 测试分类接口
      </button>
      <button @click="testArticles" class="api-btn">
        📝 测试文章列表
      </button>
      <button @click="testTags" class="api-btn">
        🏷️ 测试标签接口
      </button>
      <button @click="testMoments" class="api-btn">
        🎵 测试动态接口
      </button>
    </div>

    <div class="result-area">
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const result = ref('点击上方按钮测试接口...')

const testApi = async (url: string) => {
  result.value = `正在请求: ${url}\n\n`
  
  try {
    const response = await fetch(`http://39.106.193.56:8080/api/v1${url}`)
    const data = await response.json()
    result.value = `✅ 请求成功!\n\nURL: ${url}\n\n响应:\n${JSON.stringify(data, null, 2)}`
  } catch (error: any) {
    result.value = `❌ 请求失败!\n\nURL: ${url}\n\n错误: ${error.message}`
  }
}

const testCategories = () => testApi('/categories')
const testArticles = () => testApi('/articles?page=1&page_size=5')
const testTags = () => testApi('/tags')
const testMoments = () => testApi('/moments')
</script>

<style scoped>
.debug-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

h1 {
  color: var(--text-primary);
  margin-bottom: 24px;
}

.api-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.api-btn {
  padding: 12px 20px;
  border: 1px solid var(--accent-border);
  border-radius: 8px;
  background: var(--bg-panel);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.api-btn:hover {
  background: var(--accent-soft);
  border-color: var(--accent);
}

.result-area {
  padding: 20px;
  background: var(--bg-panel);
  border-radius: 12px;
  max-height: 60vh;
  overflow-y: auto;
}

pre {
  color: var(--text-secondary);
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  white-space: pre-wrap;
}
</style>
