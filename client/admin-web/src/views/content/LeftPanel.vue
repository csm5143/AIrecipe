<template>
  <div class="lp">
    <div class="lp-hd">{{ pageLabel }} · 可编辑</div>
    <div class="lp-items">
      <!-- 首页 -->
      <template v-if="page==='home'">
        <div class="lp-it" :class="{on:selKey==='brand'}" @click="$emit('select',{_key:'brand',_type:'brand',_title:'品牌 Logo',title:'品牌 Logo',imageUrl:brand})">
          <span class="lp-ic">🏷</span><span>品牌 Logo</span>
        </div>
        <div class="lp-it" v-for="h in hot" :key="'hot-'+h.id" :class="{on:selKey==='hot-'+h.id}"
          @click="$emit('select',{_key:'hot-'+h.id,_type:'hot',_title:h.name,title:h.name,name:h.name,imageUrl:h.coverUrl,coverUrl:h.coverUrl,id:h.id})">
          <img v-if="h.coverUrl" :src="h.coverUrl" class="lp-th" /><span v-else class="lp-ic">🖼</span>
          <span>{{ h.name }}</span>
        </div>
        <div v-if="!hot.length" class="lp-empty">加载中...</div>
      </template>

      <!-- 定制页 -->
      <template v-else-if="page==='custom'">
        <div class="lp-it" v-for="c in cards" :key="'card-'+c.id" :class="{on:selKey==='card-'+c.id}"
          @click="$emit('select',{...c,_key:'card-'+c.id,_type:'card',_title:c.title})">
          <img v-if="c.imageUrl" :src="c.imageUrl" class="lp-th" /><span v-else class="lp-ic">🖼</span>
          <span>{{ c.title }}</span>
        </div>
        <div class="lp-it" :class="{on:selKey==='fitness'}" @click="$emit('select',{_key:'fitness',_type:'fitness',_title:'健身 Banner',title:'健身减脂餐 Banner',imageUrl:fitness})">
          <span class="lp-ic">💪</span><span>健身 Banner</span>
        </div>
        <div class="lp-it" :class="{on:selKey==='kids'}" @click="$emit('select',{_key:'kids',_type:'kids',_title:'儿童 Banner',title:'儿童营养餐 Banner',imageUrl:kids})">
          <span class="lp-ic">👶</span><span>儿童 Banner</span>
        </div>
        <div v-if="!cards.length" class="lp-empty">加载中...</div>
      </template>

      <!-- 我的 -->
      <template v-else-if="page==='mine'">
        <div class="lp-it" :class="{on:selKey==='about'}" @click="$emit('select',{_key:'about',_type:'about',_title:'关于我们',title:'关于我们',content:about})">
          <span class="lp-ic">ℹ</span><span>关于我们</span>
        </div>
      </template>

      <!-- APP -->
      <template v-else-if="page==='app'">
        <div class="lp-it" :class="{on:selKey==='app-logo'}" @click="$emit('select',{_key:'app-logo',_type:'app-logo',_title:'APP Logo',title:'APP Logo',imageUrl:appLogo})">
          <span class="lp-ic">🏷</span><span>APP Logo</span>
        </div>
        <div class="lp-it" :class="{on:selKey==='app-banner'}" @click="$emit('select',{_key:'app-banner',_type:'app-banner',_title:'首屏 Banner',title:'APP 首页 Banner',imageUrl:appBanner})">
          <span class="lp-ic">🖼</span><span>首页 Banner</span>
        </div>
      </template>

      <!-- Web -->
      <template v-else-if="page==='web'">
        <div class="lp-it" :class="{on:selKey==='web-logo'}" @click="$emit('select',{_key:'web-logo',_type:'web-logo',_title:'网站 Logo',title:'网站 Logo',imageUrl:webLogo})">
          <span class="lp-ic">🏷</span><span>网站 Logo</span>
        </div>
        <div class="lp-it" :class="{on:selKey==='web-hero'}" @click="$emit('select',{_key:'web-hero',_type:'web-hero',_title:'首屏 Hero',title:'网站 Hero 图',imageUrl:webHero})">
          <span class="lp-ic">🖼</span><span>首页 Hero 图</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  page: string;
  cards?: any[];
  hot?: any[];
  brand?: string;
  fitness?: string;
  kids?: string;
  about?: string;
  selKey?: string;
  appLogo?: string;
  appBanner?: string;
  webLogo?: string;
  webHero?: string;
}>();

defineEmits<{ select: [item: any] }>();

const pageLabel = computed(() => {
  const m: Record<string, string> = { home: '首页', custom: '定制页', mine: '我的', app: 'APP', web: 'Web' };
  return m[props.page] || '';
});
</script>

<style scoped>
.lp { width: 240px; flex-shrink: 0; border-right: 1px solid var(--border-primary, #e0e0e0); overflow-y: auto; background: var(--surface-50, #fafaf9); display: flex; flex-direction: column; }
.lp-hd { font-size: 12px; color: var(--muted, #7a6a58); padding: 12px 16px 8px; font-weight: 600; }
.lp-items { padding: 0 8px 16px; display: flex; flex-direction: column; gap: 2px; flex: 1; overflow-y: auto; }
.lp-it { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 6px; cursor: pointer; font-size: 13px; color: var(--text, #4a3b2a); }
.lp-it:hover { background: var(--surface-200, #f6e8d6); }
.lp-it.on { background: rgba(226,165,80,.12); color: var(--primary-strong, #c7862d); font-weight: 600; }
.lp-ic { font-size: 16px; flex-shrink: 0; }
.lp-th { width: 28px; height: 28px; border-radius: 4px; object-fit: cover; flex-shrink: 0; }
.lp-empty { font-size: 12px; color: var(--muted, #7a6a58); padding: 12px 10px; text-align: center; }
</style>
