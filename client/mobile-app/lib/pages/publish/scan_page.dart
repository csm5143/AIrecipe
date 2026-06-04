import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../widgets/capsule_toast.dart';

class ScanPage extends StatefulWidget {
  const ScanPage({super.key});

  @override
  State<ScanPage> createState() => _ScanPageState();
}

class _ScanPageState extends State<ScanPage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _scanCtrl;
  bool _hasScanned = false;

  static const _detectedItems = [
    _DetectedIngredient('番茄', '2 个', '98%', Icons.local_pizza_outlined),
    _DetectedIngredient('鸡蛋', '4 个', '95%', Icons.egg_alt_outlined),
    _DetectedIngredient('生菜', '1 棵', '92%', Icons.eco_outlined),
  ];

  @override
  void initState() {
    super.initState();
    _scanCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _scanCtrl.dispose();
    super.dispose();
  }

  void _capture() {
    setState(() => _hasScanned = true);
    showCapsuleToast(context, '已识别 3 种食材', icon: Icons.auto_awesome);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          Positioned.fill(
            child: Image.network(
              'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&q=80',
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFFE7F0E8), Color(0xFFF7E7D7)],
                  ),
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withAlpha(120),
                    Colors.transparent,
                    Colors.black.withAlpha(150),
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  _GlassIconButton(
                    icon: Icons.close,
                    onTap: () => Navigator.of(context).canPop()
                        ? context.pop()
                        : context.go('/'),
                  ),
                  const Spacer(),
                  const Text(
                    '拍照识别食材',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      shadows: [Shadow(color: Colors.black45, blurRadius: 10)],
                    ),
                  ),
                  const Spacer(),
                  _GlassIconButton(
                    icon: Icons.help_outline,
                    onTap: () => showCapsuleToast(context, '请让食材完整出现在取景框内'),
                  ),
                ],
              ),
            ),
          ),
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: AspectRatio(
                aspectRatio: 0.82,
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(28),
                          border: Border.all(
                            color: const Color(0xCCFFFFFF),
                            width: 1.4,
                          ),
                        ),
                      ),
                    ),
                    const Positioned(top: 0, left: 0, child: _FrameCorner()),
                    const Positioned(
                      top: 0,
                      right: 0,
                      child: _FrameCorner(turns: 1),
                    ),
                    const Positioned(
                      bottom: 0,
                      right: 0,
                      child: _FrameCorner(turns: 2),
                    ),
                    const Positioned(
                      bottom: 0,
                      left: 0,
                      child: _FrameCorner(turns: 3),
                    ),
                    AnimatedBuilder(
                      animation: _scanCtrl,
                      builder: (context, _) {
                        return Positioned(
                          left: 18,
                          right: 18,
                          top: 26 + _scanCtrl.value * 430,
                          child: Container(
                            height: 2,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  Colors.white,
                                  Colors.transparent,
                                ],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.white.withAlpha(120),
                                  blurRadius: 18,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                    if (_hasScanned) ...[
                      const Positioned(
                        left: 52,
                        top: 104,
                        child: _DetectBox(label: '番茄', confidence: '98%'),
                      ),
                      const Positioned(
                        right: 44,
                        top: 238,
                        child: _DetectBox(label: '鸡蛋', confidence: '95%'),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 260),
                    child: _hasScanned
                        ? _ResultPanel(
                            key: const ValueKey('result'),
                            items: _detectedItems,
                            onAdd: () => showCapsuleToast(
                              context,
                              '已加入小冰箱',
                              icon: Icons.kitchen_outlined,
                            ),
                            onRecipe: () => context.push('/ai/chat'),
                          )
                        : const _HintPill(
                            key: ValueKey('hint'),
                            text: '将食材放入取景框，点击快门开始识别',
                          ),
                  ),
                  const SizedBox(height: 14),
                  _CaptureBar(
                    hasScanned: _hasScanned,
                    onFlash: () => showCapsuleToast(context, '闪光灯已切换'),
                    onCapture: _capture,
                    onAlbum: () => showCapsuleToast(context, '相册选择稍后接入'),
                    onReset: () => setState(() => _hasScanned = false),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GlassIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _GlassIconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0x99FFFFFF),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0x66FFFFFF)),
            ),
            child: Icon(icon, color: AppColors.textPrimary, size: 20),
          ),
        ),
      ),
    );
  }
}

class _FrameCorner extends StatelessWidget {
  final int turns;

  const _FrameCorner({this.turns = 0});

  @override
  Widget build(BuildContext context) {
    return RotatedBox(
      quarterTurns: turns,
      child: SizedBox(
        width: 44,
        height: 44,
        child: DecoratedBox(
          decoration: BoxDecoration(
            border: const Border(
              top: BorderSide(color: Colors.white, width: 4),
              left: BorderSide(color: Colors.white, width: 4),
            ),
            borderRadius: const BorderRadius.only(topLeft: Radius.circular(28)),
            boxShadow: [
              BoxShadow(color: Colors.white.withAlpha(80), blurRadius: 12),
            ],
          ),
        ),
      ),
    );
  }
}

class _DetectBox extends StatelessWidget {
  final String label;
  final String confidence;

  const _DetectBox({required this.label, required this.confidence});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 92,
          height: 92,
          decoration: BoxDecoration(
            border: Border.all(color: Colors.white, width: 2),
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: const Color(0xE6FFFFFF),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Text(
            '$label · $confidence',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}

class _HintPill extends StatelessWidget {
  final String text;

  const _HintPill({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
      decoration: BoxDecoration(
        color: const Color(0xE6FFFFFF),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
      ),
    );
  }
}

class _ResultPanel extends StatelessWidget {
  final List<_DetectedIngredient> items;
  final VoidCallback onAdd;
  final VoidCallback onRecipe;

  const _ResultPanel({
    super.key,
    required this.items,
    required this.onAdd,
    required this.onRecipe,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 26, sigmaY: 26),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xEFFFFFFF),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0x1AFFFFFF)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.auto_awesome,
                    size: 18,
                    color: AppColors.accent,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '识别结果',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${items.length} 种食材',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ...items.map((item) => _IngredientRow(item: item)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onAdd,
                      icon: const Icon(Icons.kitchen_outlined, size: 18),
                      label: const Text('加入冰箱'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.textPrimary,
                        side: const BorderSide(color: AppColors.divider),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: onRecipe,
                      icon: const Icon(Icons.auto_awesome, size: 18),
                      label: const Text('生成菜谱'),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.textPrimary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _IngredientRow extends StatelessWidget {
  final _DetectedIngredient item;

  const _IngredientRow({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: AppColors.surfaceSecondary,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(item.icon, size: 18, color: AppColors.textPrimary),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              item.name,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
            ),
          ),
          Text(
            item.amount,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(width: 12),
          Text(
            item.confidence,
            style: const TextStyle(fontSize: 12, color: AppColors.accentBlue),
          ),
        ],
      ),
    );
  }
}

class _CaptureBar extends StatelessWidget {
  final bool hasScanned;
  final VoidCallback onFlash;
  final VoidCallback onCapture;
  final VoidCallback onAlbum;
  final VoidCallback onReset;

  const _CaptureBar({
    required this.hasScanned,
    required this.onFlash,
    required this.onCapture,
    required this.onAlbum,
    required this.onReset,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xCCFFFFFF),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: const Color(0x33FFFFFF)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _RoundToolButton(
                icon: hasScanned ? Icons.refresh : Icons.flash_on,
                onTap: hasScanned ? onReset : onFlash,
              ),
              GestureDetector(
                onTap: onCapture,
                child: Container(
                  width: 78,
                  height: 78,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 4),
                    boxShadow: const [
                      BoxShadow(color: Color(0x24000000), blurRadius: 20),
                    ],
                  ),
                  child: Center(
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      width: hasScanned ? 48 : 60,
                      height: hasScanned ? 48 : 60,
                      decoration: BoxDecoration(
                        color: hasScanned
                            ? AppColors.textPrimary
                            : Colors.transparent,
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0x33000000)),
                      ),
                      child: Icon(
                        hasScanned ? Icons.check : Icons.center_focus_strong,
                        color: hasScanned
                            ? Colors.white
                            : AppColors.textPrimary,
                        size: 30,
                      ),
                    ),
                  ),
                ),
              ),
              _RoundToolButton(
                icon: Icons.photo_library_outlined,
                onTap: onAlbum,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoundToolButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _RoundToolButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: const Color(0x80FFFFFF),
          borderRadius: BorderRadius.circular(24),
        ),
        child: Icon(icon, color: AppColors.textPrimary),
      ),
    );
  }
}

class _DetectedIngredient {
  final String name;
  final String amount;
  final String confidence;
  final IconData icon;

  const _DetectedIngredient(this.name, this.amount, this.confidence, this.icon);
}
