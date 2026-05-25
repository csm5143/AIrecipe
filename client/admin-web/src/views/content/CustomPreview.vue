<template>
  <div class="phone"><div class="notch"></div>
    <div class="screen">
      <div class="hd"><div class="t">定制我的餐食</div><div class="st">选择适合你的美食方案</div></div>
      <div class="bk"><div class="bk-l"><span class="bk-i">🧺</span></div><div class="bk-b"><div class="bk-t">小菜篮</div><div class="bk-d">{{ cards.length || 0 }} 个卡片</div></div><span class="bk-a">›</span></div>
      <div class="s"><div class="s-t">发现菜谱</div>
        <div class="cs"><div class="ct">
          <div v-for="c in cards" :key="c.id" class="cw" @click="$emit('select','card',c)"><div class="cd">
            <img v-if="c.imageUrl" :src="c.imageUrl" class="cc" /><div v-else class="ce">暂无封面</div>
            <div class="ctg"><span class="ctn">{{ c.title }}</span></div>
            <div class="cf"><span class="cfd">{{ c.subtitle || c.title }}</span></div>
          </div></div>
        </div></div>
      </div>
      <div class="s"><div class="s-t">健身减脂餐</div>
        <div class="fb" @click="$emit('select','fitness',{imageUrl:fitnessImage})"><img :src="fitnessImage" class="fbg" /><div class="fl"></div>
          <div class="ftx"><div class="ftt">健身减脂餐定制</div><div class="fts">高蛋白低卡 · 适配食材 · 轻松吃瘦</div></div>
          <div class="fbt"><span>点击定制</span><span class="fa">→</span></div>
        </div>
      </div>
      <div class="s"><div class="s-t">儿童营养餐</div>
        <div class="kb" @click="$emit('select','kids',{imageUrl:kidsImage})"><img :src="kidsImage" class="kbg" />
          <div class="ktx"><div class="ktt">儿童营养餐定制</div><div class="kts">营养均衡 · 宝宝爱吃 · 家常易做</div></div>
          <div class="kst">★</div><div class="kbt"><span>点击定制</span><span class="ka">→</span></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{ cards: any[]; fitnessImage?: string; kidsImage?: string }>();
defineEmits<{ select: [t: string, d: any] }>();
</script>
<style scoped>
.phone { width:340px; margin:0 auto; border:4px solid #1a1a1a; border-radius:32px; overflow:hidden; background:#f5f5f7; position:relative; }
.notch { position:absolute; top:0; left:50%; transform:translateX(-50%); width:80px; height:18px; background:#1a1a1a; border-radius:0 0 14px 14px; z-index:10; }
.screen { height:620px; overflow-y:auto; padding:18px 14px 60px; &::-webkit-scrollbar{width:3px} &::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px} }
.hd { padding:18px 0 14px; } .t { font-size:20px; font-weight:800; color:#111; margin-bottom:4px; } .st { font-size:12px; color:#8e8e93; }
.bk { display:flex; align-items:center; background:#fffdf8; border-radius:10px; padding:12px 10px; margin-bottom:18px; box-shadow:0 2px 7px rgba(0,0,0,.04); }
.bk-l { margin-right:9px; } .bk-i { font-size:36px; } .bk-b { flex:1; } .bk-t { font-size:14px; font-weight:700; color:#111; } .bk-d { font-size:11px; color:#8e8e93; } .bk-a { font-size:20px; color:#d1d1d6; }
.s { margin-bottom:6px; } .s-t { font-size:14px; font-weight:700; color:#111; margin-bottom:10px; }
.cs { overflow-x:auto; &::-webkit-scrollbar{height:2px} } .ct { display:inline-flex; gap:9px; padding-bottom:4px; }
.cw { width:125px; flex-shrink:0; cursor:pointer; } .cd { height:167px; border-radius:5px; overflow:hidden; background:#fff; box-shadow:0 3px 10px rgba(0,0,0,.06); position:relative; }
.cd:hover { box-shadow:0 4px 14px rgba(226,166,80,.2); } .cc { width:100%; height:135px; object-fit:cover; display:block; }
.ce { width:100%; height:135px; background:#eee; display:flex; align-items:center; justify-content:center; font-size:10px; color:#aaa; }
.ctg { position:absolute; left:6px; top:6px; } .ctn { font-size:12px; color:#fff; font-weight:600; text-shadow:0 1px 4px rgba(0,0,0,.4); }
.cf { height:32px; display:flex; align-items:center; justify-content:center; background:rgba(40,40,45,.8); } .cfd { font-size:12px; color:#fff; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.fb { position:relative; height:137px; border-radius:7px; overflow:hidden; margin:10px 0 8px; box-shadow:0 3px 14px rgba(90,160,120,.12); cursor:pointer; }
.fbg { position:absolute; left:-5%; top:-5%; width:110%; height:110%; object-fit:cover; } .fl { position:absolute; inset:0; background:rgba(255,255,255,.25); }
.ftx { position:absolute; left:0; right:0; top:50%; transform:translateY(-60%); text-align:center; padding:0 17px; } .ftt { font-size:19px; font-weight:800; color:#fff; text-shadow:0 2px 7px rgba(0,0,0,.35); margin-bottom:7px; } .fts { font-size:11px; color:rgba(255,255,255,.95); } .fbt { position:absolute; right:12px; bottom:12px; display:flex; align-items:center; background:rgba(255,255,255,.9); padding:5px 9px; border-radius:13px; font-size:10px; color:#5a9e78; font-weight:600; } .fa { margin-left:3px; font-weight:700; }
.kb { position:relative; height:146px; border-radius:7px; overflow:hidden; margin:10px 0 8px; box-shadow:0 3px 14px rgba(200,160,120,.16); cursor:pointer; }
.kbg { position:absolute; left:-5%; top:-5%; width:110%; height:110%; object-fit:cover; } .ktx { position:absolute; left:0; right:0; top:50%; transform:translateY(-50%); text-align:center; padding:0 17px; } .ktt { font-size:19px; font-weight:700; color:#fff; text-shadow:0 2px 7px rgba(139,90,43,.5); margin-bottom:7px; } .kts { font-size:11px; color:rgba(255,248,235,.95); } .kst { position:absolute; top:9px; right:10px; font-size:15px; color:#fff7d6; opacity:.7; } .kbt { position:absolute; right:12px; bottom:12px; display:flex; align-items:center; background:rgba(255,248,235,.92); padding:5px 9px; border-radius:13px; font-size:10px; color:#c4875a; font-weight:600; } .ka { margin-left:3px; font-weight:700; }
</style>
