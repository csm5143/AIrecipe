#!/usr/bin/env node
/**
 * AIRecipe 一键部署脚本
 * 支持 Docker 部署和本地部署
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const DEPLOY_TARGET = process.argv[2] || 'docker';
const ENV = process.argv[3] || 'production';

function log(msg) {
  console.log(`[Deploy] ${msg}`);
}

function run(cmd, options = {}) {
  log(`执行: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...options });
}

async function deployDocker() {
  log('使用 Docker 方式部署...');

  if (!fs.existsSync(path.join(ROOT, '.env'))) {
    log('复制环境变量文件...');
    fs.copyFileSync(path.join(ROOT, '.env.example'), path.join(ROOT, '.env'));
  }

  log('拉取最新代码...');
  run('git pull');

  log('构建 Docker 镜像...');
  run(`docker-compose build`);

  log('启动服务...');
  run('docker-compose up -d');

  log('部署完成!');
}

async function deployLocal() {
  log('使用本地方式部署...');
  log('安装依赖...');
  run('pnpm install');

  log('构建后台 API...');
  run('pnpm --filter @airecipe/admin-api build');

  log('构建后台管理 Web...');
  run('pnpm --filter @airecipe/admin-web build');

  log('部署完成!');
}

async function main() {
  log(`部署目标: ${DEPLOY_TARGET}, 环境: ${ENV}`);
  if (DEPLOY_TARGET === 'docker') {
    await deployDocker();
  } else {
    await deployLocal();
  }
}

main().catch(console.error);
