type SmsCodeType = 'register' | 'resetPassword' | 'bind' | 'adminReset' | string;

export async function sendSms(phone: string, code: string, type: SmsCodeType): Promise<boolean> {
  console.log(`[SmsService] ${type} 验证码 → ${phone}: ${code}`);
  return true;
}
