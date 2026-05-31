import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';

/// AI 拍照识别食材页 — 模拟取景器 + 扫描线动画 + 检测框 + 底部控制栏
class ScanPage extends StatefulWidget {
  const ScanPage({super.key});
  @override
  State<ScanPage> createState() => _ScanPageState();
}

class _ScanPageState extends State<ScanPage> with SingleTickerProviderStateMixin {
  late final AnimationController _scanCtrl;

  @override
  void initState() {
    super.initState();
    _scanCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 3))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _scanCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(children: [
        // Simulated camera feed
        Positioned.fill(
          child: Container(
            decoration: const BoxDecoration(
              image: DecorationImage(
                image: NetworkImage('https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80'),
                fit: BoxFit.cover,
              ),
            ),
          ),
        ),
        // Dark overlay gradient
        const Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter, end: Alignment.bottomCenter,
                colors: [Color(0x66000000), Colors.transparent, Colors.transparent, Color(0x99000000)],
              ),
            ),
          ),
        ),
        // Scanning line
        AnimatedBuilder(
          animation: _scanCtrl,
          builder: (ctx, _) {
            final top = 0.15 + (_scanCtrl.value * 0.7);
            return Positioned(
              left: 16, right: 16,
              top: MediaQuery.of(context).size.height * top,
              child: Container(
                height: 2,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Colors.transparent, Color(0x66FFFFFF), Color(0xCCFFFFFF), Color(0x66FFFFFF), Colors.transparent]),
                  boxShadow: [BoxShadow(color: Colors.white.withAlpha(80), blurRadius: 20, spreadRadius: 2)],
                ),
              ),
            );
          },
        ),
        // Bounding boxes
        Positioned(
          top: MediaQuery.of(context).size.height * 0.32,
          left: MediaQuery.of(context).size.width * 0.15,
          child: _BoundingBox(label: 'Roma Tomato', match: '98%'),
        ),
        Positioned(
          top: MediaQuery.of(context).size.height * 0.52,
          right: MediaQuery.of(context).size.width * 0.2,
          child: _BoundingBox(label: 'Farm Egg', match: '95%'),
        ),
        // Top bar
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              GestureDetector(
                onTap: () => Navigator.of(context).canPop() ? context.pop() : context.go('/'),
                child: Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(color: const Color(0x99FFFFFF), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0x80FFFFFF))),
                  child: const Icon(Icons.close, color: AppColors.textPrimary, size: 20),
                ),
              ),
              const Text('Scan Ingredients', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white, shadows: [Shadow(color: Colors.black54, blurRadius: 8)])),
              const SizedBox(width: 40),
            ]),
          ),
        ),
        // Bottom panel
        Positioned(
          bottom: 0, left: 0, right: 0,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(color: const Color(0x99FFFFFF), borderRadius: BorderRadius.circular(20)),
                  child: const Text('Position ingredients within frame', style: TextStyle(fontSize: 13, color: AppColors.textPrimary)),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(color: const Color(0x99FFFFFF), borderRadius: BorderRadius.circular(28), border: Border.all(color: const Color(0x33FFFFFF))),
                  child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    _ActionBtn(icon: Icons.flash_on),
                    GestureDetector(
                      onTap: () => Navigator.of(context).canPop() ? context.pop() : context.go('/'),
                      child: Container(
                        width: 80, height: 80,
                        decoration: BoxDecoration(color: const Color(0xE6FFFFFF), shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 4), boxShadow: [BoxShadow(color: Colors.white.withAlpha(50), blurRadius: 20, spreadRadius: 2)]),
                        child: Center(
                          child: Container(width: 64, height: 64, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: const Color(0x33000000))), child: const Icon(Icons.center_focus_strong, size: 36, color: AppColors.textPrimary)),
                        ),
                      ),
                    ),
                    _ActionBtn(icon: Icons.photo_library),
                  ]),
                ),
              ]),
            ),
          ),
        ),
      ]),
    );
  }
}

class _BoundingBox extends StatelessWidget {
  final String label, match;
  const _BoundingBox({required this.label, required this.match});
  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Container(
        width: 96, height: 96,
        decoration: BoxDecoration(border: Border.all(color: const Color(0xB3FFFFFF), width: 2), borderRadius: BorderRadius.circular(12)),
        child: Stack(children: const [
          Positioned(top: -1, left: -1, child: _Corner(isTop: true, isLeft: true)),
          Positioned(top: -1, right: -1, child: _Corner(isTop: true, isLeft: false)),
          Positioned(bottom: -1, left: -1, child: _Corner(isTop: false, isLeft: true)),
          Positioned(bottom: -1, right: -1, child: _Corner(isTop: false, isLeft: false)),
        ]),
      ),
      const SizedBox(height: 8),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(color: const Color(0x99FFFFFF), borderRadius: BorderRadius.circular(20)),
        child: Column(children: [
          Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
          Text('$match Match', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        ]),
      ),
    ]);
  }
}

class _Corner extends StatelessWidget {
  final bool isTop, isLeft;
  const _Corner({required this.isTop, required this.isLeft});
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 12, height: 12,
      decoration: BoxDecoration(
        border: Border(
          top: isTop ? const BorderSide(color: Colors.white, width: 2) : BorderSide.none,
          left: isLeft ? const BorderSide(color: Colors.white, width: 2) : BorderSide.none,
          bottom: !isTop ? const BorderSide(color: Colors.white, width: 2) : BorderSide.none,
          right: !isLeft ? const BorderSide(color: Colors.white, width: 2) : BorderSide.none,
        ),
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  const _ActionBtn({required this.icon});
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48, height: 48,
      decoration: BoxDecoration(color: const Color(0x99FFFFFF), borderRadius: BorderRadius.circular(24)),
      child: Icon(icon, color: AppColors.textPrimary),
    );
  }
}
