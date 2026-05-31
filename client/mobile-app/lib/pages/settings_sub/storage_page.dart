import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';

class StoragePage extends StatelessWidget {
  const StoragePage({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: AppColors.glassSurface, leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, size: 20), onPressed: () => Navigator.of(context).canPop() ? context.pop() : context.go('/mine')), title: const Text('吃了么')),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 24, 16, 100), children: [
        Text('存储管理', style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 28)),
        const SizedBox(height: 6),
        Text('管理你的应用数据和缓存。', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary)),
        const SizedBox(height: 32),
        // Donut chart
        Center(child: SizedBox(width: 160, height: 160, child: CustomPaint(painter: _DonutPainter(), child: const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Text('2.4', style: TextStyle(fontSize: 34, fontWeight: FontWeight.w700)), Text('GB 已用', style: TextStyle(fontSize: 13, color: AppColors.textSecondary))]))))),
        const SizedBox(height: 20),
        _LegendRow(color: AppColors.surfaceSecondary, label: '应用数据', size: '350 MB'),
        _LegendRow(color: AppColors.textSecondary, label: 'AI 缓存', size: '850 MB'),
        _LegendRow(color: AppColors.textPrimary, label: '图片与媒体', size: '1.2 GB'),
        const SizedBox(height: 32),
        _ActionBtn(icon: Icons.image, title: '清除图片缓存', subtitle: '释放约 1.2 GB'),
        const SizedBox(height: 12),
        _ActionBtn(icon: Icons.memory, title: '清除 AI 历史', subtitle: '释放约 850 MB'),
      ]),
    );
  }
}

class _LegendRow extends StatelessWidget { final Color color; final String label, size; const _LegendRow({required this.color, required this.label, required this.size}); @override Widget build(BuildContext c) => Padding(padding: const EdgeInsets.symmetric(vertical: 6), child: Row(children: [Container(width: 10, height: 10, decoration: BoxDecoration(shape: BoxShape.circle, color: color)), const SizedBox(width: 12), Text(label, style: const TextStyle(fontSize: 15)), const Spacer(), Text(size, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary))])); }
class _ActionBtn extends StatelessWidget { final IconData icon; final String title, subtitle; const _ActionBtn({required this.icon, required this.title, required this.subtitle}); @override Widget build(BuildContext c) => ListTile(leading: Icon(icon, size: 22, color: AppColors.textSecondary), title: Text(title, style: const TextStyle(fontSize: 15)), subtitle: Text(subtitle, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)), trailing: const Icon(Icons.chevron_right, color: AppColors.divider), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), tileColor: AppColors.surface, contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8)); }
class _DonutPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 8;
    final paint = Paint()..style = PaintingStyle.stroke..strokeWidth = 16..strokeCap = StrokeCap.round;
    // App data 25%
    paint.color = AppColors.surfaceSecondary; canvas.drawArc(Rect.fromCircle(center: center, radius: radius), -1.57, 1.57, false, paint);
    // AI cache 35%
    paint.color = AppColors.textSecondary; canvas.drawArc(Rect.fromCircle(center: center, radius: radius), 0, 2.2, false, paint);
    // Images 40%
    paint.color = AppColors.textPrimary; canvas.drawArc(Rect.fromCircle(center: center, radius: radius), 2.2, 4.08, false, paint);
  }
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
