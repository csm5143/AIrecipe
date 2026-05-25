<template>
  <div class="phone"><div class="notch"></div>
    <div class="screen">
      <!-- 搜索栏 (sticky) -->
      <div class="search-bar"><div class="search-input"><span>🔍</span><span class="s-placeholder">搜索菜谱、食材</span></div></div>
      <!-- Banner Swiper -->
      <div class="banner" v-if="appBanner" @click="$emit('select','app-banner',{imageUrl:appBanner,title:'首屏Banner'})"><img :src="appBanner" class="banner-img" /></div>
      <div v-else class="banner banner-empty" @click="$emit('select','app-banner',{imageUrl:'',title:'首屏Banner'})">Banner 待配置</div>
      <!-- 功能入口 -->
      <div class="quick-entry">
        <div v-for="e in entries" :key="e.label" class="entry-item">
          <div class="entry-icon">{{ e.emoji }}</div><span class="entry-text">{{ e.label }}</span>
        </div>
      </div>
      <!-- 热门推荐 (横滚) -->
      <div class="section"><div class="section-hd"><span class="section-title">热门推荐</span><span class="section-more">更多</span></div>
        <div class="scroll-x"><div class="scroll-track">
          <div v-for="r in appRecipes" :key="r.id" class="rcard" @click="$emit('select','app-recipe',{...r,title:r.name,imageUrl:r.coverUrl})">
            <img v-if="r.coverUrl" :src="r.coverUrl" class="rc-cover" /><div v-else class="rc-cover-empty"></div>
            <div class="rc-info"><span class="rc-title">{{ r.name }}</span>
              <div class="rc-meta"><span>⏱{{ r.time||30 }}分钟</span><span>🔥{{ r.calories||'--' }}千卡</span><span class="rc-diff rc-easy">简单</span></div>
            </div>
          </div>
        </div></div>
      </div>
      <!-- 猜你喜欢 (双列) -->
      <div class="section"><div class="section-hd"><span class="section-title">猜你喜欢</span></div>
        <div class="grid-2">
          <div v-for="r in appRecipes" :key="'g'+r.id" class="rcard" @click="$emit('select','app-recipe',{...r,title:r.name,imageUrl:r.coverUrl})">
            <img v-if="r.coverUrl" :src="r.coverUrl" class="rc-cover" /><div v-else class="rc-cover-empty"></div>
            <div class="rc-info"><span class="rc-title">{{ r.name }}</span>
              <div class="rc-meta"><span>⏱{{ r.time||30 }}分钟</span><span>🔥{{ r.calories||'--' }}千卡</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{ appBanner?: string; appLogo?: string; appRecipes?: any[] }>();
defineEmits<{ select: [t:string, d:any] }>();
const entries = [{label:'儿童营养',emoji:'👶'},{label:'健身餐',emoji:'💪'},{label:'拍照识别',emoji:'📸'},{label:'我的收藏',emoji:'⭐'}];
</script>
<style scoped>
.phone { width:340px; margin:0 auto; border:4px solid #1a1a1a; border-radius:32px; overflow:hidden; background:#f5f5f5; position:relative; }
.notch { position:absolute; top:0; left:50%; transform:translateX(-50%); width:80px; height:18px; background:#1a1a1a; border-radius:0 0 14px 14px; z-index:10; }
.screen { height:620px; overflow-y:auto; &::-webkit-scrollbar{width:3px} &::-webkit-scrollbar-thumb{background:#ccc} }
.search-bar { position:sticky; top:0; z-index:10; padding:8px 12px; background:#fff; }
.search-input { display:flex; align-items:center; gap:6px; height:32px; padding:0 12px; background:#f5f5f5; border-radius:16px; }
.s-placeholder { font-size:12px; color:#999; }
.banner { height:128px; margin:8px 12px; border-radius:8px; overflow:hidden; cursor:pointer; }
.banner-img { width:100%; height:100%; object-fit:cover; }
.banner-empty { background:linear-gradient(135deg,#ffe0b2,#ffcc80); display:flex; align-items:center; justify-content:center; font-size:12px; color:#999; }
.quick-entry { display:flex; justify-content:space-around; padding:10px 12px; margin:0 12px; background:#fff; border-radius:8px; margin-bottom:8px; }
.entry-item { display:flex; flex-direction:column; align-items:center; gap:2px; }
.entry-icon { font-size:28px; } .entry-text { font-size:10px; color:#666; }
.section { padding:6px 12px; } .section-hd { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
.section-title { font-size:13px; font-weight:700; color:#333; } .section-more { font-size:11px; color:#999; }
.scroll-x { overflow-x:auto; &::-webkit-scrollbar{height:2px} } .scroll-track { display:inline-flex; gap:8px; padding-bottom:2px; }
.rcard { background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.04); cursor:pointer; }
.scroll-track .rcard { width:120px; flex-shrink:0; }
.rc-cover { width:100%; height:100px; object-fit:cover; display:block; }
.rc-cover-empty { width:100%; height:100px; background:#eee; }
.rc-info { padding:6px 8px; } .rc-title { font-size:12px; font-weight:600; color:#333; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.rc-meta { display:flex; gap:6px; font-size:10px; color:#999; margin-top:2px; }
.rc-diff { font-size:9px; padding:1px 4px; border-radius:3px; margin-left:auto; } .rc-easy { background:#e8f5e9; color:#4caf50; }
.grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; } .grid-2 .rc-cover { height:90px; }
</style>
