import 'package:flutter/material.dart';

import '../../../config/theme.dart';
import '../../../providers/home_provider.dart';

class HomeTabBar extends StatefulWidget {
  final List<HomeTabConfig> tabs;
  final int currentIndex;
  final ValueChanged<int> onTap;

  const HomeTabBar({
    super.key,
    required this.tabs,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  State<HomeTabBar> createState() => _HomeTabBarState();
}

class _HomeTabBarState extends State<HomeTabBar> {
  final _scrollController = ScrollController();
  final _keys = <GlobalKey>[];

  @override
  void initState() {
    super.initState();
    _syncKeys();
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => _scrollSelectedIntoView(),
    );
  }

  @override
  void didUpdateWidget(covariant HomeTabBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncKeys();
    if (oldWidget.currentIndex != widget.currentIndex ||
        oldWidget.tabs.length != widget.tabs.length) {
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => _scrollSelectedIntoView(),
      );
    }
  }

  void _syncKeys() {
    while (_keys.length < widget.tabs.length) {
      _keys.add(GlobalKey());
    }
    if (_keys.length > widget.tabs.length) {
      _keys.removeRange(widget.tabs.length, _keys.length);
    }
  }

  void _scrollSelectedIntoView() {
    if (!_scrollController.hasClients ||
        widget.currentIndex < 0 ||
        widget.currentIndex >= _keys.length) {
      return;
    }
    final context = _keys[widget.currentIndex].currentContext;
    if (context == null) return;
    Scrollable.ensureVisible(
      context,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOut,
      alignment: 0.5,
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 40,
      color: AppColors.surface,
      child: ListView.separated(
        controller: _scrollController,
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: widget.tabs.length,
        separatorBuilder: (_, _) => const SizedBox(width: 24),
        itemBuilder: (context, index) {
          final selected = index == widget.currentIndex;
          return GestureDetector(
            key: _keys[index],
            behavior: HitTestBehavior.opaque,
            onTap: () => widget.onTap(index),
            child: SizedBox(
              height: 40,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Expanded(
                    child: Center(
                      child: AnimatedDefaultTextStyle(
                        duration: const Duration(milliseconds: 180),
                        curve: Curves.easeOut,
                        style: TextStyle(
                          fontSize: 15,
                          height: 1,
                          color: selected
                              ? AppColors.textPrimary
                              : AppColors.textSecondary,
                          fontWeight: selected
                              ? FontWeight.w600
                              : FontWeight.w400,
                        ),
                        child: Text(widget.tabs[index].label),
                      ),
                    ),
                  ),
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    curve: Curves.easeOut,
                    width: selected ? 22 : 0,
                    height: 2,
                    decoration: BoxDecoration(
                      color: AppColors.accent,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
