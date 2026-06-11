import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:go_router/go_router.dart';

import '../../../config/theme.dart';
import '../../../models/home_content.dart';
import '../../../models/post.dart';
import '../../../models/recipe.dart';
import '../../../providers/home_provider.dart';
import '../../../widgets/post_card.dart';
import '../../../widgets/recipe_card.dart';

class HomeFeed extends ConsumerStatefulWidget {
  final HomeTabConfig tab;
  final List<String> categories;
  final bool showBanner;
  final List<HomeBanner> banners;
  final ValueChanged<HomeBanner>? onBannerTap;

  const HomeFeed({
    super.key,
    required this.tab,
    this.categories = const [],
    this.showBanner = false,
    this.banners = const [],
    this.onBannerTap,
  });

  @override
  ConsumerState<HomeFeed> createState() => _HomeFeedState();
}

class _HomeFeedState extends ConsumerState<HomeFeed>
    with AutomaticKeepAliveClientMixin {
  final _scrollController = ScrollController();
  final _bannerController = PageController();
  Timer? _bannerTimer;
  int _bannerIndex = 0;
  String? _selectedCategory;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _syncBannerTimer();
    Future.microtask(() {
      ref.read(homeFeedProvider(_effectiveTab).notifier).ensureLoaded();
    });
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent - 360) {
      ref.read(homeFeedProvider(_effectiveTab).notifier).loadMore();
    }
  }

  @override
  void didUpdateWidget(covariant HomeFeed oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.showBanner != widget.showBanner ||
        oldWidget.banners.length != widget.banners.length) {
      if (_bannerIndex >= widget.banners.length) {
        _bannerIndex = 0;
      }
      _syncBannerTimer();
    }
    if (widget.tab.type != HomeTabType.category) return;
    if (widget.categories.isEmpty) {
      _selectedCategory = null;
      return;
    }
    if (_selectedCategory == null ||
        !widget.categories.contains(_selectedCategory)) {
      _selectedCategory = widget.categories.first;
      Future.microtask(() {
        ref.read(homeFeedProvider(_effectiveTab).notifier).ensureLoaded();
      });
    }
  }

  void _syncBannerTimer() {
    _bannerTimer?.cancel();
    _bannerTimer = null;
    if (!widget.showBanner || widget.banners.length <= 1) return;
    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || !_bannerController.hasClients) return;
      final nextIndex = (_bannerIndex + 1) % widget.banners.length;
      _bannerController.animateToPage(
        nextIndex,
        duration: const Duration(milliseconds: 360),
        curve: Curves.easeOut,
      );
    });
  }

  HomeTabConfig get _effectiveTab {
    if (widget.tab.type == HomeTabType.category &&
        widget.categories.isNotEmpty) {
      return categoryTab(_selectedCategory ?? widget.categories.first);
    }
    return widget.tab;
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _bannerTimer?.cancel();
    _scrollController.dispose();
    _bannerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final effectiveTab = _effectiveTab;
    final state = ref.watch(homeFeedProvider(effectiveTab));

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 280),
      switchInCurve: Curves.easeOut,
      switchOutCurve: Curves.easeOut,
      child: RefreshIndicator(
        key: ValueKey(effectiveTab.key),
        onRefresh: () =>
            ref.read(homeFeedProvider(effectiveTab).notifier).refresh(),
        child: CustomScrollView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            if (widget.showBanner && widget.banners.isNotEmpty)
              SliverToBoxAdapter(child: _buildBannerCarousel()),
            if (widget.tab.type == HomeTabType.category)
              SliverToBoxAdapter(child: _buildCategorySelector()),
            if (widget.tab.type == HomeTabType.local)
              const SliverToBoxAdapter(child: _LocalNotice()),
            if (!state.hasLoaded && state.isLoading)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: CircularProgressIndicator()),
              )
            else if (state.items.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: _EmptyFeed(tab: effectiveTab, error: state.error),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                sliver: SliverMasonryGrid.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childCount: state.items.length + (state.isLoading ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index >= state.items.length) {
                      return const Padding(
                        padding: EdgeInsets.all(16),
                        child: Center(child: CircularProgressIndicator()),
                      );
                    }
                    final item = state.items[index];
                    if (item is Recipe) {
                      return RecipeCard(
                        recipe: item,
                        onTap: () => context.push('/recipe/${item.id}'),
                      );
                    }
                    if (item is Post) {
                      return PostCard(
                        post: item,
                        onTap: () => context.push('/post/${item.id}'),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildBannerCarousel() {
    return Column(
      children: [
        const SizedBox(height: 12),
        SizedBox(
          height: 160,
          child: PageView.builder(
            controller: _bannerController,
            onPageChanged: (index) => setState(() => _bannerIndex = index),
            itemCount: widget.banners.length,
            itemBuilder: (context, index) {
              final banner = widget.banners[index];
              return GestureDetector(
                onTap: () => widget.onBannerTap?.call(banner),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (banner.imageUrl.isNotEmpty)
                        CachedNetworkImage(
                          imageUrl: banner.imageUrl,
                          fit: BoxFit.cover,
                          errorWidget: (_, _, _) =>
                              _BannerFallback(title: banner.title),
                        )
                      else
                        _BannerFallback(title: banner.title),
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Color(0x00000000), Color(0x99000000)],
                          ),
                        ),
                      ),
                      Positioned(
                        left: 18,
                        right: 18,
                        bottom: 16,
                        child: Text(
                          banner.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            widget.banners.length,
            (index) => Container(
              width: 6,
              height: 6,
              margin: const EdgeInsets.symmetric(horizontal: 3),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: index == _bannerIndex % widget.banners.length
                    ? AppColors.textPrimary
                    : AppColors.divider,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCategorySelector() {
    if (widget.categories.isEmpty) {
      return const SizedBox.shrink();
    }

    final selected = _selectedCategory ?? widget.categories.first;
    return Container(
      height: 48,
      color: AppColors.background,
      alignment: Alignment.centerLeft,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: widget.categories.length,
        separatorBuilder: (_, _) => const SizedBox(width: 18),
        itemBuilder: (context, index) {
          final category = widget.categories[index];
          final active = category == selected;
          return GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () {
              setState(() => _selectedCategory = category);
              ref
                  .read(homeFeedProvider(categoryTab(category)).notifier)
                  .ensureLoaded();
            },
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  category,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                    color: active
                        ? AppColors.textPrimary
                        : AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 5),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  curve: Curves.easeOut,
                  width: active ? 18 : 0,
                  height: 2,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF6B35),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _BannerFallback extends StatelessWidget {
  final String title;

  const _BannerFallback({required this.title});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surfaceSecondary,
      alignment: Alignment.center,
      padding: const EdgeInsets.all(20),
      child: Text(
        title,
        textAlign: TextAlign.center,
        style: Theme.of(
          context,
        ).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary),
      ),
    );
  }
}

class _LocalNotice extends StatelessWidget {
  const _LocalNotice();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Text(
        '同城内容暂未开放，位置服务接入后会展示附近菜谱和帖子。',
        style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
      ),
    );
  }
}

class _EmptyFeed extends StatelessWidget {
  final HomeTabConfig tab;
  final String? error;

  const _EmptyFeed({required this.tab, this.error});

  @override
  Widget build(BuildContext context) {
    final message = error != null
        ? '加载失败，向下拉动可重试'
        : switch (tab.type) {
            HomeTabType.following => '关注的人还没有发布内容',
            HomeTabType.hot => '本周暂无热门菜谱',
            HomeTabType.category => '这个分类暂时没有内容',
            HomeTabType.local => '附近内容暂未开放',
            HomeTabType.recommend => '暂无推荐内容',
          };

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
        ),
      ),
    );
  }
}
