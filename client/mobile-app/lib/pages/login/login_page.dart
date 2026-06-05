import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/capsule_toast.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _nicknameCtrl = TextEditingController();
  bool _obscure = true;
  bool _isRegisterMode = false;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _nicknameCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final phone = _phoneCtrl.text.trim();
    final password = _passwordCtrl.text;
    final nickname = _nicknameCtrl.text.trim();

    if (phone.isEmpty || password.isEmpty) {
      showCapsuleToast(context, '请输入手机号和密码', icon: Icons.info_outline);
      return;
    }

    if (password.length < 6) {
      showCapsuleToast(context, '密码至少 6 位', icon: Icons.lock_outline);
      return;
    }

    try {
      final auth = ref.read(authControllerProvider.notifier);
      if (_isRegisterMode) {
        await auth.register(phone, password, nickname);
      } else {
        await auth.login(phone, password);
      }
      if (mounted) context.go('/mine');
    } catch (_) {
      final message =
          ref.read(authControllerProvider).error?.message ?? '操作失败，请稍后再试';
      if (mounted) {
        showCapsuleToast(context, message, icon: Icons.error_outline);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);

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
                Text('小厨子', style: Theme.of(context).textTheme.displayLarge),
                const SizedBox(height: 12),
                Text(
                  '登录后同步收藏、冰箱和个人资料',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 48),
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
                      if (_isRegisterMode) ...[
                        _LoginField(
                          controller: _nicknameCtrl,
                          hintText: '昵称（可选）',
                          icon: Icons.person_outline,
                        ),
                        const SizedBox(height: 16),
                      ],
                      _LoginField(
                        controller: _phoneCtrl,
                        hintText: '手机号',
                        icon: Icons.smartphone,
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 16),
                      _LoginField(
                        controller: _passwordCtrl,
                        hintText: '密码',
                        icon: Icons.lock_outline,
                        obscureText: _obscure,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscure ? Icons.visibility_off : Icons.visibility,
                            color: AppColors.textPlaceholder,
                            size: 20,
                          ),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          TextButton(
                            onPressed: auth.isLoading
                                ? null
                                : () => showCapsuleToast(
                                    context,
                                    '密码找回接口稍后接入',
                                    icon: Icons.lock_reset,
                                  ),
                            child: Text(
                              '忘记密码',
                              style: Theme.of(context).textTheme.labelMedium
                                  ?.copyWith(color: AppColors.textSecondary),
                            ),
                          ),
                          TextButton(
                            onPressed: auth.isLoading
                                ? null
                                : () => setState(
                                    () => _isRegisterMode = !_isRegisterMode,
                                  ),
                            child: Text(
                              _isRegisterMode ? '返回登录' : '立即注册',
                              style: Theme.of(context).textTheme.labelMedium,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: auth.isLoading ? null : _submit,
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.textPrimary,
                            foregroundColor: AppColors.surface,
                            disabledBackgroundColor: AppColors.textPrimary
                                .withAlpha(120),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: auth.isLoading
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppColors.surface,
                                  ),
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      _isRegisterMode ? '注册并登录' : '登录',
                                      style: const TextStyle(fontSize: 15),
                                    ),
                                    const SizedBox(width: 8),
                                    const Icon(Icons.arrow_forward, size: 18),
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
                        '其他登录方式',
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
                      onTap: () =>
                          showCapsuleToast(context, '微信登录仅小程序可用，APP 请使用手机号'),
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

class _LoginField extends StatelessWidget {
  final TextEditingController controller;
  final String hintText;
  final IconData icon;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? suffixIcon;

  const _LoginField({
    required this.controller,
    required this.hintText,
    required this.icon,
    this.keyboardType,
    this.obscureText = false,
    this.suffixIcon,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: const TextStyle(color: AppColors.textPlaceholder),
        prefixIcon: Icon(icon, color: AppColors.textPlaceholder, size: 20),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: const Color(0x66FFFFFF),
        border: _border(),
        enabledBorder: _border(),
        focusedBorder: _border(),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
    );
  }

  OutlineInputBorder _border() {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Color(0x1A000000)),
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
