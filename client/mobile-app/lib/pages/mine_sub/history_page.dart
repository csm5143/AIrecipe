import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';

class HistoryPage extends StatelessWidget {
  const HistoryPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: AppColors.glassSurface, leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, size: 20), onPressed: () => Navigator.of(context).canPop() ? context.pop() : context.go('/mine')), title: const Text('浏览历史'), actions: [TextButton(onPressed: () {}, child: const Text('清空', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)))]),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 100), children: [
        _Section(title: '今天'),
        _HistoryCard(title: 'Authentic Dan Dan Noodles', author: 'Chef Liang', time: '14:15'),
        _HistoryCard(title: 'Morning Espresso Art', author: 'Daily Bean', time: '08:30'),
        const SizedBox(height: 24),
        _Section(title: '昨天'),
        _HistoryCard(title: 'Perfect Avocado Toast', author: 'Brunch Masters', time: '昨天'),
        _HistoryCard(title: 'Matcha Mille Crepe', author: 'Sweet Studio', time: '昨天'),
      ]),
    );
  }
}

class _Section extends StatelessWidget { final String title; const _Section({required this.title}); @override Widget build(BuildContext c) => Padding(padding: const EdgeInsets.only(bottom: 10, left: 8), child: Text(title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary, letterSpacing: 0.5))); }
class _HistoryCard extends StatelessWidget { final String title, author, time; const _HistoryCard({required this.title, required this.author, required this.time}); @override Widget build(BuildContext c) => Container(margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)]), child: Row(children: [ClipRRect(borderRadius: BorderRadius.circular(10), child: Container(width: 72, height: 72, color: AppColors.surfaceSecondary, child: const Icon(Icons.restaurant, color: AppColors.textPlaceholder))), const SizedBox(width: 14), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500)), const SizedBox(height: 4), Row(children: [const Icon(Icons.person, size: 14, color: AppColors.textSecondary), const SizedBox(width: 4), Text('$author · $time', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary))])]))])); }
