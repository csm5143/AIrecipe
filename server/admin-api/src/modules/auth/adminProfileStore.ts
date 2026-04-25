import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_FILE = path.join(process.cwd(), 'data', 'admin.json');

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

const defaultAdmin: AdminProfile = {
  id: 1,
  username: 'admin',
  passwordHash: bcrypt.hashSync('admin123', 10),
  nickname: '管理员',
  phone: '',
  avatar: '',
  role: 'ADMIN',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadData(): AdminProfile {
  try {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultAdmin, null, 2), 'utf-8');
      return { ...defaultAdmin };
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const loaded = JSON.parse(raw) as AdminProfile;
    return { ...defaultAdmin, ...loaded };
  } catch {
    return { ...defaultAdmin };
  }
}

function saveData(admin: AdminProfile) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(admin, null, 2), 'utf-8');
}

class AdminProfileStore {
  private admin: AdminProfile;

  constructor() {
    this.admin = loadData();
  }

  get(): AdminProfile {
    const { passwordHash: _, ...safe } = this.admin;
    return safe;
  }

  update(data: Partial<Pick<AdminProfile, 'nickname' | 'phone' | 'avatar'>>) {
    this.admin = {
      ...this.admin,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveData(this.admin);
    const { passwordHash: _, ...safe } = this.admin;
    return safe;
  }

  verifyPassword(password: string): boolean {
    return bcrypt.compareSync(password, this.admin.passwordHash);
  }

  changePassword(newPasswordHash: string) {
    this.admin = {
      ...this.admin,
      passwordHash: newPasswordHash,
      updatedAt: new Date().toISOString(),
    };
    saveData(this.admin);
  }

  getByUsername(): AdminProfile | null {
    return this.admin;
  }
}

export const adminProfileStore = new AdminProfileStore();
