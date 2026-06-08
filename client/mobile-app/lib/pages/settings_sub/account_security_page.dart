import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../data/api/app_exception.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/capsule_toast.dart';

class AccountSecurityPage extends ConsumerWidget {
  const AccountSecurityPage({super.key});

  String _maskPhone(String phone) {
    if (phone.length < 7) return phone.isEmpty ? '未绑定' : phone;
    return '${phone.substring(0, 3)} **** ${phone.substring(phone.length - 4)}';
  }

  String _maskEmail(String email) {
    if (email.isEmpty) return '未绑定';
    final parts = email.split('@');
    if (parts.length != 2) return email;
    final name = parts.first;
    final masked = name.length <= 2
        ? '${name.substring(0, 1)}*'
        : '${name.substring(0, 2)}***';
    return '$masked@${parts.last}';
  }

  Future<void> _showPasswordDialog(BuildContext context, WidgetRef ref) async {
    final oldController = TextEditingController();
    final newController = TextEditingController();
    final confirmController = TextEditingController();

    await showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('修改密码'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: oldController,
              obscureText: true,
              decoration: const InputDecoration(labelText: '当前密码'),
            ),
            TextField(
              controller: newController,
              obscureText: true,
              decoration: const InputDecoration(labelText: '新密码'),
            ),
            TextField(
              controller: confirmController,
              obscureText: true,
              decoration: const InputDecoration(labelText: '确认新密码'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () async {
              final newPassword = newController.text.trim();
              if (newPassword.length < 6) {
                showCapsuleToast(context, '新密码至少 6 位', icon: Icons.info);
                return;
              }
              if (newPassword != confirmController.text.trim()) {
                showCapsuleToast(context, '两次密码不一致', icon: Icons.info);
                return;
              }
              try {
                await ref
                    .read(authControllerProvider.notifier)
                    .changePassword(oldController.text, newPassword);
                if (!context.mounted) return;
                Navigator.of(dialogContext).pop();
                showCapsuleToast(
                  context,
                  '密码已修改',
                  icon: Icons.check_circle_outline,
                );
              } catch (error) {
                final message = error is AppException
                    ? error.message
                    : error.toString();
                if (context.mounted) {
                  showCapsuleToast(context, message, icon: Icons.error_outline);
                }
              }
            },
            child: const Text('保存'),
          ),
        ],
      ),
    );

    oldController.dispose();
    newController.dispose();
    confirmController.dispose();
  }

  Future<void> _showPhoneDialog(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController();
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('绑定手机号'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(hintText: '请输入手机号'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () async {
              final phone = controller.text.trim();
              if (phone.length < 6) {
                showCapsuleToast(context, '请输入有效手机号', icon: Icons.info);
                return;
              }
              try {
                await ref
                    .read(authControllerProvider.notifier)
                    .bindPhone(phone);
                if (!context.mounted) return;
                Navigator.of(dialogContext).pop();
                showCapsuleToast(
                  context,
                  '手机号已更新',
                  icon: Icons.check_circle_outline,
                );
              } catch (error) {
                final message = error is AppException
                    ? error.message
                    : error.toString();
                if (context.mounted) {
                  showCapsuleToast(context, message, icon: Icons.error_outline);
                }
              }
            },
            child: const Text('保存'),
          ),
        ],
      ),
    );
    controller.dispose();
  }

  Future<void> _showEmailDialog(BuildContext context, WidgetRef ref) async {
    final emailController = TextEditingController();
    final codeController = TextEditingController();
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('绑定邮箱'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                labelText: '邮箱',
                suffix: TextButton(
                  onPressed: () async {
                    final email = emailController.text.trim();
                    if (!email.contains('@')) {
                      showCapsuleToast(context, '请输入有效邮箱', icon: Icons.info);
                      return;
                    }
                    try {
                      await ref
                          .read(authControllerProvider.notifier)
                          .sendVerificationCode(email, 'bind');
                      if (context.mounted) {
                        showCapsuleToast(
                          context,
                          '验证码已发送',
                          icon: Icons.check_circle_outline,
                        );
                      }
                    } catch (error) {
                      final message = error is AppException
                          ? error.message
                          : error.toString();
                      if (context.mounted) {
                        showCapsuleToast(
                          context,
                          message,
                          icon: Icons.error_outline,
                        );
                      }
                    }
                  },
                  child: const Text('获取验证码'),
                ),
              ),
            ),
            TextField(
              controller: codeController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: '验证码'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () async {
              final email = emailController.text.trim();
              final code = codeController.text.trim();
              if (!email.contains('@') || code.isEmpty) {
                showCapsuleToast(context, '请填写邮箱和验证码', icon: Icons.info);
                return;
              }
              try {
                await ref
                    .read(authControllerProvider.notifier)
                    .bindEmail(email, code);
                if (!context.mounted) return;
                Navigator.of(dialogContext).pop();
                showCapsuleToast(
                  context,
                  '邮箱已绑定',
                  icon: Icons.check_circle_outline,
                );
              } catch (error) {
                final message = error is AppException
                    ? error.message
                    : error.toString();
                if (context.mounted) {
                  showCapsuleToast(context, message, icon: Icons.error_outline);
                }
              }
            },
            child: const Text('绑定'),
          ),
        ],
      ),
    );
    emailController.dispose();
    codeController.dispose();
  }

  void _showDeveloping(BuildContext context) {
    showCapsuleToast(context, '功能开发中', icon: Icons.build_outlined);
  }

  Future<void> _confirmDeleteAccount(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('注销账号'),
        content: const Text('注销账号会删除你的登录身份和相关数据。当前后端暂未开放注销接口。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('确认'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) _showDeveloping(context);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final user = authState.user;
    final securityScore =
        user?.phone.isNotEmpty == true && user?.email.isNotEmpty == true
        ? 100
        : user?.phone.isNotEmpty == true || user?.email.isNotEmpty == true
        ? 80
        : 60;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.of(context).canPop()
              ? context.pop()
              : context.go('/mine'),
        ),
        title: const Text('账号与安全'),
      ),
      body: authState.isLoading && user == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 100),
              children: [
                Container(
                  margin: const EdgeInsets.only(bottom: 28),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    gradient: const LinearGradient(
                      colors: [Color(0xFFF8F8FA), Color(0xFFE8E8EA)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: const [
                      BoxShadow(color: Color(0x0A000000), blurRadius: 24),
                    ],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '安全等级',
                              style: Theme.of(context).textTheme.labelMedium
                                  ?.copyWith(color: AppColors.textSecondary),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              securityScore >= 80 ? '良好' : '待完善',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFF34C759),
                            width: 3,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            '$securityScore%',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                _Card(
                  children: [
                    _Row(
                      icon: Icons.lock,
                      title: '修改密码',
                      subtitle: '建议定期更新登录密码',
                      onTap: () => _showPasswordDialog(context, ref),
                    ),
                    const _Div(),
                    _Row(
                      icon: Icons.smartphone,
                      title: '手机号绑定',
                      subtitle: _maskPhone(user?.phone ?? ''),
                      onTap: () => _showPhoneDialog(context, ref),
                    ),
                    const _Div(),
                    _Row(
                      icon: Icons.mail,
                      title: '邮箱',
                      subtitle: _maskEmail(user?.email ?? ''),
                      onTap: () => _showEmailDialog(context, ref),
                    ),
                    const _Div(),
                    _Row(
                      icon: Icons.link,
                      title: '第三方账号',
                      subtitle: '微信绑定状态以后端账号为准',
                      onTap: () => _showDeveloping(context),
                    ),
                    const _Div(),
                    _Row(
                      icon: Icons.person_off,
                      title: '注销账号',
                      subtitle: '删除账号与个人数据',
                      isDestructive: true,
                      onTap: () => _confirmDeleteAccount(context),
                    ),
                  ],
                ),
              ],
            ),
    );
  }
}

class _Card extends StatelessWidget {
  final List<Widget> children;

  const _Card({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)],
      ),
      child: Column(children: children),
    );
  }
}

class _Row extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool isDestructive;
  final VoidCallback onTap;

  const _Row({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Icon(
        icon,
        size: 20,
        color: isDestructive ? AppColors.error : AppColors.textSecondary,
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 15,
          color: isDestructive ? AppColors.error : AppColors.textPrimary,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
      ),
      trailing: const Icon(Icons.chevron_right, color: AppColors.divider),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }
}

class _Div extends StatelessWidget {
  const _Div();

  @override
  Widget build(BuildContext context) {
    return const Divider(height: 1, indent: 48);
  }
}
