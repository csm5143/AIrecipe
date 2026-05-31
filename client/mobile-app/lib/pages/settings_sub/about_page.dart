import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: AppColors.glassSurface, leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, size: 20), onPressed: () => Navigator.of(context).canPop() ? context.pop() : context.go('/mine')), title: const Text('吃了么')),
      body: Column(children: [
        const Spacer(),
        // App icon + name
        Center(child: Column(children: [
          Container(width: 128, height: 128, decoration: BoxDecoration(borderRadius: BorderRadius.circular(30), color: AppColors.textPrimary, boxShadow: const [BoxShadow(color: Color(0x1A000000), blurRadius: 32)]), child: const Icon(Icons.restaurant, size: 64, color: AppColors.surface)),
          const SizedBox(height: 20),
          Text('吃了么', style: Theme.of(context).textTheme.displayLarge),
          const SizedBox(height: 8),
          Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6), decoration: BoxDecoration(color: AppColors.surfaceSecondary, borderRadius: BorderRadius.circular(20)), child: const Text('Version 1.0.0', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary, letterSpacing: 0.5))),
        ])),
        const SizedBox(height: 48),
        // Links
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Container(decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)]), child: Column(children: [
            _LinkRow(title: '更新日志'),
            const Divider(height: 1, indent: 16), _LinkRow(title: '用户协议'),
            const Divider(height: 1, indent: 16), _LinkRow(title: '隐私政策'),
          ])),
        ),
        const Spacer(),
        Text('Copyright © 2024 吃了么. All rights reserved.', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.textPlaceholder)),
        const SizedBox(height: 32),
      ]),
    );
  }
}

class _LinkRow extends StatelessWidget { final String title; const _LinkRow({required this.title}); @override Widget build(BuildContext c) => ListTile(title: Text(title, style: const TextStyle(fontSize: 15)), trailing: const Icon(Icons.chevron_right, color: AppColors.divider), contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4)); }
