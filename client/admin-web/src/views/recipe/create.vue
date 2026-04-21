<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">创建食谱</h2>
    </div>
    <div class="card-container">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入食谱标题" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="封面图">
          <el-upload
            action="/api/v1/upload"
            :headers="{ Authorization: `Bearer ${token}` }"
            list-type="picture-card"
            :limit="1"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类">
            <el-option label="早餐" value="breakfast" />
            <el-option label="午餐" value="lunch" />
            <el-option label="晚餐" value="dinner" />
            <el-option label="甜点" value="dessert" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-radio-group v-model="form.difficulty">
            <el-radio label="EASY">简单</el-radio>
            <el-radio label="MEDIUM">中等</el-radio>
            <el-radio label="HARD">困难</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="烹饪时间">
          <el-input-number v-model="form.cookingTime" :min="1" /> 分钟
        </el-form-item>
        <el-form-item label="食材">
          <el-input v-model="form.ingredientsText" type="textarea" :rows="4" placeholder="每行一个食材，格式：食材名 - 用量" />
        </el-form-item>
        <el-form-item label="步骤">
          <el-input v-model="form.stepsText" type="textarea" :rows="6" placeholder="每行一个步骤" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="DRAFT">草稿</el-radio>
            <el-radio label="PUBLISHED">立即发布</el-radio>
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
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const formRef = ref();
const token = localStorage.getItem('token') || '';

const form = reactive({
  title: '',
  coverImage: '',
  category: '',
  difficulty: 'MEDIUM',
  cookingTime: 30,
  ingredientsText: '',
  stepsText: '',
  status: 'DRAFT',
});

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
};

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  ElMessage.success('创建成功');
  router.push('/recipes');
}
</script>
