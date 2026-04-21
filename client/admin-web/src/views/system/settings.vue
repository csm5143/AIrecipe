<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">基础设置</h2>
    </div>
    <div class="card-container">
      <el-form label-width="120px" style="max-width: 600px">
        <el-form-item label="网站名称">
          <el-input v-model="settings.siteName" placeholder="AIRecipe" />
        </el-form-item>
        <el-form-item label="网站 Logo">
          <el-upload action="/api/v1/upload">
            <el-button>上传</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="版权信息">
          <el-input v-model="settings.copyright" placeholder="© 2024 AIRecipe" />
        </el-form-item>
        <el-form-item label="ICP 备案号">
          <el-input v-model="settings.icp" placeholder="京ICP备XXXXXXXX号" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave">保存设置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { ElMessage } from 'element-plus';

const settings = reactive({
  siteName: 'AIRecipe',
  copyright: '',
  icp: '',
});

function handleSave() {
  ElMessage.success('保存成功');
}
</script>
