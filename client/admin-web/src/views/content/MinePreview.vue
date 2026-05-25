<template>
  <div class="phone"><div class="notch"></div>
    <div class="screen">
      <div class="usr">
        <div class="avt"></div>
        <div class="u-n"><div class="un">用户昵称</div><div class="ut">查看个人资料</div></div>
        <span class="ua">›</span>
      </div>
      <div class="mn">
        <div class="mi" v-for="m in menu" :key="m.n" :class="{clickable: m.editable}" @click="m.editable && $emit('select','about',{title:m.n, content:aboutContent})">
          <span class="mic">{{ m.e }}</span><span class="mit">{{ m.n }}</span><span class="mia">›</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{ aboutContent?: string }>();
defineEmits<{ select: [t: string, d: any] }>();
const menu = [
  {n:'小冰箱',e:'🧊',editable:false},{n:'小菜篮',e:'🧺',editable:false},{n:'我的收藏',e:'⭐',editable:false},
  {n:'饮食偏好',e:'🍽',editable:false},{n:'问题反馈',e:'💬',editable:false},{n:'关于我们',e:'ℹ',editable:true},
];
</script>
<style scoped>
.phone { width:340px; margin:0 auto; border:4px solid #1a1a1a; border-radius:32px; overflow:hidden; background:#f5f5f7; position:relative; }
.notch { position:absolute; top:0; left:50%; transform:translateX(-50%); width:80px; height:18px; background:#1a1a1a; border-radius:0 0 14px 14px; z-index:10; }
.screen { height:620px; overflow-y:auto; padding:18px 14px 60px; &::-webkit-scrollbar{width:3px} &::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px} }
.usr { display:flex; align-items:center; background:#fffdf8; border-radius:12px; padding:16px 14px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,.04); }
.avt { width:44px; height:44px; border-radius:50%; border:2px solid #e2a650; background:#eee; flex-shrink:0; margin-right:12px; }
.u-n { flex:1; } .un { font-size:14px; font-weight:600; color:#2d241b; } .ut { font-size:11px; color:#7a6a58; margin-top:2px; } .ua { font-size:20px; color:#ccc; }
.mn { background:#fffdf8; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.04); }
.mi { display:flex; align-items:center; padding:14px 14px; border-bottom:1px solid #f0f0f5; }
.mi:last-child { border-bottom:none; }
.clickable { cursor:pointer; } .clickable:hover { background:rgba(226,165,80,.06); }
.mic { font-size:18px; margin-right:10px; } .mit { flex:1; font-size:13px; color:#333; } .mia { font-size:18px; color:#ccc; }
</style>
