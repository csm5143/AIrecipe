import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../config/glass_theme.dart';
import '../config/theme.dart';
import '../providers/navigation_provider.dart';

/// 发布 BottomSheet：半透明遮罩 + 液体玻璃面板 + 三项操作 + staggered 动画 + 导航
class PublishSheet extends ConsumerStatefulWidget {
  const PublishSheet({super.key});
  @override
  ConsumerState<PublishSheet> createState() => _PublishSheetState();
}

class _PublishSheetState extends ConsumerState<PublishSheet> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _fadeAnim;
  late final List<Animation<double>> _itemAnims;

  static const _actions = [
    _PublishAction(icon: Icons.qr_code_scanner, label: '拍照识别', color: Color(0xFF3B82F6), route: '/publish/scan'),
    _PublishAction(icon: Icons.edit_document, label: '发帖子', color: AppColors.textPrimary, isMain: true, route: '/publish/post'),
    _PublishAction(icon: Icons.restaurant_menu_rounded, label: '上传菜谱', color: AppColors.accent, route: '/publish/recipe'),
  ];

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));
    _fadeAnim = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _itemAnims = List.generate(3, (i) => CurvedAnimation(
      parent: _ctrl,
      curve: Interval(0.2 + i * 0.1, 1.0, curve: Curves.easeOutCubic),
    ));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _close() {
    _ctrl.reverse().then((_) {
      if (mounted) ref.read(isPublishSheetOpenProvider.notifier).state = false;
    });
  }

  void _navigate(String route) {
    _close();
    // Delay navigation until sheet closes
    Future.delayed(const Duration(milliseconds: 400), () {
      if (mounted) context.go(route);
    });
  }

  @override
  Widget build(BuildContext context) {
    final isOpen = ref.watch(isPublishSheetOpenProvider);

    if (isOpen) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_ctrl.status != AnimationStatus.forward && _ctrl.status != AnimationStatus.completed) {
          _ctrl.forward();
        }
      });
    }

    if (!isOpen && _ctrl.status == AnimationStatus.dismissed) {
      return const SizedBox.shrink();
    }

    return AnimatedBuilder(
      animation: _fadeAnim,
      builder: (context, child) {
        return Stack(
          children: [
            // 半透明遮罩
            Positioned.fill(
              child: GestureDetector(
                onTap: _close,
                child: Container(color: Color.fromRGBO(0, 0, 0, 0.2 * _fadeAnim.value))),
            ),
            // 液体玻璃面板
            Positioned(
              left: 0, right: 0, bottom: 0,
              child: Transform.translate(
                offset: Offset(0, (1 - _fadeAnim.value) * 200),
                child: Container(
                  padding: EdgeInsets.only(
                    top: 32, left: 24, right: 24,
                    bottom: 32 + MediaQuery.of(context).padding.bottom + 80,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.glassSurface,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                    border: Border(top: BorderSide(color: GlassTheme.borderColor)),
                    boxShadow: const [BoxShadow(color: Color(0x14000000), blurRadius: 32, offset: Offset(0, -8))],
                  ),
                  child: ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 40, sigmaY: 40),
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Container(width: 36, height: 4, decoration: BoxDecoration(color: const Color(0x33000000), borderRadius: BorderRadius.circular(2))),
                        const SizedBox(height: 28),
                        Opacity(
                          opacity: _fadeAnim.value.clamp(0.0, 1.0),
                          child: Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: List.generate(3, (i) {
                            return FadeTransition(
                              opacity: _itemAnims[i],
                              child: SlideTransition(
                                position: Tween<Offset>(begin: const Offset(0, 0.5), end: Offset.zero).animate(_itemAnims[i]),
                                child: _ActionButton(
                                  action: _actions[i],
                                  onTap: () => _navigate(_actions[i].route),
                                ),
                              ),
                            );
                          })),
                        ),
                      ]),
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _PublishAction {
  final IconData icon;
  final String label;
  final Color color;
  final bool isMain;
  final String route;
  const _PublishAction({required this.icon, required this.label, required this.color, this.isMain = false, required this.route});
}

class _ActionButton extends StatelessWidget {
  final _PublishAction action;
  final VoidCallback onTap;
  const _ActionButton({required this.action, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final size = action.isMain ? 72.0 : 60.0;
    return GestureDetector(
      onTap: onTap,
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: size, height: size,
          decoration: BoxDecoration(
            color: action.isMain ? AppColors.textPrimary : AppColors.surface,
            borderRadius: BorderRadius.circular(action.isMain ? 24 : 20),
            boxShadow: [BoxShadow(color: action.isMain ? const Color(0x33000000) : const Color(0x0F000000), blurRadius: action.isMain ? 24 : 20, offset: const Offset(0, 4))],
            border: Border.all(color: GlassTheme.borderColor),
          ),
          child: Icon(action.icon, color: action.isMain ? AppColors.surface : action.color, size: action.isMain ? 32 : 28),
        ),
        const SizedBox(height: 12),
        Text(action.label, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: action.isMain ? AppColors.textPrimary : AppColors.textSecondary)),
      ]),
    );
  }
}
