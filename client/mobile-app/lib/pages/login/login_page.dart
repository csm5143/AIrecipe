import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../widgets/capsule_toast.dart';

/// 登录页
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  bool _obscure = true;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 60),
                Text('吃了么', style: Theme.of(context).textTheme.displayLarge),
                const SizedBox(height: 12),
                Text(
                  '探索风味世界，一口一味。',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 48),
                // 登录卡片
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: const Color(0xB8FFFFFF),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: const [
                      BoxShadow(color: Color(0x0A000000), blurRadius: 24),
                    ],
                    border: Border.all(color: const Color(0x0A000000)),
                  ),
                  child: Column(
                    children: [
                      TextField(
                        keyboardType: TextInputType.phone,
                        decoration: InputDecoration(
                          hintText: '手机号',
                          hintStyle: const TextStyle(
                            color: AppColors.textPlaceholder,
                          ),
                          prefixIcon: const Icon(
                            Icons.smartphone,
                            color: AppColors.textPlaceholder,
                            size: 20,
                          ),
                          filled: true,
                          fillColor: const Color(0x66FFFFFF),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                              color: Color(0x1A000000),
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                              color: Color(0x1A000000),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                              color: Color(0x1A000000),
                            ),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 16,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        obscureText: _obscure,
                        decoration: InputDecoration(
                          hintText: '密码',
                          hintStyle: const TextStyle(
                            color: AppColors.textPlaceholder,
                          ),
                          prefixIcon: const Icon(
                            Icons.lock_outline,
                            color: AppColors.textPlaceholder,
                            size: 20,
                          ),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscure
                                  ? Icons.visibility_off
                                  : Icons.visibility,
                              color: AppColors.textPlaceholder,
                              size: 20,
                            ),
                            onPressed: () =>
                                setState(() => _obscure = !_obscure),
                          ),
                          filled: true,
                          fillColor: const Color(0x66FFFFFF),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                              color: Color(0x1A000000),
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                              color: Color(0x1A000000),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                              color: Color(0x1A000000),
                            ),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 16,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          TextButton(
                            onPressed: () => showCapsuleToast(
                              context,
                              '验证码找回稍后接入',
                              icon: Icons.lock_reset,
                            ),
                            child: Text(
                              '忘记密码',
                              style: Theme.of(context).textTheme.labelMedium
                                  ?.copyWith(color: AppColors.textSecondary),
                            ),
                          ),
                          TextButton(
                            onPressed: () => showCapsuleToast(
                              context,
                              '注册流程稍后接入',
                              icon: Icons.person_add_alt,
                            ),
                            child: Text(
                              '立即注册',
                              style: Theme.of(context).textTheme.labelMedium,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: () => context.go('/'),
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.textPrimary,
                            foregroundColor: AppColors.surface,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('登录', style: TextStyle(fontSize: 15)),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward, size: 18),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                Row(
                  children: [
                    const Expanded(child: Divider(color: AppColors.divider)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        '或使用以下方式登录',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.textPlaceholder,
                        ),
                      ),
                    ),
                    const Expanded(child: Divider(color: AppColors.divider)),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _SocBtn(
                      icon: Icons.chat_bubble_outline,
                      onTap: () => showCapsuleToast(context, '微信登录稍后接入'),
                    ),
                    const SizedBox(width: 16),
                    _SocBtn(
                      icon: Icons.apple,
                      onTap: () => showCapsuleToast(context, 'Apple 登录稍后接入'),
                    ),
                  ],
                ),
                const SizedBox(height: 60),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SocBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _SocBtn({required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: const Color(0x80FFFFFF),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: const Color(0x0A000000)),
          boxShadow: const [
            BoxShadow(color: Color(0x0A000000), blurRadius: 24),
          ],
        ),
        child: Icon(icon, color: AppColors.textPrimary),
      ),
    );
  }
}
