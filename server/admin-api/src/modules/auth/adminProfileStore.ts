import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';

export interface AdminProfile {
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

/**
 * 管理员个人资料数据访问层（PostgreSQL）
 * 移除了 JSON 文件读写，以数据库为唯一数据源
 */
class AdminProfileStore {
  private mapToProfile(admin: {
    id: number;
    username: string;
    password: string;
    nickname: string | null;
    phone: string | null;
    avatar: string | null;
    role: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): AdminProfile {
    return {
      id: admin.id,
      username: admin.username,
      passwordHash: admin.password,
      nickname: admin.nickname ?? '',
      phone: admin.phone ?? '',
      avatar: admin.avatar ?? '',
      role: admin.role as AdminProfile['role'],
      status: admin.status as AdminProfile['status'],
      createdAt: admin.createdAt.toISOString(),
      updatedAt: admin.updatedAt.toISOString(),
    };
  }

  /**
   * 按 username 查找管理员（返回包含 passwordHash 的完整对象）
   */
  async getByUsername(): Promise<AdminProfile | null> {
    const admin = await prisma.admin.findFirst({ where: { isDeleted: false } });
    if (!admin) return null;
    return this.mapToProfile(admin);
  }

  /**
   * 获取管理员资料（不包含 passwordHash）
   */
  async get(): Promise<Omit<AdminProfile, 'passwordHash'>> {
    const admin = await prisma.admin.findFirst({ where: { isDeleted: false } });
    if (!admin) return null as any;
    const { passwordHash: _, ...safe } = this.mapToProfile(admin);
    return safe;
  }

  /**
   * 更新管理员资料（昵称、手机号、头像）
   */
  async update(data: Partial<Pick<AdminProfile, 'nickname' | 'phone' | 'avatar'>>) {
    const admin = await this.getByUsername();
    if (!admin) throw new Error('管理员未找到');

    const updated = await prisma.admin.update({
      where: { id: admin.id },
      data,
    });

    const { passwordHash: _, ...safe } = this.mapToProfile(updated);
    return safe;
  }

  /**
   * 验证密码
   */
  async verifyPassword(password: string): Promise<boolean> {
    const admin = await this.getByUsername();
    if (!admin) return false;
    return bcrypt.compare(password, admin.passwordHash);
  }

  /**
   * 修改密码
   */
  async changePassword(newPasswordHash: string) {
    const admin = await this.getByUsername();
    if (!admin) throw new Error('管理员未找到');

    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: newPasswordHash },
    });
  }
}

export const adminProfileStore = new AdminProfileStore();
