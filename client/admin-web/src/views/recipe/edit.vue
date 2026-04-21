<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">编辑食谱</h2>
    </div>
    <div class="card-container">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入食谱标题" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类">
            <el-option label="早餐" value="breakfast" />
            <el-option label="午餐" value="lunch" />
            <el-option label="晚餐" value="dinner" />
            <el-option label="甜点" value="dessert" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="DRAFT">草稿</el-radio>
            <el-radio label="PUBLISHED">已发布</el-radio>
            <el-radio label="OFFLINE">已下线</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
          <el-button @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();
const formRef = ref();

const form = reactive({
  title: '',
  category: '',
  status: 'DRAFT',
});

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
};

onMounted(() => {
  // TODO: 加载食谱详情
});

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  ElMessage.success('保存成功');
  router.push('/recipes');
}
</script>
