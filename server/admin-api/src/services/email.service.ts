import dns from 'dns';
import { promisify } from 'util';
import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';

const dnsLookup = promisify(dns.lookup);

// 强制使用公共 DNS 绕过本地 DNS 劫持
dns.setServers(['8.8.8.8', '114.114.114.114']);

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

async function getEmailConfig(): Promise<EmailConfig | null> {
  const settings = await prisma.systemSetting.findMany({
    where: { category: 'email' },
  });

  const get = (key: string) =>
    settings.find(s => s.key === key)?.value || '';

  const host = get('smtpHost');
  if (!host) return null;

  const port = parseInt(get('smtpPort')) || 465;
  const encryption = get('encryption');

  return {
    host,
    port,
    secure: encryption === 'ssl',
    user: get('username'),
    password: get('password'),
    fromEmail: get('fromEmail') || get('username'),
    fromName: get('fromName') || 'AIrecipe',
  };
}

export async function sendEmail(to: string, subject: string, html: string, type = 'GENERAL'): Promise<boolean> {
  const config = await getEmailConfig();
  if (!config) {
    console.error('[EmailService] 邮件配置未设置');
    await writeEmailLog(to, subject, type, 'failed', '邮件配置未设置');
    return false;
  }

  try {
    // 先用 dns.lookup 手动解析得到真实 IP，避免系统 DNS 劫持
    const { address: resolvedIp } = await dnsLookup(config.host, { family: 4 });
    console.log(`[EmailService] DNS resolved: ${config.host} → ${resolvedIp}`);

    const transporter = nodemailer.createTransport({
      host: resolvedIp,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
      tls: {
        // SNI 用真实域名，TLS 证书校验不受影响
        servername: config.host,
      },
    });

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`[EmailService] 邮件已发送 → ${to}: ${subject}`);
    await writeEmailLog(to, subject, type, 'sent');
    return true;
  } catch (error: any) {
    console.error(`[EmailService] 发送失败 → ${to}:`, error.message);
    await writeEmailLog(to, subject, type, 'failed', error.message);
    return false;
  }
}

async function writeEmailLog(
  toEmail: string,
  subject: string,
  type: string,
  status: 'sent' | 'failed',
  error?: string,
) {
  try {
    await prisma.emailLog.create({
      data: { toEmail, subject, type, status, error },
    });
  } catch (logError) {
    console.error('[EmailService] 邮件日志写入失败:', logError);
  }
}

function codeTemplate(title: string, code: string, desc: string) {
  return `<div style="font-family:Arial,'Microsoft YaHei',sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #eee;border-radius:12px;background:#fff">
    <h2 style="margin:0 0 12px;color:#1C1C1E">${title}</h2>
    <p style="color:#555;line-height:1.7">${desc}</p>
    <div style="font-size:32px;letter-spacing:8px;font-weight:700;color:#F54E00;background:#FFF4ED;padding:18px 24px;border-radius:10px;text-align:center;margin:24px 0">${code}</div>
    <p style="color:#888;font-size:13px">验证码 5 分钟内有效，请勿转发给他人。</p>
  </div>`;
}

function fireAndForget(promise: Promise<boolean>) {
  promise.catch(error => console.error('[EmailService] fire-and-forget failed:', error));
}

export function sendRegisterCode(email: string, code: string): void {
  fireAndForget(sendEmail(email, 'AIrecipe 注册验证码', codeTemplate('注册验证码', code, '你正在注册 AIrecipe 账号。'), 'REGISTER'));
}

export function sendResetPasswordCode(email: string, code: string): void {
  fireAndForget(sendEmail(email, 'AIrecipe 密码重置验证码', codeTemplate('密码重置验证码', code, '你正在重置 AIrecipe 登录密码。'), 'RESETPASSWORD'));
}

export function sendBindEmailCode(email: string, code: string): void {
  fireAndForget(sendEmail(email, 'AIrecipe 邮箱绑定验证码', codeTemplate('邮箱绑定验证码', code, '你正在绑定 AIrecipe 登录邮箱。'), 'BIND'));
}

export function sendRecipeAuditResult(email: string, title: string, approved: boolean, reason?: string): void {
  const subject = approved ? '你的菜谱已通过审核' : '你的菜谱未通过审核';
  const html = `<div style="font-family:Arial,'Microsoft YaHei',sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #eee;border-radius:12px">
    <h2 style="color:#1C1C1E">${subject}</h2>
    <p>菜谱「${title}」${approved ? '已通过审核，现在所有人可见。' : '未通过审核。'}</p>
    ${reason ? `<p style="color:#C0392B">原因：${reason}</p>` : ''}
  </div>`;
  fireAndForget(sendEmail(email, subject, html, 'RECIPE_AUDIT'));
}

export function sendSecurityAlert(email: string, alertType: string, detail: string): void {
  const html = `<div style="font-family:Arial,'Microsoft YaHei',sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #eee;border-radius:12px">
    <h2 style="color:#1C1C1E">安全告警：${alertType}</h2>
    <p>${detail}</p>
  </div>`;
  fireAndForget(sendEmail(email, `AIrecipe 安全告警：${alertType}`, html, 'SECURITY_ALERT'));
}

export function sendAdminCreated(email: string, username: string): void {
  const html = `<div style="font-family:Arial,'Microsoft YaHei',sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #eee;border-radius:12px">
    <h2 style="color:#1C1C1E">管理员账号已创建</h2>
    <p>你的 AIrecipe 后台管理员账号「${username}」已创建，请尽快登录并修改初始密码。</p>
  </div>`;
  fireAndForget(sendEmail(email, 'AIrecipe 管理员账号已创建', html, 'ADMIN_CREATED'));
}

export async function sendTestEmail(to: string): Promise<boolean> {
  return sendEmail(
    to,
    'AIrecipe 邮件服务测试',
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px">
      <h2 style="color:#1C1C1E">小厨子 · AIrecipe</h2>
      <p>邮件服务配置成功！</p>
      <p style="color:#6E6E73;font-size:13px">如果你收到这封邮件，说明 SMTP 配置正确，后续审核通知、密码重置等邮件将正常发送。</p>
    </div>`,
    'TEST',
  );
}
