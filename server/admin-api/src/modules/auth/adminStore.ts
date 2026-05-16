import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';

const DATA_FILE = path.join(process.cwd(), 'data', 'admin.json');

interface StoredAdmin {
  id: number;
  username: string;
  passwordHash: string;
  nickname: string;
  phone: string;
  avatar: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}

function loadStoredAdmin(): StoredAdmin | null {
  try {
    if (!fs.existsSync(DATA_FILE)) return null;
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as StoredAdmin;
  } catch {
    return null;
  }
}

/**
 * 当 PostgreSQL admins 表为空时，自动从 data/admin.json 迁移数据过来
 */
export async function seedAdminFromJsonStore(): Promise<void> {
  const count = await prisma.admin.count();
  if (count > 0) {
    // DB 已有数据时，修正 admin.json 里定义的账号角色为 SUPER_ADMIN
    const stored = loadStoredAdmin();
    if (stored) {
      await prisma.admin.updateMany({
        where: { username: stored.username },
        data: { role: 'SUPER_ADMIN' as any },
      });
    }
    return;
  }

  const stored = loadStoredAdmin();
  if (!stored) return;

  try {
    await prisma.admin.create({
      data: {
        id: stored.id,
        username: stored.username,
        password: stored.passwordHash,
        nickname: stored.nickname,
        avatar: stored.avatar || '',
        role: stored.role as any,
        status: stored.status as any,
        isDeleted: false,
      },
    });
    console.log('[AdminSeed] 管理员数据已从 data/admin.json 迁移到数据库');
  } catch (err: any) {
    // 忽略唯一索引冲突等错误（说明已有数据）
    if (err?.code !== 'P2002') {
      console.error('[AdminSeed] 迁移失败:', err?.message);
    }
  }
}

/**
 * 验证密码（支持 JSON store 中的 hash）
 */
export function verifyPasswordFromHash(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
