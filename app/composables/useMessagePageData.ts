import { ElMessage } from 'element-plus'
import { getCommentList, createComment } from '~/services/api/comments'
import { getSiteStats, type SiteStats } from '~/services/api/stats'
import { getBasicSettings, getSettings } from '~/services/api/user'
import type { UnifiedCommentForm, UnifiedCommentItem } from '~/components/comments/UnifiedCommentPanel.vue'
import { normalizeCommentList } from '~/utils/comments'
import { parseBlogJson } from '~/composables/useBlogSettings'
import { proxyImageUrl } from '~/utils/image'

export interface MessageProfileItem {
  label: string
  value: string
}

export interface MessageSocialLink {
  name: string
  url: string
  icon: string
}

export interface MessageModelSettings {
  enabled: boolean
  url: string
  credit: string
  rotate: boolean
  control: boolean
  zoom: boolean
}

export interface MessageStats {
  totalArticles: string
  totalComments: string
  runningDays: string
  totalWords: string
}

const EMPTY_STAT = '—'
const EMPTY_STATS: MessageStats = {
  totalArticles: EMPTY_STAT,
  totalComments: EMPTY_STAT,
  runningDays: EMPTY_STAT,
  totalWords: EMPTY_STAT
}

const toText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const statValue = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === '') return EMPTY_STAT
  return String(value)
}

const getShanghaiToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day)
  }
}

const calculateRunningDays = (established: string) => {
  const matched = established.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (!matched) return EMPTY_STAT

  const year = Number(matched[1])
  const month = Number(matched[2])
  const day = Number(matched[3])
  const establishedDate = new Date(Date.UTC(year, month - 1, day))

  if (
    establishedDate.getUTCFullYear() !== year ||
    establishedDate.getUTCMonth() !== month - 1 ||
    establishedDate.getUTCDate() !== day
  ) {
    return EMPTY_STAT
  }

  const today = getShanghaiToday()
  const todayDate = Date.UTC(today.year, today.month - 1, today.day)
  return String(Math.max(0, Math.floor((todayDate - establishedDate.getTime()) / 86400000)))
}

const parseSocialLinks = (value: string | undefined): MessageSocialLink[] => {
  const raw = parseBlogJson<Array<Record<string, unknown>>>(value, [])

  return raw
    .map((item) => ({
      name: toText(item.name),
      url: toText(item.url),
      icon: toText(item.icon) || 'earth'
    }))
    .filter((item) => item.name && item.url)
}

const parseProfile = (value: string | undefined) => {
  const raw = parseBlogJson<Array<Record<string, unknown>>>(value, [])
  const hometownLabels = ['故乡', '家乡', '籍贯']
  const profileList = raw
    .map((item) => ({ label: toText(item.label), value: toText(item.value) }))
    .filter((item) => item.label && item.value)
  const hometown = profileList.find((item) => hometownLabels.includes(item.label))?.value || ''

  return {
    hometown,
    profileList: profileList.filter((item) => !hometownLabels.includes(item.label))
  }
}

export const useMessagePageData = () => {
  const authorName = ref('')
  const authorAvatar = ref('')
  const aboutDescribe = ref('')
  const aboutDescribeTips = ref('')
  const aboutExhibition = ref('')
  const aboutStory = ref('')
  const blogEstablished = ref('')
  const profileList = ref<MessageProfileItem[]>([])
  const hometown = ref('')
  const mottoText = ref('')
  const mottoSub = ref('')
  const personality = ref('')
  const socialLinks = ref<MessageSocialLink[]>([])
  const model = reactive<MessageModelSettings>({
    enabled: true,
    url: '/models/cat/scene.gltf',
    credit: '',
    rotate: true,
    control: true,
    zoom: false
  })

  const stats = ref<MessageStats>({ ...EMPTY_STATS })
  const comments = ref<UnifiedCommentItem[]>([])
  const commentForm = ref<UnifiedCommentForm>({ nickname: '', email: '', website: '', content: '' })
  const normalizedComments = computed(() => comments.value)

  const loadingComments = ref(false)
  const loadingStats = ref(false)
  const submitting = ref(false)
  const settingsError = ref('')
  const statsError = ref('')
  const commentsError = ref('')

  const applySettings = (
    basicSettings: Record<string, string>,
    blogSettings: Record<string, string>
  ) => {
    authorName.value = basicSettings['basic.author'] || '博客作者'
    authorAvatar.value = proxyImageUrl(basicSettings['basic.author_avatar']) || ''
    aboutDescribe.value = blogSettings['blog.about_describe'] || ''
    aboutDescribeTips.value = blogSettings['blog.about_describe_tips'] || ''
    aboutExhibition.value = proxyImageUrl(blogSettings['blog.about_exhibition']) || ''
    aboutStory.value = blogSettings['blog.about_story'] || ''
    blogEstablished.value = blogSettings['blog.established'] || ''

    const profile = parseProfile(blogSettings['blog.about_profile'])
    profileList.value = profile.profileList
    hometown.value = profile.hometown

    const mottos = parseBlogJson<string[] | string>(blogSettings['blog.about_motto_main'], [])
    mottoText.value = Array.isArray(mottos) ? mottos.filter(Boolean).join(' · ') : toText(mottos)
    mottoSub.value = blogSettings['blog.about_motto_sub'] || ''
    personality.value = (blogSettings['blog.about_personality'] || '')
      .split(/[、，,|/\\]+/)
      .map((item) => item.trim())
      .filter(Boolean)[0] || ''

    const configuredSocials = blogSettings['blog.sidebar_social'] || blogSettings['blog.about_socialize']
    socialLinks.value = parseSocialLinks(configuredSocials)

    model.enabled = blogSettings['blog.about_model_enabled'] !== 'false'
    model.url = blogSettings['blog.about_model_url']?.trim() || '/models/cat/scene.gltf'
    model.credit = blogSettings['blog.about_model_credit']?.trim() || ''
    model.rotate = blogSettings['blog.about_model_rotate'] !== 'false'
    model.control = blogSettings['blog.about_model_control'] !== 'false'
    model.zoom = blogSettings['blog.about_model_zoom'] === 'true'
  }

  const fetchSettings = async () => {
    settingsError.value = ''

    try {
      const [settingsResponse, blogResponse] = await Promise.all([
        getBasicSettings(),
        getSettings('blog')
      ])
      applySettings(settingsResponse.data || {}, blogResponse.data || {})
    } catch (error) {
      console.error(error)
      settingsError.value = '部分关于信息暂时无法加载。'
    }
  }

  const fetchStats = async () => {
    loadingStats.value = true
    statsError.value = ''

    try {
      const response = await getSiteStats()
      if (response.code !== 0 || !response.data) {
        throw new Error(response.message || '网站统计加载失败')
      }

      const data: SiteStats = response.data
      stats.value = {
        totalArticles: statValue(data.total_articles),
        totalComments: statValue(data.total_comments),
        runningDays: calculateRunningDays(blogEstablished.value),
        totalWords: statValue(data.total_words)
      }
    } catch (error) {
      console.error(error)
      stats.value = {
        ...EMPTY_STATS,
        runningDays: calculateRunningDays(blogEstablished.value)
      }
      statsError.value = '本站统计暂时无法加载。'
    } finally {
      loadingStats.value = false
    }
  }

  const fetchComments = async () => {
    loadingComments.value = true
    commentsError.value = ''

    try {
      const response = await getCommentList({
        target_type: 'page',
        target_key: 'message',
        page: 1,
        page_size: 50
      })
      comments.value = normalizeCommentList(response.data?.list ?? []) as UnifiedCommentItem[]
    } catch (error) {
      console.error(error)
      comments.value = []
      commentsError.value = '留言加载失败，请稍后重试。'
    } finally {
      loadingComments.value = false
    }
  }

  const submitComment = async () => {
    const nickname = commentForm.value.nickname.trim()
    const email = commentForm.value.email.trim()
    const content = commentForm.value.content.trim()

    if (!nickname || !email || !content) {
      ElMessage.warning('请填写昵称、邮箱和留言内容。')
      return
    }

    if (Array.from(nickname).length < 2) {
      ElMessage.warning('昵称至少需要 2 个字符。')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      ElMessage.warning('请输入有效的邮箱地址。')
      return
    }

    submitting.value = true

    try {
      const response = await createComment({
        target_type: 'page',
        target_key: 'message',
        content,
        nickname,
        email,
        website: commentForm.value.website.trim() || undefined
      })

      if (response.code !== 0) {
        throw new Error(response.message || '留言发送失败，请稍后重试。')
      }

      commentForm.value = { nickname: '', email: '', website: '', content: '' }
      await Promise.all([fetchComments(), fetchStats()])
      ElMessage.success('留言发表成功。')
    } catch (error) {
      console.error(error)
      const apiMessage = error instanceof Error ? error.message : '留言发送失败，请稍后重试。'
      ElMessage.error(apiMessage)
    } finally {
      submitting.value = false
    }
  }

  const updateCommentForm = (value: UnifiedCommentForm) => {
    commentForm.value = value
  }

  const loadMessageData = async () => {
    await fetchSettings()
    await Promise.all([fetchStats(), fetchComments()])
  }

  onMounted(() => {
    void loadMessageData()
  })

  return {
    authorName,
    authorAvatar,
    aboutDescribe,
    aboutDescribeTips,
    aboutExhibition,
    aboutStory,
    profileList,
    hometown,
    mottoText,
    mottoSub,
    personality,
    socialLinks,
    model,
    stats,
    comments: normalizedComments,
    commentForm,
    loadingComments,
    loadingStats,
    submitting,
    settingsError,
    statsError,
    commentsError,
    updateCommentForm,
    submitComment
  }
}
