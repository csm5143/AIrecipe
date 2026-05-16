/**
 * 调试脚本：直接测试食材列表 API
 * 运行方式: node test-api.js
 */
const http = require('http');

// 先登录获取 token
function postJson(host, port, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ hostname: host, port, path, method: 'POST', headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    }}, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { resolve(raw); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(host, port, path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: host, port, path: path + '&token=' + token, method: 'GET', headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    }}, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { resolve(raw); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const host = 'localhost';
  const port = 3000;

  try {
    // 1. 登录
    console.log('1. 登录...');
    const loginRes = await postJson(host, port, '/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log('登录结果:', JSON.stringify(loginRes, null, 2));

    if (loginRes.code !== 200 || !loginRes.data?.token) {
      console.log('登录失败，尝试其他账号...');
    }

    const token = loginRes.data?.token;
    if (!token) {
      console.log('无法获取 token，请检查登录接口');
      return;
    }

    // 2. 测试食材列表
    console.log('\n2. 测试食材列表 API...');
    const ingredientsRes = await getJson(host, port, '/v1/ingredients?page=1&pageSize=5&token=', token);
    console.log('食材列表响应:', JSON.stringify(ingredientsRes, null, 2));

    // 3. 检查数据库记录数
    console.log('\n3. 检查数据...');
    console.log('响应中 data.list 长度:', ingredientsRes?.data?.list?.length);
    console.log('响应中 data.total:', ingredientsRes?.data?.total);

  } catch (e) {
    console.error('请求失败:', e.message);
    console.error('请确保后端服务正在运行于 http://localhost:3000');
  }
}

main();
