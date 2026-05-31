import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../providers/navigation_provider.dart';
import 'publish_sheet.dart';

/// Apple Dynamic Island 风格底部悬浮导航栏
class GlassBottomNavBar extends ConsumerStatefulWidget {
  final String currentLocation;
  const GlassBottomNavBar({super.key, required this.currentLocation});
  @override
  ConsumerState<GlassBottomNavBar> createState() => _GlassBottomNavBarState();
}

class _GlassBottomNavBarState extends ConsumerState<GlassBottomNavBar>
    with SingleTickerProviderStateMixin {
  late final AnimationController _bounceCtrl;
  late final Animation<double> _bounceAnim;

  static const _tabPaths = ['/', '/ai', '', '/collection', '/mine'];
  static const _tabIcons = [
    Icons.home_rounded, Icons.smart_toy_rounded, Icons.add_rounded,
    Icons.bookmarks_rounded, Icons.person_rounded,
  ];

  int get _activeIndex {
    final loc = widget.currentLocation;
    if (loc == '/') return 0;
    if (loc.startsWith('/ai')) return 1;
    if (loc.startsWith('/collection')) return 3;
    if (loc.startsWith('/mine')) return 4;
    return 0;
  }

  @override
  void initState() {
    super.initState();
    _bounceCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _bounceAnim = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.04), weight: 12),
      TweenSequenceItem(tween: Tween(begin: 1.04, end: 0.98), weight: 28),
      TweenSequenceItem(tween: Tween(begin: 0.98, end: 1.012), weight: 30),
      TweenSequenceItem(tween: Tween(begin: 1.012, end: 0.995), weight: 20),
      TweenSequenceItem(tween: Tween(begin: 0.995, end: 1.0), weight: 10),
    ]).animate(CurvedAnimation(parent: _bounceCtrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _bounceCtrl.dispose();
    super.dispose();
  }

  void _triggerBounce() {
    _bounceCtrl.reset();
    _bounceCtrl.forward();
  }

  void _navigateTo(int index) {
    if (index == 2) {
      _triggerBounce();
      ref.read(isPublishSheetOpenProvider.notifier).state = true;
      return;
    }
    final path = _tabPaths[index];
    if (path.isNotEmpty && path != widget.currentLocation) {
      _triggerBounce();
      HapticFeedback.lightImpact();
      context.go(path);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOpen = ref.watch(isPublishSheetOpenProvider);
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    final totalWidth = MediaQuery.of(context).size.width - 64; // margin left+right

    return AnimatedBuilder(
      animation: _bounceAnim,
      builder: (context, child) {
        return Transform.scale(scale: _bounceAnim.value, child: child);
      },
      child: GestureDetector(
        behavior: HitTestBehavior.translucent,
        // ── 点击：根据位置判断点击哪个 item ──
        onTapUp: (details) {
          final itemWidth = totalWidth / 5;
          final index = (details.localPosition.dx / itemWidth).floor().clamp(0, 4);
          _navigateTo(index);
        },
        // ── 左右滑动切换 ──
        onHorizontalDragEnd: (details) {
          if (details.primaryVelocity == null) return;
          final v = details.primaryVelocity!;
          if (v > 200) {
            // 向右滑 → 上一个 tab，跳过中间的 +
            var prev = (_activeIndex - 1).clamp(0, 4);
            if (prev == 2) prev = 1;
            _navigateTo(prev);
          } else if (v < -200) {
            // 向左滑 → 下一个 tab
            var next = (_activeIndex + 1).clamp(0, 4);
            if (next == 2) next = 3;
            _navigateTo(next);
          }
        },
        child: Container(
          margin: EdgeInsets.only(left: 32, right: 32, bottom: 6 + bottomPadding),
          height: 56,
          decoration: BoxDecoration(
            // 极淡的背景 — 让内容透过
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                const Color(0x25FFFFFF), // 顶部：非常淡
                const Color(0x18FFFFFF), // 底部：几乎透明
              ],
            ),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: const Color(0x1AFFFFFF), width: 0.6),
            boxShadow: [
              BoxShadow(color: const Color(0xFF1C1C1E).withAlpha(10), blurRadius: 40, offset: const Offset(0, 8)),
              const BoxShadow(color: Color(0x1AFFFFFF), blurRadius: 0, offset: Offset(0, 0.5)),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
              child: Row(children: List.generate(5, (i) {
                final active = i == _activeIndex || (i == 2 && isOpen);
                final isCenter = i == 2;
                return Expanded(
                  child: Center(
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 350),
                      curve: Curves.easeOutCubic,
                      width: isCenter && !active ? 40 : (isCenter && active ? 36 : 38),
                      height: isCenter && !active ? 40 : (isCenter && active ? 36 : 38),
                      decoration: BoxDecoration(
                        color: active
                            ? (isCenter ? AppColors.surface : AppColors.textPrimary)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(isCenter ? 20 : 19),
                        boxShadow: active && !isCenter
                            ? [BoxShadow(color: const Color(0xFF000000).withAlpha(12), blurRadius: 8, offset: const Offset(0, 2))]
                            : null,
                      ),
                      child: AnimatedRotation(
                        turns: isCenter && active ? 0.125 : 0,
                        duration: const Duration(milliseconds: 350),
                        curve: Curves.easeOutCubic,
                        child: Icon(
                          isCenter && active ? Icons.close_rounded : _tabIcons[i],
                          color: active
                              ? (isCenter ? AppColors.textPrimary : AppColors.surface)
                              : AppColors.textSecondary.withAlpha(160),
                          size: isCenter ? 24 : 22,
                        ),
                      ),
                    ),
                  ),
                );
              })),
            ),
          ),
        ),
      ),
    );
  }
}
/// Shell Scaffold — 页面滑动过渡
class GlassScaffoldWithNav extends ConsumerWidget {
  final Widget body;
  final String currentLocation;
  const GlassScaffoldWithNav({super.key, required this.body, required this.currentLocation});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Stack(
      children: [
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 280),
          switchInCurve: Curves.easeOut,
          switchOutCurve: Curves.easeIn,
          transitionBuilder: (child, animation) {
            return SlideTransition(
              position: Tween<Offset>(begin: const Offset(0.06, 0), end: Offset.zero).animate(animation),
              child: FadeTransition(opacity: animation, child: child),
            );
          },
          child: body,
        ),
        Positioned(left: 0, right: 0, bottom: 0, child: GlassBottomNavBar(currentLocation: currentLocation)),
        const PublishSheet(),
      ],
    );
  }
}
