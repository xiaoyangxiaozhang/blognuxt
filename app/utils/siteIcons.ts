import { defineComponent, h } from 'vue'
import { MorphIcon, type IconInput } from 'morphicons/vue'
import {
  Archive, ArrowLeft, Bell, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleCheck,
  Ellipsis, Eye, EyeOff, Globe, Heart, Image, Info, Mail, MapPin,
  Menu, MessageCircle, Moon, Pause, Play, Search, Send, Settings,
  SkipBack, SkipForward, Smile, Sun, TriangleAlert, UserRound, X
} from 'lucide'

// 常用操作共享 Lucide 的线条和 Morphicons 的状态变形，平台标志保留原组件。
const createIcon = (icon: IconInput, activeIcon = icon, filled = false) => defineComponent({
  name: 'SiteIcon',
  inheritAttrs: false,
  props: {
    active: Boolean,
    instant: Boolean
  },
  setup(props, { attrs }) {
    return () => h(MorphIcon, {
      ...attrs,
      class: ['site-icon', attrs.class],
      icon: props.active ? activeIcon : icon,
      spring: 'snappy',
      reducedMotion: props.instant ? 'always' : 'user',
      ...(filled ? { fill: 'currentColor' } : {})
    })
  }
})

export const ArchiveIcon = createIcon(Archive)
export const ArrowLeftIcon = createIcon(ArrowLeft)
export const BellIcon = createIcon(Bell)
export const ChatBubbleIcon = createIcon(MessageCircle)
export const CheckCircledIcon = createIcon(CircleCheck)
export const ChevronDownIcon = createIcon(ChevronDown, ChevronUp)
export const ChevronLeftIcon = createIcon(ChevronLeft)
export const ChevronRightIcon = createIcon(ChevronRight)
export const Cross1Icon = createIcon(X)
export const DotsHorizontalIcon = createIcon(Ellipsis)
export const EnvelopeClosedIcon = createIcon(Mail)
export const ExclamationTriangleIcon = createIcon(TriangleAlert)
export const EyeOpenIcon = createIcon(Eye, EyeOff)
export const FaceIcon = createIcon(Smile)
export const GearIcon = createIcon(Settings)
export const GlobeIcon = createIcon(Globe)
export const HamburgerMenuIcon = createIcon(Menu, X)
export const HeartFilledIcon = createIcon(Heart, Heart, true)
export const HeartIcon = createIcon(Heart)
export const ImageIcon = createIcon(Image)
export const InfoCircledIcon = createIcon(Info)
export const MagnifyingGlassIcon = createIcon(Search)
export const PaperPlaneIcon = createIcon(Send)
export const PersonIcon = createIcon(UserRound)
export const PlayIcon = createIcon(Play, Pause)
export const SewingPinIcon = createIcon(MapPin)
export const ThemeIcon = createIcon(Sun, Moon)
export const TrackNextIcon = createIcon(SkipForward)
export const TrackPreviousIcon = createIcon(SkipBack)
