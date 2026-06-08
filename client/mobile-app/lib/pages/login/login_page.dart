import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/capsule_toast.dart';

enum _AuthMode { login, register, reset }

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _accountCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _nicknameCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  _AuthMode _mode = _AuthMode.login;
  bool _obscure = true;
  int _seconds = 0;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    _accountCtrl.dispose();
    _passwordCtrl.dispose();
    _nicknameCtrl.dispose();
    _codeCtrl.dispose();
    super.dispose();
  }

  bool get _isReset => _mode == _AuthMode.reset;
  bool get _needCode => _mode != _AuthMode.login;

  String get _title => switch (_mode) {
    _AuthMode.login => '欢迎回来',
    _AuthMode.register => '创建账号',
    _AuthMode.reset => '重置密码',
  };

  String get _subtitle => switch (_mode) {
    _AuthMode.login => '用手机号或邮箱登录，同步收藏和冰箱',
    _AuthMode.register => '验证账号后即可开始记录你的厨房灵感',
    _AuthMode.reset => '输入验证码，为账号设置一个新密码',
  };

  String get _buttonText => switch (_mode) {
    _AuthMode.login => '登录',
    _AuthMode.register => '注册并登录',
    _AuthMode.reset => '重置密码',
  };

  String get _codeType => switch (_mode) {
    _AuthMode.register => 'register',
    _AuthMode.reset => 'resetPassword',
    _AuthMode.login => 'register',
  };

  void _switchMode(_AuthMode mode) {
    setState(() {
      _mode = mode;
      _codeCtrl.clear();
      _passwordCtrl.clear();
      _timer?.cancel();
      _seconds = 0;
    });
  }

  bool _validateAccount(String account) {
    return account.contains('@') ? account.contains('.') : account.length >= 6;
  }

  Future<void> _sendCode() async {
    final account = _accountCtrl.text.trim();
    if (!_validateAccount(account)) {
      showCapsuleToast(context, '请输入有效手机号或邮箱', icon: Icons.info_outline);
      return;
    }

    try {
      await ref
          .read(authControllerProvider.notifier)
          .sendVerificationCode(account, _codeType);
      if (!mounted) return;
      showCapsuleToast(context, '验证码已发送', icon: Icons.check_circle_outline);
      setState(() => _seconds = 60);
      _timer?.cancel();
      _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (_seconds <= 1) {
          timer.cancel();
          if (mounted) setState(() => _seconds = 0);
        } else if (mounted) {
          setState(() => _seconds--);
        }
      });
    } catch (_) {
      final message =
          ref.read(authControllerProvider).error?.message ?? '验证码发送失败';
      if (mounted) {
        showCapsuleToast(context, message, icon: Icons.error_outline);
      }
    }
  }

  Future<void> _submit() async {
    final account = _accountCtrl.text.trim();
    final password = _passwordCtrl.text;
    final code = _codeCtrl.text.trim();
    final nickname = _nicknameCtrl.text.trim();

    if (!_validateAccount(account) || password.isEmpty) {
      showCapsuleToast(context, '请输入账号和密码', icon: Icons.info_outline);
      return;
    }
    if (password.length < 6) {
      showCapsuleToast(context, '密码至少 6 位', icon: Icons.lock_outline);
      return;
    }
    if (_needCode && code.isEmpty) {
      showCapsuleToast(context, '请输入验证码', icon: Icons.sms_outlined);
      return;
    }

    try {
      final auth = ref.read(authControllerProvider.notifier);
      if (_mode == _AuthMode.login) {
        await auth.login(account, password);
        if (mounted) context.go('/mine');
      } else if (_mode == _AuthMode.register) {
        await auth.register(account, password, nickname, code);
        if (mounted) context.go('/mine');
      } else {
        await auth.resetPassword(account, code, password);
        if (!mounted) return;
        showCapsuleToast(
          context,
          '密码已重置，请登录',
          icon: Icons.check_circle_outline,
        );
        _switchMode(_AuthMode.login);
      }
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
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 36, 24, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),
              _BrandHeader(mode: _mode),
              const SizedBox(height: 32),
              _AuthCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_isReset)
                      Align(
                        alignment: Alignment.centerLeft,
                        child: _BackButton(
                          onTap: auth.isLoading
                              ? null
                              : () => _switchMode(_AuthMode.login),
                        ),
                      )
                    else
                      _ModeSwitch(
                        mode: _mode,
                        onChanged: auth.isLoading ? null : _switchMode,
                      ),
                    const SizedBox(height: 22),
                    Text(
                      _title,
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _subtitle,
                      style: Theme.of(context).textTheme.bodyMedium
                          ?.copyWith(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 24),
                    _LoginField(
                      controller: _accountCtrl,
                      label: '账号',
                      hintText: '手机号 / 邮箱',
                      icon: Icons.alternate_email,
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 14),
                    if (_needCode) ...[
                      _LoginField(
                        controller: _codeCtrl,
                        label: '验证码',
                        hintText: '6 位验证码',
                        icon: Icons.sms_outlined,
                        keyboardType: TextInputType.number,
                        suffixIcon: _CodeButton(
                          seconds: _seconds,
                          loading: auth.isLoading,
                          onTap: _sendCode,
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],
                    _LoginField(
                      controller: _passwordCtrl,
                      label: _isReset ? '新密码' : '密码',
                      hintText: _isReset ? '设置新密码' : '输入密码',
                      icon: Icons.lock_outline,
                      obscureText: _obscure,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscure
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          color: AppColors.textPlaceholder,
                          size: 20,
                        ),
                        onPressed: () =>
                            setState(() => _obscure = !_obscure),
                      ),
                    ),
                    if (_mode == _AuthMode.register) ...[
                      const SizedBox(height: 14),
                      _LoginField(
                        controller: _nicknameCtrl,
                        label: '昵称',
                        hintText: '怎么称呼你',
                        icon: Icons.person_outline,
                      ),
                    ],
                    if (_mode == _AuthMode.login) ...[
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: auth.isLoading
                              ? null
                              : () => _switchMode(_AuthMode.reset),
                          child: const Text('忘记密码？'),
                        ),
                      ),
                    ],
                    const SizedBox(height: 18),
                    FilledButton(
                      onPressed: auth.isLoading ? null : _submit,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.textPrimary,
                        foregroundColor: AppColors.surface,
                        disabledBackgroundColor: AppColors.textPrimary
                            .withAlpha(100),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
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
                          : Text(_buttonText),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              Text(
                '登录即表示你同意同步收藏、浏览记录与账号安全信息',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.textPlaceholder,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BrandHeader extends StatelessWidget {
  final _AuthMode mode;

  const _BrandHeader({required this.mode});

  @override
  Widget build(BuildContext context) {
    final tagline = mode == _AuthMode.register
        ? '把家常菜、灵感和收藏放进同一个厨房'
        : '继续你的厨房灵感';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 54,
          height: 54,
          decoration: BoxDecoration(
            color: AppColors.textPrimary,
            borderRadius: BorderRadius.circular(18),
            boxShadow: const [
              BoxShadow(
                color: Color(0x1F000000),
                blurRadius: 18,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: const Icon(Icons.restaurant_menu, color: AppColors.surface),
        ),
        const SizedBox(height: 20),
        Text('小厨子', style: Theme.of(context).textTheme.displayLarge),
        const SizedBox(height: 8),
        Text(
          tagline,
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

class _AuthCard extends StatelessWidget {
  final Widget child;

  const _AuthCard({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: AppColors.glassSurface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppColors.subtleBorder),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 32,
            offset: Offset(0, 18),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _ModeSwitch extends StatelessWidget {
  final _AuthMode mode;
  final ValueChanged<_AuthMode>? onChanged;

  const _ModeSwitch({required this.mode, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.surfaceSecondary,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          _ModePill(
            text: '登录',
            active: mode == _AuthMode.login,
            onTap: onChanged == null ? null : () => onChanged!(_AuthMode.login),
          ),
          _ModePill(
            text: '注册',
            active: mode == _AuthMode.register,
            onTap: onChanged == null
                ? null
                : () => onChanged!(_AuthMode.register),
          ),
        ],
      ),
    );
  }
}

class _ModePill extends StatelessWidget {
  final String text;
  final bool active;
  final VoidCallback? onTap;

  const _ModePill({
    required this.text,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 11),
          decoration: BoxDecoration(
            color: active ? AppColors.surface : Colors.transparent,
            borderRadius: BorderRadius.circular(13),
            boxShadow: active
                ? const [
                    BoxShadow(
                      color: Color(0x0D000000),
                      blurRadius: 12,
                      offset: Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Text(
            text,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: active ? AppColors.textPrimary : AppColors.textSecondary,
              fontWeight: active ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }
}

class _BackButton extends StatelessWidget {
  final VoidCallback? onTap;

  const _BackButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      onPressed: onTap,
      icon: const Icon(Icons.arrow_back_ios_new, size: 15),
      label: const Text('返回登录'),
      style: TextButton.styleFrom(
        foregroundColor: AppColors.textSecondary,
        padding: EdgeInsets.zero,
      ),
    );
  }
}

class _CodeButton extends StatelessWidget {
  final int seconds;
  final bool loading;
  final VoidCallback onTap;

  const _CodeButton({
    required this.seconds,
    required this.loading,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: loading || seconds > 0 ? null : onTap,
      child: Text(seconds > 0 ? '${seconds}s' : '获取验证码'),
    );
  }
}

class _LoginField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hintText;
  final IconData icon;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? suffixIcon;

  const _LoginField({
    required this.controller,
    required this.label,
    required this.hintText,
    required this.icon,
    this.keyboardType,
    this.obscureText = false,
    this.suffixIcon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 7),
          child: Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary),
          ),
        ),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: const TextStyle(color: AppColors.textPlaceholder),
            prefixIcon: Icon(icon, color: AppColors.textPlaceholder, size: 20),
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: const Color(0xF7FFFFFF),
            border: _border(AppColors.divider),
            enabledBorder: _border(AppColors.divider),
            focusedBorder: _border(AppColors.textPrimary),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 15,
            ),
          ),
        ),
      ],
    );
  }

  OutlineInputBorder _border(Color color) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: color),
    );
  }
}
