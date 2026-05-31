import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';

/// 设置页
class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        title: const Text('设置'),
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, size: 20), onPressed: () => Navigator.of(context).canPop() ? context.pop() : context.go('/mine')),
      ),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 100), children: [
        _ProfileCard(),
        const SizedBox(height: 24),
        _Group(items: [
          _Item(icon: Icons.person_outline, title: '编辑资料', route: '/settings/edit-profile'),
          _Item(icon: Icons.shield_outlined, title: '账号与安全', route: '/settings/account'),
        ]),
        const SizedBox(height: 16),
        _Group(items: [
          _Item(icon: Icons.notifications_outlined, title: '通知设置', route: '/settings/notifications'),
          _Item(icon: Icons.lock_outline, title: '隐私设置', route: '/settings/privacy'),
          _Item(icon: Icons.cleaning_services_outlined, title: '存储管理', trailing: '124 MB', route: '/settings/storage'),
        ]),
        const SizedBox(height: 16),
        _Group(items: [
          _Item(icon: Icons.help_outline, title: '帮助与反馈', route: '/settings/help'),
          _Item(icon: Icons.info_outline, title: '关于', trailing: 'v2.4.1', route: '/settings/about'),
        ]),
        const SizedBox(height: 24),
        SizedBox(width: double.infinity, child: OutlinedButton(
          onPressed: () => context.go('/login'),
          style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), side: const BorderSide(color: AppColors.divider), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
          child: Text('退出登录', style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppColors.error)),
        )),
      ]),
    );
  }
}

class _ProfileCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)]),
      child: const Row(children: [
        CircleAvatar(radius: 32, backgroundColor: AppColors.surfaceSecondary, child: Icon(Icons.person, size: 32, color: AppColors.textSecondary)),
        SizedBox(width: 16),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Alex Chen', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)), SizedBox(height: 4), Text('ID: 849201', style: TextStyle(fontSize: 13, color: AppColors.textSecondary))])),
        Icon(Icons.qr_code, color: AppColors.textPrimary),
      ]),
    );
  }
}

class _Group extends StatelessWidget {
  final List<_Item> items;
  const _Group({required this.items});
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)]),
      child: Column(children: items.asMap().entries.map((e) => Column(children: [
        if (e.key > 0) const Divider(height: 1, indent: 52),
        ListTile(leading: Icon(e.value.icon, color: AppColors.textSecondary, size: 22), title: Text(e.value.title, style: Theme.of(context).textTheme.bodyMedium), trailing: Row(mainAxisSize: MainAxisSize.min, children: [if (e.value.trailing != null) ...[Text(e.value.trailing!, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary)), const SizedBox(width: 8)], Icon(Icons.chevron_right, color: AppColors.divider)]), contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4), onTap: () { if (e.value.route.isNotEmpty) context.push(e.value.route); }),
      ])).toList()),
    );
  }
}

class _Item { final IconData icon; final String title; final String? trailing; final String route; const _Item({required this.icon, required this.title, this.trailing, this.route = ''}); }
