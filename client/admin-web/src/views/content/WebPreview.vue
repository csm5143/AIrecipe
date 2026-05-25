<template>
  <div class="browser"><div class="bbar"><span class="bd r"></span><span class="bd y"></span><span class="bd g"></span><span class="burl">airecipe.com</span></div>
    <div class="page">
      <!-- Nav -->
      <div class="nav"><span class="nav-logo" @click="$emit('select','web-logo',{imageUrl:webLogo,title:'网站Logo'})">🍳</span><span class="nav-brand">AIrecipe</span><span class="nav-l">首页</span><span class="nav-l">功能</span><span class="nav-l">下载</span><span class="nav-cta">立即体验</span></div>
      <!-- Hero -->
      <div class="hero">
        <div class="h-copy"><span class="kicker">✨ AI 智能菜谱</span><h1 class="h-title">让冰箱里的食材，<br />先变成灵感。</h1><p class="h-desc">拍一下识别食材，AI 生成今日菜谱，同步营养数据。</p>
          <div class="h-stats"><div v-for="s in stats" :key="s.label"><strong>{{ s.v }}</strong><span>{{ s.label }}</span></div></div>
        </div>
        <div class="h-visual"><div class="h-phone">
          <div class="hp-top"><span>今晚开饭啦</span><span class="hp-tag">拍照识材</span></div>
          <div class="hp-img" @click="$emit('select','web-hero',{imageUrl:webHero,title:'Hero展示图'})"><img v-if="webHero" :src="webHero" /><div v-else class="hp-img-empty">Hero 待配置</div></div>
          <div class="hp-cards"><div class="hpc dark"><span class="hpck">今日推荐</span><span class="hpct">番茄滑蛋饭</span><span class="hpcd">3种食材·15分钟</span></div><div class="hpc light"><div class="pills"><span>蛋白72%</span><span>碳水58%</span></div></div></div>
        </div></div>
      </div>
      <!-- Features Bento -->
      <div class="sec"><span class="kicker">核心功能</span><h2 class="st">每一餐的灵感，从识别食材开始。</h2></div>
      <div class="bento">
        <div class="b b-lg"><div class="bi mint">📸</div><h3>拍照识材</h3><p>对准冰箱快速识别食材种类和可用搭配</p></div>
        <div class="b b-tl"><div class="bi peach">🍳</div><h3>AI菜谱生成</h3><p>按口味和时间生成菜谱，步骤清晰</p></div>
        <div class="b b-wd"><div class="bi cream">📊</div><h3>营养追踪</h3><p>蛋白质、碳水、脂肪一眼扫完</p></div>
        <div class="b b-sm"><div class="bi mint">🔄</div><h3>收藏同步</h3><p>小程序和APP共用一个账号</p></div>
      </div>
      <!-- Footer -->
      <div class="ft"><span>© 2026 AIrecipe · AI 智能菜谱</span></div>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{ webHero?: string; webLogo?: string; webRecipes?: any[] }>();
defineEmits<{ select: [t:string, d:any] }>();
const stats = [{v:'10K+',label:'精品菜谱'},{v:'50K+',label:'灵感生成'},{v:'4.8',label:'体验评分'}];
</script>
<style scoped>
.browser { width:520px; margin:0 auto; border:3px solid #ddd; border-radius:8px; overflow:hidden; background:#fbf4e6; }
.bbar { display:flex; align-items:center; gap:6px; padding:6px 10px; background:#e8e8e8; border-bottom:1px solid #ddd; }
.bd { width:10px; height:10px; border-radius:50%; } .r { background:#ff5f57; } .y { background:#febc2e; } .g { background:#28c840; }
.burl { font-size:10px; color:#999; margin-left:10px; }
.page { max-height:500px; overflow-y:auto; &::-webkit-scrollbar{width:4px} &::-webkit-scrollbar-thumb{background:#ddd} }
.nav { display:flex; align-items:center; gap:14px; padding:10px 20px; background:rgba(255,255,255,.7); backdrop-filter:blur(8px); border-bottom:1px solid #eee; position:sticky; top:0; z-index:5; }
.nav-logo { font-size:20px; cursor:pointer; } .nav-brand { font-size:14px; font-weight:800; color:#1b261f; margin-right:10px; }
.nav-l { font-size:11px; color:#666; font-weight:600; } .nav-cta { margin-left:auto; background:#1b261f; color:#fff; padding:3px 10px; border-radius:10px; font-size:10px; font-weight:700; }
.hero { display:grid; grid-template-columns:1fr 1fr; gap:20px; padding:28px 20px; }
.h-copy { display:flex; flex-direction:column; gap:10px; }
.kicker { font-size:10px; font-weight:700; color:#c7862d; display:inline-flex; align-items:center; gap:4px; }
.h-title { font-size:24px; font-weight:900; line-height:1.1; color:#1b261f; margin:0; }
.h-desc { font-size:11px; color:#666; line-height:1.6; margin:0; }
.h-stats { display:flex; gap:16px; padding-top:12px; border-top:1px solid #eee; }
.h-stats div { display:flex; flex-direction:column; gap:2px; }
.h-stats strong { font-size:18px; font-weight:900; color:#1b261f; } .h-stats span { font-size:10px; color:#999; font-weight:600; }
.h-visual { perspective:800px; }
.h-phone { background:#fff; border-radius:12px; padding:12px; box-shadow:0 4px 20px rgba(0,0,0,.08); }
.hp-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:10px; font-weight:700; } .hp-tag { color:#999; }
.hp-img { border-radius:6px; overflow:hidden; margin-bottom:8px; cursor:pointer; } .hp-img img { width:100%; display:block; }
.hp-img-empty { height:80px; background:#eee; display:flex; align-items:center; justify-content:center; font-size:10px; color:#aaa; }
.hp-cards { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.hpc { padding:8px; border-radius:6px; font-size:9px; } .dark { background:#1b261f; color:#fff; } .light { background:#f8f8f8; }
.hpck { display:block; font-size:7px; opacity:.6; } .hpct { font-weight:700; } .hpcd { font-size:8px; opacity:.7; }
.pills { display:flex; gap:4px; } .pills span { padding:2px 6px; border-radius:10px; font-size:8px; font-weight:700; background:#fff0cf; color:#1b261f; }
.sec { padding:16px 20px 8px; } .st { font-size:20px; font-weight:900; color:#1b261f; margin:4px 0 0; }
.bento { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; padding:8px 20px 20px; }
.b { padding:14px; border-radius:10px; background:#fff; } .b-lg { grid-column:span 3; } .b-tl { grid-column:span 3; } .b-wd { grid-column:span 4; } .b-sm { grid-column:span 2; }
.bi { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:18px; margin-bottom:8px; } .mint { background:rgba(121,215,185,.2); } .peach { background:rgba(255,122,89,.15); } .cream { background:rgba(255,197,116,.2); }
.b h3 { font-size:13px; font-weight:800; margin:0 0 4px; } .b p { font-size:10px; color:#666; margin:0; line-height:1.5; }
.ft { text-align:center; padding:12px; font-size:10px; color:#bbb; border-top:1px solid #eee; }
</style>
