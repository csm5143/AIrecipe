/**
 * 测试 COS 上传功能
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// 创建一个简单的测试图片（1x1 红色 PNG）
function createTestImage() {
  // PNG 文件头 + IHDR + IDAT + IEND (最小有效 PNG)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // width=1, height=1
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, etc
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0xFF, // compressed data
    0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
    0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
    0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  return pngData;
}

async function testUpload() {
  const API_BASE = 'http://localhost:3000/api/v1';
  
  // 1. 先登录获取 token
  console.log('1. 登录获取 token...');
  try {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    const token = loginRes.data?.data?.token;
    if (!token) {
      console.log('登录失败或未返回 token:', loginRes.data);
      return;
    }
    console.log('✅ 登录成功');
    
    // 2. 测试上传
    console.log('\n2. 测试文件上传到 COS...');
    const formData = new FormData();
    const testImage = createTestImage();
    formData.append('file', testImage, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    formData.append('folder', 'tmp');
    
    const uploadRes = await axios.post(`${API_BASE}/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`
      },
      timeout: 30000
    });
    
    console.log('\n📤 上传响应:', JSON.stringify(uploadRes.data, null, 2));
    
    if (uploadRes.data?.code === 200 && uploadRes.data?.data?.url) {
      console.log('\n✅ 上传成功！');
      console.log('📎 文件 URL:', uploadRes.data.data.url);
      console.log('📁 存储类型:', uploadRes.data.data.storage);
      console.log('🔑 COS Key:', uploadRes.data.data.key);
    } else {
      console.log('\n❌ 上传失败:', uploadRes.data?.message || '未知错误');
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testUpload();
