import { computed, reactive } from 'vue'
import type { ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import { getRoot } from '@/core/lib/http'
import { setTransitionOrigin } from '@/core/lib/transition'

/** 入口页的一张导航卡片。 */
export interface LandingCard {
  id: number
  title: string
  subtitle: string
  description: string
  icon: string
  bgClass: string
  themeColor: string
  borderColor: string
  themeRgb: string
  path?: string
  external?: string
  bgImage?: string | ComputedRef<string>
  hoverImage?: string | ComputedRef<string>
}

/** 入口页的卡片数据与跳转逻辑。 */
export function useLandingCards() {
  const router = useRouter()

  const kigurumiCardBg = computed(
    () => `${getRoot()}/res/resources/landing/d5391250-3388-4a6e-9bec-37e7682f3152.png?webp`
  )
  const lolosiaCardBg = computed(() => `${getRoot()}/res/resources/landing/Image_1775403972460_494.png?webp`)
  const lolosiaHoverBg = computed(() => `${getRoot()}/res/resources/landing/Image_1775402728678_548.png?webp`)

  const cards: LandingCard[] = reactive([
    {
      id: 1,
      title: '软件外包服务',
      subtitle: 'Software Outsourcing',
      description: '定制化解决方案 · 赋能商业创新',
      icon: '⊞',
      bgClass: 'bg-card-1',
      themeColor: 'rgb(125 142 209 / 1)',
      borderColor: 'rgb(144 159 230 / 0.75)',
      themeRgb: '125, 142, 209',
      path: '/'
    },
    {
      id: 2,
      title: 'OVR叠加层应用',
      subtitle: 'OVR Overlay Apps',
      description: '虚拟与现实 · 无缝融合体验',
      icon: '◈',
      bgClass: 'bg-card-2',
      themeColor: 'rgb(229 166 239 / 1)',
      borderColor: 'rgb(215 152 223 / 0.75)',
      themeRgb: '229, 166, 239',
      path: '/'
    },
    {
      id: 3,
      title: 'VRC Kigurumi社团',
      subtitle: 'VRC Kigurumi Club',
      description: '二次元角色 · 沉浸式社交',
      icon: '✦',
      bgClass: 'bg-card-3',
      themeColor: 'rgba(79, 172, 254, 1)',
      borderColor: 'rgba(79, 172, 254, 0.75)',
      themeRgb: '79, 172, 254',
      external: 'https://vrc.group/VRCKIG.4693',
      bgImage: kigurumiCardBg
    },
    {
      id: 4,
      title: '洛洛希雅',
      subtitle: 'Lolosia',
      description: '虚拟偶像个人主页 · 进入梦幻世界',
      icon: '♡',
      bgClass: 'bg-card-4',
      themeColor: 'rgba(194, 150, 205, 1)',
      borderColor: 'rgba(194, 150, 205, 0.75)',
      themeRgb: '194, 150, 205',
      path: '/lolosia',
      bgImage: lolosiaCardBg,
      hoverImage: lolosiaHoverBg
    }
  ])

  const leftCards = computed(() => cards.slice(0, 3))
  const largeCard = computed(() => cards[3])

  function open(card: LandingCard, event: MouseEvent): void {
    setTransitionOrigin(event.clientX, event.clientY)
    if (card.path) {
      void router.push(card.path)
    } else if (card.external) {
      window.open(card.external, '_blank')
    }
  }

  return { leftCards, largeCard, open }
}
