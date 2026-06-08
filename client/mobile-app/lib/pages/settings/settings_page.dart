import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';

class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        title: const Text('设置'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.of(context).canPop()
              ? context.pop()
              : context.go('/mine'),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        children: [
          _ProfileCard(
            name: auth.user?.nickname.isNotEmpty == true
                ? auth.user!.nickname
                : '未命名用户',
            id: auth.user?.id ?? '-',
            avatar: auth.user?.avatar ?? '',
          ),
          const SizedBox(height: 24),
          _Group(
            items: const [
              _Item(
                icon: Icons.person_outline,
                title: '编辑资料',
                route: '/settings/edit-profile',
              ),
              _Item(
                icon: Icons.shield_outlined,
                title: '账号与安全',
                route: '/settings/account',
              ),
            ],
          ),
          const SizedBox(height: 16),
          _Group(
            items: const [
              _Item(
                icon: Icons.notifications_outlined,
                title: '通知设置',
                route: '/settings/notifications',
              ),
              _Item(
                icon: Icons.lock_outline,
                title: '隐私设置',
                route: '/settings/privacy',
              ),
              _Item(
                icon: Icons.cleaning_services_outlined,
                title: '存储管理',
                trailing: '查看详情',
                route: '/settings/storage',
              ),
            ],
          ),
          const SizedBox(height: 16),
          _Group(
            items: const [
              _Item(
                icon: Icons.help_outline,
                title: '帮助与反馈',
                route: '/settings/help',
              ),
              _Item(
                icon: Icons.info_outline,
                title: '关于',
                trailing: 'v2.4.1',
                route: '/settings/about',
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: auth.isLoading
                  ? null
                  : () async {
                      await ref.read(authControllerProvider.notifier).logout();
                      if (context.mounted) context.go('/login');
                    },
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                side: const BorderSide(color: AppColors.divider),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: Text(
                '退出登录',
                style: Theme.of(
                  context,
                ).textTheme.bodyLarge?.copyWith(color: AppColors.error),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileCard extends StatelessWidget {
  final String name;
  final String id;
  final String avatar;

  const _ProfileCard({
    required this.name,
    required this.id,
    required this.avatar,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: AppColors.surfaceSecondary,
            backgroundImage: avatar.isNotEmpty ? NetworkImage(avatar) : null,
            child: avatar.isNotEmpty
                ? null
                : const Icon(
                    Icons.person,
                    size: 32,
                    color: AppColors.textSecondary,
                  ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '账号: $id',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.qr_code, color: AppColors.textPrimary),
        ],
      ),
    );
  }
}

class _Group extends StatelessWidget {
  final List<_Item> items;

  const _Group({required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)],
      ),
      child: Column(
        children: items.asMap().entries.map((entry) {
          final item = entry.value;
          return Column(
            children: [
              if (entry.key > 0) const Divider(height: 1, indent: 52),
              ListTile(
                leading: Icon(
                  item.icon,
                  color: AppColors.textSecondary,
                  size: 22,
                ),
                title: Text(
                  item.title,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (item.trailing != null) ...[
                      Text(
                        item.trailing!,
                        style: Theme.of(context).textTheme.labelMedium
                            ?.copyWith(color: AppColors.textSecondary),
                      ),
                      const SizedBox(width: 8),
                    ],
                    const Icon(Icons.chevron_right, color: AppColors.divider),
                  ],
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 4,
                ),
                onTap: () {
                  if (item.route.isNotEmpty) context.push(item.route);
                },
              ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _Item {
  final IconData icon;
  final String title;
  final String? trailing;
  final String route;

  const _Item({
    required this.icon,
    required this.title,
    this.trailing,
    this.route = '',
  });
}
