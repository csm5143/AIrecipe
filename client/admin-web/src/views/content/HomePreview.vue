<template>
  <div class="phone">
    <div class="notch"></div>
    <div class="screen">
      <div class="brand"><img v-if="brandLogo" :src="brandLogo" class="brand-img" @click="$emit('select','brand',{imageUrl:brandLogo,title:'品牌Logo'})" /></div>
      <div class="search"><span>🔍</span><span class="search-txt">搜索菜谱</span></div>
      <div class="cats"><div v-for="c in cats" :key="c" class="cat"><div class="cat-b">{{c.e}}</div><span class="cat-l">{{c.n}}</span></div></div>
      <div class="tiles">
        <div class="t t-s"><div class="t-i ti-s"><span>📸</span></div><div class="t-n"><span class="t-tt s-tt">拍照识别食材</span><span class="t-st">AI智能分析并推荐菜谱</span></div></div>
        <div class="t t-p"><div class="t-i ti-p"><span>👆</span></div><div class="t-n"><span class="t-tt">手动勾选食材</span><span class="t-st">从食材库中挑选</span></div></div>
      </div>
      <div class="sh"><span class="sh-t">热门推荐</span></div>
      <div class="hot">
        <div v-for="r in hotRecipes" :key="r.id" class="h-c" @click="$emit('select','hot',{...r,title:r.name})">
          <div class="h-w"><img v-if="r.coverUrl" :src="r.coverUrl" class="h-cv" /><div v-else class="h-ph">配图待导入</div></div>
          <span class="h-n">{{ r.name }}</span>
        </div>
      </div>
      <div class="ft">— 让所有的食材，都有做法！ —</div>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{ brandLogo?: string; hotRecipes?: any[] }>();
defineEmits<{ select: [t: string, d: any] }>();
const cats = [{n:'小炒菜',e:'🥘'},{n:'汤品',e:'🍲'},{n:'早餐',e:'🌅'},{n:'烘焙',e:'🍰'},{n:'更多',e:'➕'}];
</script>
<style scoped>
.phone { width:340px; margin:0 auto; border:4px solid #1a1a1a; border-radius:32px; overflow:hidden; background:#f5f5f7; position:relative; }
.notch { position:absolute; top:0; left:50%; transform:translateX(-50%); width:80px; height:18px; background:#1a1a1a; border-radius:0 0 14px 14px; z-index:10; }
.screen { height:620px; overflow-y:auto; padding:18px 12px 60px; &::-webkit-scrollbar{width:3px} &::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px} }
.brand { text-align:center; padding:8px 0 20px; }
.brand-img { height:48px; width:auto; display:block; margin:0 auto; cursor:pointer; }
.search { display:flex; align-items:center; padding:14px; background:#fff; border-radius:999px; box-shadow:0 4px 12px rgba(0,0,0,.05); margin-bottom:14px; font-size:14px; gap:7px; }
.search-txt { flex:1; font-size:13px; color:#aeaeb2; }
.cats { display:flex; justify-content:space-between; padding:4px 0 20px; }
.cat { display:flex; flex-direction:column; align-items:center; flex:1; }
.cat-b { width:46px; height:46px; border-radius:50%; background:#f5f5f7; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 12px rgba(0,0,0,.08); margin-bottom:7px; font-size:20px; }
.cat-l { font-size:11px; color:#636366; }
.tiles { display:flex; flex-direction:column; gap:8px; margin-bottom:16px; }
.t { display:flex; align-items:center; padding:12px 10px; background:#fff; border-radius:9px; box-shadow:0 2px 8px rgba(0,0,0,.03); }
.t-s { border:1px solid rgba(226,166,80,.35); background:linear-gradient(135deg,#fffbf0,#fff); position:relative; overflow:hidden; }
.t-s::before { content:''; position:absolute; top:-18px; right:-18px; width:70px; height:70px; border-radius:50%; background:rgba(226,166,80,.08); }
.t-i { width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-right:9px; flex-shrink:0; font-size:18px; }
.ti-s { background:linear-gradient(135deg,#f5a623,#f7c948); box-shadow:0 3px 7px rgba(226,166,80,.3); }
.ti-p { background:linear-gradient(135deg,#f0f0f0,#e8e8e8); box-shadow:0 2px 5px rgba(0,0,0,.06); }
.t-n { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
.t-tt { font-size:13px; font-weight:600; color:#1c1c1e; }
.t-st { font-size:10px; color:#8e8e93; }
.s-tt { font-weight:700; color:#b37400; }
.s-st { color:#a07820; }
.sh { display:flex; align-items:center; padding-bottom:10px; }
.sh-t { font-size:13px; font-weight:600; color:#1c1c1e; }
.hot { display:grid; grid-template-columns:1fr 1fr; gap:18px 7px; }
.h-c { cursor:pointer; }
.h-w { width:100%; border-radius:8px; overflow:hidden; background:#ececec; aspect-ratio:1.143; }
.h-cv { width:100%; height:100%; object-fit:cover; display:block; }
.h-ph { width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg,#f2f2f7,#e5e5ea); font-size:10px; color:#aeaeb2; }
.h-n { display:block; margin-top:5px; font-size:12px; font-weight:600; color:#1c1c1e; line-height:1.4; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden; }
.ft { text-align:center; font-size:10px; color:#c7c7cc; padding:16px 0 8px; }
</style>
