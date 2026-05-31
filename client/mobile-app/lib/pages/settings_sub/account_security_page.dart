import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';

class AccountSecurityPage extends StatelessWidget {
  const AccountSecurityPage({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: AppColors.glassSurface, leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, size: 20), onPressed: () => Navigator.of(context).canPop() ? context.pop() : context.go('/mine')), title: const Text('账号与安全')),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 20, 16, 100), children: [
        // Security level card
        Container(
          margin: const EdgeInsets.only(bottom: 28),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), gradient: const LinearGradient(colors: [Color(0xFFF8F8FA), Color(0xFFE8E8EA)], begin: Alignment.topLeft, end: Alignment.bottomRight), boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)]),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('安全等级', style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary)), const SizedBox(height: 4), const Text('高', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600))])),
            Container(width: 56, height: 56, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: const Color(0xFF34C759), width: 3)), child: const Center(child: Text('100%', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)))),
            const SizedBox(width: 12),
            const Icon(Icons.verified_user, color: Color(0xFF34C759), size: 28),
          ]),
        ),
        _Card(children: const [
          _Row(icon: Icons.lock, title: '修改密码', subtitle: '3个月前更新'),
          _Div(),
          _Row(icon: Icons.smartphone, title: '手机号绑定', subtitle: '+1 *** **** 456'),
          _Div(),
          _Row(icon: Icons.mail, title: '邮箱', subtitle: 'j***@example.com'),
          _Div(),
          _Row(icon: Icons.link, title: '第三方账号', subtitle: 'Google 已连接'),
          _Div(),
          _Row(icon: Icons.person_off, title: '注销账号', isDestructive: true),
        ]),
      ]),
    );
  }
}

class _Card extends StatelessWidget { final List<Widget> children; const _Card({required this.children}); @override Widget build(BuildContext c) => Container(decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)]), child: Column(children: children)); }
class _Row extends StatelessWidget { final IconData icon; final String title, subtitle; final bool isDestructive; const _Row({required this.icon, required this.title, this.subtitle = '', this.isDestructive = false}); @override Widget build(BuildContext c) => ListTile(leading: Icon(icon, size: 20, color: isDestructive ? AppColors.error : AppColors.textSecondary), title: Text(title, style: TextStyle(fontSize: 15, color: isDestructive ? AppColors.error : AppColors.textPrimary)), subtitle: subtitle.isNotEmpty ? Text(subtitle, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)) : null, trailing: const Icon(Icons.chevron_right, color: AppColors.divider), contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4)); }
class _Div extends StatelessWidget { const _Div(); @override Widget build(BuildContext c) => const Divider(height: 1, indent: 48); }
