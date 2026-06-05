import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../config/glass_theme.dart';
import '../../models/home_content.dart';
import '../../models/recipe.dart';
import '../../models/post.dart';
import '../../models/notification_item.dart';
import '../../providers/home_provider.dart';
import '../../providers/recipe_provider.dart';
import '../../providers/collection_provider.dart';
import '../../data/api/auth_storage.dart';
import '../../widgets/recipe_card.dart';
import '../../widgets/post_card.dart';
import '../../widgets/search_bar.dart';

/// 首页: 搜索 + 分类 Pill + Banner 自动轮播 + 瀑布流混合 Feed + 通知预览面板
class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});
  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  final _pageCtrl = PageController();
  final _searchController = TextEditingController();
  final _searchFocusNode = FocusNode();
  int _bannerIndex = 0;
  bool _showNotificationPanel = false;
  bool _showSearchPanel = false;
  bool _menuOpen = false;
  int _activeFilter = 0;
  List<String> _searchHistory = [];

  static const _fallbackBanners = [
    HomeBanner(id: 'default-banner-1', title: '发现今天要做的菜'),
    HomeBanner(id: 'default-banner-2', title: '用小厨子整理你的冰箱灵感'),
  ];

  String get _searchQuery => _searchController.text.trim();

  @override
  void initState() {
    super.initState();
    _searchFocusNode.addListener(() {
      if (mounted) {
        setState(() => _showSearchPanel = _searchFocusNode.hasFocus);
      }
    });
    _startBannerAutoScroll();
    _loadSearchHistory();
  }

  Future<void> _loadSearchHistory() async {
    final history = await AuthStorage.getSearchHistory();
    if (mounted) setState(() => _searchHistory = history);
  }

  void _startBannerAutoScroll() {
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) {
        final count = _currentBannerCount();
        if (count > 1) {
          _bannerIndex = (_bannerIndex + 1) % count;
          if (_pageCtrl.hasClients) {
            _pageCtrl.animateToPage(
              _bannerIndex,
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeInOut,
            );
          }
        }
        _startBannerAutoScroll();
      }
    });
  }

  int _currentBannerCount() {
    final banners = ref.read(homeContentProvider).valueOrNull?.banners;
    return (banners?.isNotEmpty ?? false)
        ? banners!.length
        : _fallbackBanners.length;
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final recipes = ref.watch(recipeListProvider);
    final homeContent = ref.watch(homeContentProvider).valueOrNull;
    final notifications =
        ref.watch(notificationListProvider).valueOrNull ??
        const <NotificationItem>[];
    final posts = ref.watch(postListProvider).valueOrNull ?? const <Post>[];
    final displayRecipes = recipes.isNotEmpty
        ? recipes
        : homeContent?.latestRecipes ?? const <Recipe>[];
    final banners = homeContent?.banners.isNotEmpty == true
        ? homeContent!.banners
        : _fallbackBanners;
    final categories =
        homeContent?.categories
            .map((category) => category.name)
            .where((name) => name.isNotEmpty)
            .toList() ??
        const <String>[];
    final filterPills = ['为你推荐', ...categories.take(7)];
    final activeFilter = _activeFilter < filterPills.length ? _activeFilter : 0;
    final hotSearches = _homeHotSearches(categories, displayRecipes);
    final feedItems = _buildFeedItems(displayRecipes, posts);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Stack(
          children: [
            NestedScrollView(
              headerSliverBuilder: (context, innerBoxIsScrolled) => [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 顶栏
                        Row(
                          children: [
                            GestureDetector(
                              onTap: () => setState(() {
                                _menuOpen = !_menuOpen;
                                _showSearchPanel = false;
                                _searchFocusNode.unfocus();
                              }),
                              child: const Icon(
                                Icons.menu,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: GlassSearchBar(
                                controller: _searchController,
                                focusNode: _searchFocusNode,
                                onTap: () {
                                  setState(() {
                                    _showSearchPanel = true;
                                    _menuOpen = false;
                                    _showNotificationPanel = false;
                                  });
                                  _searchFocusNode.requestFocus();
                                },
                                onChanged: (_) =>
                                    setState(() => _showSearchPanel = true),
                                onSubmitted: _openSearchResults,
                              ),
                            ),
                            const SizedBox(width: 12),
                            GestureDetector(
                              onTap: () => setState(() {
                                _showNotificationPanel =
                                    !_showNotificationPanel;
                                _showSearchPanel = false;
                                _searchFocusNode.unfocus();
                              }),
                              child: const Icon(
                                Icons.notifications_outlined,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // 分类 Pill
                        SizedBox(
                          height: 40,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: filterPills.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(width: 10),
                            itemBuilder: (ctx, i) {
                              final active = i == activeFilter;
                              return GestureDetector(
                                onTap: () => _selectCategory(i, filterPills),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                    vertical: 10,
                                  ),
                                  decoration: BoxDecoration(
                                    color: active
                                        ? AppColors.textPrimary
                                        : AppColors.surface,
                                    borderRadius: BorderRadius.circular(20),
                                    border: active
                                        ? null
                                        : Border.all(
                                            color: const Color(0x0A000000),
                                          ),
                                  ),
                                  child: Text(
                                    filterPills[i],
                                    style: Theme.of(context)
                                        .textTheme
                                        .labelMedium
                                        ?.copyWith(
                                          color: active
                                              ? AppColors.surface
                                              : AppColors.textSecondary,
                                        ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ),
                // Banner 轮播
                SliverToBoxAdapter(
                  child: Column(
                    children: [
                      SizedBox(
                        height: 160,
                        child: PageView.builder(
                          controller: _pageCtrl,
                          onPageChanged: (i) => _bannerIndex = i,
                          itemCount: banners.length,
                          itemBuilder: (ctx, i) => _HomeBannerCard(
                            banner: banners[i],
                            onTap: () => _openBanner(banners[i], filterPills),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      // 指示点
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          banners.length,
                          (i) => Container(
                            width: 6,
                            height: 6,
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: i == _bannerIndex % banners.length
                                  ? AppColors.textPrimary
                                  : AppColors.divider,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 16)),
              ],
              body: RefreshIndicator(
                onRefresh: () async {
                  await Future.wait([
                    ref.refresh(homeContentProvider.future),
                    ref.read(recipeListProvider.notifier).refresh(),
                  ]);
                },
                child: MasonryGridView.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: feedItems.length,
                  itemBuilder: (context, index) {
                    final item = feedItems[index];
                    if (item is Recipe) {
                      return RecipeCard(
                        recipe: item,
                        onTap: () => context.push('/recipe/${item.id}'),
                      );
                    } else if (item is Post) {
                      return PostCard(
                        post: item,
                        onTap: () => context.push('/post/${item.id}'),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ),
            ),
            if (_showSearchPanel)
              Positioned(
                top: 64,
                left: 0,
                right: 0,
                bottom: 0,
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: _HomeSearchPanel(
                        query: _searchQuery,
                        history: _searchHistory,
                        hotSearches: hotSearches,
                        recipes: displayRecipes,
                        onKeywordTap: _useSearchKeyword,
                        onSearchTap: _openSearchResults,
                        onRecipeTap: (recipe) {
                          _hideSearchPanel();
                          context.push('/recipe/${recipe.id}');
                        },
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: _hideSearchPanel,
                        behavior: HitTestBehavior.translucent,
                      ),
                    ),
                  ],
                ),
              ),
            // 通知预览面板
            if (_showNotificationPanel)
              Positioned.fill(
                child: GestureDetector(
                  onTap: () => setState(() => _showNotificationPanel = false),
                  child: Container(color: Colors.transparent),
                ),
              ),
            if (_showNotificationPanel)
              Positioned(
                top: 56,
                right: 16,
                width: 280,
                child: Material(
                  elevation: 0,
                  color: Colors.transparent,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: GlassTheme.glassDecoration(borderRadius: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '通知',
                              style: Theme.of(context).textTheme.labelMedium
                                  ?.copyWith(fontWeight: FontWeight.w600),
                            ),
                            GestureDetector(
                              onTap: () {
                                setState(() => _showNotificationPanel = false);
                                context.push('/notifications');
                              },
                              child: Text(
                                '查看全部',
                                style: Theme.of(context).textTheme.labelSmall
                                    ?.copyWith(color: AppColors.accentBlue),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (notifications.isEmpty)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 8),
                            child: Text(
                              '暂无通知',
                              style: TextStyle(
                                fontSize: 13,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          )
                        else
                          ...notifications
                              .take(4)
                              .map(
                                (n) => Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        width: 8,
                                        height: 8,
                                        margin: const EdgeInsets.only(
                                          top: 6,
                                          right: 10,
                                        ),
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: n.isUnread
                                              ? AppColors.accentBlue
                                              : Colors.transparent,
                                        ),
                                      ),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            RichText(
                                              text: TextSpan(
                                                style: const TextStyle(
                                                  fontSize: 13,
                                                  color: AppColors.textPrimary,
                                                  height: 1.3,
                                                ),
                                                children: [
                                                  TextSpan(
                                                    text: n.fromUserName,
                                                    style: const TextStyle(
                                                      fontWeight:
                                                          FontWeight.w600,
                                                    ),
                                                  ),
                                                  TextSpan(
                                                    text:
                                                        ' ${n.action} ${n.targetName}',
                                                  ),
                                                ],
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              n.timeAgo,
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: AppColors.textSecondary,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                      ],
                    ),
                  ),
                ),
              ),
            // 汉堡菜单面板
            if (_menuOpen)
              Positioned.fill(
                child: GestureDetector(
                  onTap: () => setState(() => _menuOpen = false),
                  child: Container(color: Colors.transparent),
                ),
              ),
            if (_menuOpen)
              Positioned(
                top: 56,
                left: 16,
                child: Material(
                  color: Colors.transparent,
                  child: Container(
                    width: 200,
                    padding: const EdgeInsets.all(8),
                    decoration: GlassTheme.glassDecoration(borderRadius: 20),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _menuItem(
                          context,
                          Icons.edit_document,
                          '草稿箱',
                          '/drafts',
                        ),
                        _menuItem(context, Icons.history, '浏览历史', '/history'),
                        _menuItem(
                          context,
                          Icons.favorite_border,
                          '我的收藏',
                          '/my-collections',
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _hideSearchPanel() {
    _searchFocusNode.unfocus();
    setState(() => _showSearchPanel = false);
  }

  void _useSearchKeyword(String keyword) {
    setState(() => _showSearchPanel = false);
    Future.microtask(() {
      if (mounted) {
        context.push('/search?q=${Uri.encodeQueryComponent(keyword)}');
      }
    });
  }

  void _openSearchResults(String value) {
    final query = value.trim();
    if (query.isEmpty) return;
    _hideSearchPanel();
    AuthStorage.addSearchHistory(query);
    if (mounted) {
      setState(() {
        _searchHistory.insert(0, query);
      });
    }
    context.push('/search?q=${Uri.encodeQueryComponent(query)}');
  }

  void _selectCategory(int index, List<String> filterPills) {
    setState(() => _activeFilter = index);
    final category = index == 0 ? null : filterPills[index];
    ref.read(recipeListProvider.notifier).filterByCategory(category);
  }

  void _openBanner(HomeBanner banner, List<String> filterPills) {
    final type = banner.linkType.toLowerCase();
    final value = banner.linkValue.trim();
    if (type == 'recipe' && value.isNotEmpty) {
      context.push('/recipe/$value');
      return;
    }
    if (type == 'category' && value.isNotEmpty) {
      final index = filterPills.indexOf(value);
      if (index > 0) {
        _selectCategory(index, filterPills);
      }
    }
  }

  Widget _menuItem(
    BuildContext ctx,
    IconData icon,
    String label,
    String route,
  ) {
    return GestureDetector(
      onTap: () {
        setState(() => _menuOpen = false);
        if (route.isNotEmpty) context.push(route);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(12)),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppColors.textPrimary),
            const SizedBox(width: 12),
            Text(label, style: Theme.of(context).textTheme.labelMedium),
          ],
        ),
      ),
    );
  }

  List<Object> _buildFeedItems(List<Recipe> recipes, List<Post> posts) {
    final items = <Object>[];
    final maxCount = recipes.length > posts.length
        ? recipes.length
        : posts.length;

    for (var i = 0; i < maxCount; i++) {
      if (i < recipes.length) items.add(recipes[i]);
      if (i < posts.length) items.add(posts[i]);
    }

    return items;
  }
}

List<String> _homeHotSearches(List<String> categories, List<Recipe> recipes) {
  final values = <String>[];
  values.addAll(categories);
  values.addAll(recipes.map((recipe) => recipe.title));

  final seen = <String>{};
  return values
      .map((value) => value.trim())
      .where((value) => value.isNotEmpty)
      .where((value) => seen.add(value))
      .take(8)
      .toList();
}

class _HomeBannerCard extends StatelessWidget {
  final HomeBanner banner;
  final VoidCallback onTap;

  const _HomeBannerCard({required this.banner, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x0A000000)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (banner.imageUrl.isNotEmpty)
              CachedNetworkImage(
                imageUrl: banner.imageUrl,
                fit: BoxFit.cover,
                errorWidget: (_, _, _) => _BannerFallback(title: banner.title),
              )
            else
              _BannerFallback(title: banner.title),
            Container(
              decoration: const BoxDecoration(
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
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BannerFallback extends StatelessWidget {
  final String title;

  const _BannerFallback({required this.title});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.campaign,
            color: AppColors.accent.withAlpha(100),
            size: 40,
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}

class _HomeSearchPanel extends StatelessWidget {
  final String query;
  final List<String> history;
  final List<String> hotSearches;
  final List<Recipe> recipes;
  final ValueChanged<String> onKeywordTap;
  final ValueChanged<String> onSearchTap;
  final ValueChanged<Recipe> onRecipeTap;

  const _HomeSearchPanel({
    required this.query,
    required this.history,
    required this.hotSearches,
    required this.recipes,
    required this.onKeywordTap,
    required this.onSearchTap,
    required this.onRecipeTap,
  });

  @override
  Widget build(BuildContext context) {
    final matches = _matches(query);

    return Material(
      color: Colors.transparent,
      child: Container(
        constraints: const BoxConstraints(maxHeight: 360),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0x0A000000)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x1A000000),
              blurRadius: 28,
              offset: Offset(0, 12),
            ),
          ],
        ),
        child: query.isEmpty
            ? _HomeSearchStarter(
                history: history,
                hotSearches: hotSearches,
                onKeywordTap: onKeywordTap,
              )
            : Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _SearchCommandRow(query: query, onTap: onSearchTap),
                  if (matches.isNotEmpty)
                    const Divider(height: 1, color: AppColors.divider),
                  Flexible(
                    child: matches.isEmpty
                        ? _NoHomeSearchMatch(query: query)
                        : ListView.separated(
                            shrinkWrap: true,
                            padding: EdgeInsets.zero,
                            itemCount: matches.length,
                            separatorBuilder: (_, _) => const Divider(
                              height: 1,
                              color: AppColors.divider,
                            ),
                            itemBuilder: (context, index) {
                              final recipe = matches[index];
                              return ListTile(
                                dense: true,
                                contentPadding: EdgeInsets.zero,
                                leading: Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: AppColors.surfaceSecondary,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Icon(
                                    Icons.restaurant_menu,
                                    size: 18,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                                title: Text(
                                  recipe.title,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(
                                    context,
                                  ).textTheme.labelMedium,
                                ),
                                subtitle: Text(
                                  '${recipe.cookTime}分钟 · ${_cnDifficulty(recipe.difficulty)} · ${recipe.ingredientCount}种食材',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context).textTheme.labelSmall
                                      ?.copyWith(
                                        color: AppColors.textSecondary,
                                      ),
                                ),
                                trailing: const Icon(
                                  Icons.chevron_right,
                                  size: 18,
                                ),
                                onTap: () => onRecipeTap(recipe),
                              );
                            },
                          ),
                  ),
                ],
              ),
      ),
    );
  }

  List<Recipe> _matches(String value) {
    final keyword = value.toLowerCase();
    return recipes
        .where((recipe) {
          final title = recipe.title.toLowerCase();
          final author = recipe.authorName.toLowerCase();
          final ingredients = recipe.ingredients
              .map((item) => item.name.toLowerCase())
              .join(' ');
          return title.contains(keyword) ||
              author.contains(keyword) ||
              ingredients.contains(keyword);
        })
        .take(5)
        .toList();
  }
}

class _SearchCommandRow extends StatelessWidget {
  final String query;
  final ValueChanged<String> onTap;

  const _SearchCommandRow({required this.query, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      contentPadding: EdgeInsets.zero,
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: AppColors.textPrimary,
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Icon(Icons.search, size: 18, color: AppColors.surface),
      ),
      title: Text(
        '搜索“$query”',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: Theme.of(context).textTheme.labelMedium,
      ),
      subtitle: Text(
        '查看完整搜索结果',
        style: Theme.of(
          context,
        ).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary),
      ),
      trailing: const Icon(Icons.arrow_forward, size: 18),
      onTap: () => onTap(query),
    );
  }
}

class _HomeSearchStarter extends StatelessWidget {
  final List<String> history;
  final List<String> hotSearches;
  final ValueChanged<String> onKeywordTap;

  const _HomeSearchStarter({
    required this.history,
    required this.hotSearches,
    required this.onKeywordTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (history.isNotEmpty) ...[
          _HomeKeywordSection(
            title: '搜索历史',
            items: history,
            onKeywordTap: onKeywordTap,
          ),
          const SizedBox(height: 14),
        ],
        if (hotSearches.isNotEmpty)
          _HomeKeywordSection(
            title: '热搜',
            items: hotSearches,
            onKeywordTap: onKeywordTap,
          )
        else
          const Text(
            '输入关键词搜索菜谱',
            style: TextStyle(color: AppColors.textSecondary),
          ),
      ],
    );
  }
}

class _HomeKeywordSection extends StatelessWidget {
  final String title;
  final List<String> items;
  final ValueChanged<String> onKeywordTap;

  const _HomeKeywordSection({
    required this.title,
    required this.items,
    required this.onKeywordTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(
            context,
          ).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: items.map((item) {
            return GestureDetector(
              onTap: () => onKeywordTap(item),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: AppColors.surfaceSecondary,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  item,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _NoHomeSearchMatch extends StatelessWidget {
  final String query;

  const _NoHomeSearchMatch({required this.query});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 18),
      child: Row(
        children: [
          const Icon(Icons.search_off, color: AppColors.textPlaceholder),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              '暂无直接匹配，点击上方搜索“$query”查看全部结果',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}

String _cnDifficulty(String difficulty) {
  switch (difficulty) {
    case 'Easy':
    case 'easy':
      return '简单';
    case 'Medium':
    case 'medium':
    case 'normal':
      return '中等';
    case 'Hard':
    case 'hard':
      return '困难';
    default:
      return difficulty; // 已是中文直接返回
  }
}
