import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/capsule_toast.dart';

class EditProfilePage extends ConsumerStatefulWidget {
  const EditProfilePage({super.key});

  @override
  ConsumerState<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends ConsumerState<EditProfilePage> {
  final _nickCtrl = TextEditingController();
  final _bioCtrl = TextEditingController();
  String _gender = 'UNKNOWN';
  bool _didHydrate = false;

  @override
  void dispose() {
    _nickCtrl.dispose();
    _bioCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    try {
      await ref.read(authControllerProvider.notifier).updateProfile({
        'nickname': _nickCtrl.text.trim(),
        'bio': _bioCtrl.text.trim(),
        'gender': _gender,
      });
      if (!mounted) return;
      showCapsuleToast(context, '资料已保存', icon: Icons.check_circle_outline);
      context.pop();
    } catch (_) {
      final message =
          ref.read(authControllerProvider).error?.message ?? '保存失败，请稍后再试';
      if (mounted) {
        showCapsuleToast(context, message, icon: Icons.error_outline);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final user = auth.user;

    if (!_didHydrate && user != null) {
      _nickCtrl.text = user.nickname;
      _bioCtrl.text = user.bio;
      _gender = user.gender.isEmpty ? 'UNKNOWN' : user.gender;
      _didHydrate = true;
    }

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
        title: const Text('编辑资料'),
        actions: [
          TextButton(
            onPressed: auth.isLoading ? null : _save,
            child: auth.isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text(
                    '保存',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                  ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const SizedBox(height: 16),
            Center(
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 64,
                    backgroundColor: AppColors.surfaceSecondary,
                    backgroundImage: (user?.avatar.isNotEmpty ?? false)
                        ? NetworkImage(user!.avatar)
                        : null,
                    child: (user?.avatar.isNotEmpty ?? false)
                        ? null
                        : const Icon(
                            Icons.person,
                            size: 64,
                            color: AppColors.textSecondary,
                          ),
                  ),
                  Positioned(
                    bottom: 4,
                    right: 4,
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: AppColors.textPrimary,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.background,
                          width: 2,
                        ),
                      ),
                      child: const Icon(
                        Icons.camera_alt,
                        size: 16,
                        color: AppColors.surface,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '头像上传稍后接入',
              style: Theme.of(
                context,
              ).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 32),
            _Field(
              label: '昵称',
              child: TextField(
                controller: _nickCtrl,
                style: const TextStyle(fontSize: 15),
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            _Field(
              label: '简介',
              child: TextField(
                controller: _bioCtrl,
                maxLines: 3,
                style: const TextStyle(fontSize: 15),
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                '性别',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children:
                  const [
                    _GenderOption(label: '女', value: 'FEMALE'),
                    _GenderOption(label: '男', value: 'MALE'),
                    _GenderOption(label: '保密', value: 'UNKNOWN', isLast: true),
                  ].map((option) {
                    final active = option.value == _gender;
                    return Expanded(
                      child: Padding(
                        padding: EdgeInsets.only(right: option.isLast ? 0 : 8),
                        child: GestureDetector(
                          onTap: () => setState(() => _gender = option.value),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            decoration: BoxDecoration(
                              color: active
                                  ? AppColors.textPrimary
                                  : AppColors.surface,
                              borderRadius: BorderRadius.circular(14),
                              border: active
                                  ? null
                                  : Border.all(color: AppColors.divider),
                            ),
                            child: Text(
                              option.label,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: active
                                    ? AppColors.surface
                                    : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}

class _GenderOption {
  final String label;
  final String value;
  final bool isLast;

  const _GenderOption({
    required this.label,
    required this.value,
    this.isLast = false,
  });
}

class _Field extends StatelessWidget {
  final String label;
  final Widget child;

  const _Field({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0x0A000000)),
            boxShadow: const [
              BoxShadow(color: Color(0x08000000), blurRadius: 24),
            ],
          ),
          child: child,
        ),
      ],
    );
  }
}
