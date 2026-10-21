<script setup lang="ts">
import { HOBBIES } from '../../lib'

defineOptions({ name: 'AboutText' })
</script>

<template>
  <div class="about-text">
    <h3>角色背景</h3>
    <p>
      洛洛希雅是一位温柔体贴的治愈系大姐姐，在游戏中独特的风格和少见的形象而闻名。她凭借着超强的亲和力成为了玩家间的情感纽带。
    </p>
    <p class="about-text__quote">——“哎哎？怎么又刷怪啦？”</p>

    <h3>性格特点</h3>
    <p>温柔体贴、善解人意、可靠稳重。她总是愿意倾听他人的烦恼，并用温暖的话语给予安慰和支持。</p>

    <h3>兴趣爱好</h3>
    <ul class="about-text__hobbies">
      <li v-for="hobby in HOBBIES" :key="hobby">{{ hobby }}</li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.about-text {
  color: #6b5c70;
  font-size: 14px;
  line-height: 1.85;

  h3 {
    margin: 0 0 8px;
    color: #3d2f42;
    font-size: 16px;

    &:not(:first-child) {
      margin-top: 22px;
    }
  }

  p {
    margin: 0;
    text-align: justify;
  }

  &__quote {
    color: #a480ab;
    font-style: italic;
    text-align: right;
  }

  &__hobbies {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      padding: 4px 12px;
      border-radius: 999px;
      color: #8b6a92;
      font-size: 12px;
      background: rgba(194, 150, 205, 0.14);
    }
  }
}
</style>
