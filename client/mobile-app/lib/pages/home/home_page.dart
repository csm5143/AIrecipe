import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/glass_theme.dart';
import '../../config/constants.dart';
import '../../config/theme.dart';
import '../../data/api/auth_storage.dart';
import '../../models/home_content.dart';
import '../../models/notification_item.dart';
import '../../models/recipe.dart';
import '../../providers/collection_provider.dart';
import '../../providers/home_provider.dart';
import '../../providers/recipe_provider.dart';
import '../../services/link_launcher.dart';
import '../../widgets/capsule_toast.dart';
import '../../widgets/search_bar.dart';
import 'widgets/home_feed.dart';
import 'widgets/home_tab_bar.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  final _pageController = PageController();
  final _searchController = TextEditingController();
  final _searchFocusNode = FocusNode();
  int _currentTab = 0;
  bool _showNotificationPanel = false;
  bool _showSearchPanel = false;
  bool _menuOpen = false;
  bool _searchCompact = false;
  List<String> _searchHistory = [];

  static const _fallbackBanners = [
    HomeBanner(id: 'default-banner-1', title: '发现今天要做的菜'),
    HomeBanner(id: 'default-banner-2', title: '用小厨子整理冰箱灵感'),
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
    _loadSearchHistory();
  }

  Future<void> _loadSearchHistory() async {
    final history = await AuthStorage.getSearchHistory();
    if (mounted) setState(() => _searchHistory = history);
  }

  @override
  void dispose() {
    _pageController.dispose();
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final homeContent = ref.watch(homeContentProvider).valueOrNull;
    final notifications =
        ref.watch(notificationListProvider).valueOrNull ??
        const <NotificationItem>[];
    final recipes = ref.watch(recipeListProvider);
    final displayRecipes = recipes.isNotEmpty
        ? recipes
        : homeContent?.latestRecipes ?? const <Recipe>[];
    final categories =
        homeContent?.categories
            .map((category) => category.name)
            .where((name) => name.isNotEmpty)
            .toList() ??
        const <String>[];
    final tabs = _visibleTabs();
    final banners = homeContent?.banners.isNotEmpty == true
        ? homeContent!.banners
        : _fallbackBanners;
    final hotSearches = _homeHotSearches(categories, displayRecipes);

    if (_currentTab >= tabs.length) _currentTab = 0;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Stack(
          children: [
            NotificationListener<ScrollNotification>(
              onNotification: (notification) {
                final compact = notification.metrics.pixels > 48;
                if (compact != _searchCompact) {
                  setState(() => _searchCompact = compact);
                }
                return false;
              },
              child: NestedScrollView(
                headerSliverBuilder: (context, innerBoxIsScrolled) => [
                  SliverPersistentHeader(
                    pinned: true,
                    delegate: _HomeTopBarDelegate(
                      compact: _searchCompact || innerBoxIsScrolled,
                      searchController: _searchController,
                      searchFocusNode: _searchFocusNode,
                      onMenuTap: _toggleMenu,
                      onSearchTap: _openSearchPanel,
                      onSearchChanged: (_) =>
                          setState(() => _showSearchPanel = true),
                      onSearchSubmitted: _openSearchResults,
                      onNotificationTap: _toggleNotifications,
                    ),
                  ),
                  SliverPersistentHeader(
                    pinned: true,
                    delegate: _HomeTabHeaderDelegate(
                      child: HomeTabBar(
                        tabs: tabs,
                        currentIndex: _currentTab,
                        onTap: (index) => _selectTab(index),
                      ),
                    ),
                  ),
                ],
                body: PageView.builder(
                  controller: _pageController,
                  itemCount: tabs.length,
                  onPageChanged: (index) {
                    setState(() => _currentTab = index);
                    ref
                        .read(homeFeedProvider(tabs[index]).notifier)
                        .ensureLoaded();
                  },
                  itemBuilder: (context, index) {
                    final tab = tabs[index];
                    return HomeFeed(
                      tab: tab,
                      categories: categories,
                      showBanner: tab.type == HomeTabType.recommend,
                      banners: banners,
                      onBannerTap: _openBanner,
                    );
                  },
                ),
              ),
            ),
            if (_showSearchPanel)
              Positioned(
                top: _searchCompact ? 56 : 64,
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
                child: _NotificationPanel(
                  notifications: notifications,
                  onViewAll: () {
                    setState(() => _showNotificationPanel = false);
                    context.push('/notifications');
                  },
                ),
              ),
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
                child: _MenuPanel(onSelect: _openMenuRoute),
              ),
          ],
        ),
      ),
    );
  }

  List<HomeTabConfig> _visibleTabs() {
    return const [
      HomeTabConfig(type: HomeTabType.recommend, label: '推荐'),
      HomeTabConfig(type: HomeTabType.following, label: '关注'),
      HomeTabConfig(type: HomeTabType.hot, label: '热门'),
      HomeTabConfig(type: HomeTabType.category, label: '分类'),
      HomeTabConfig(type: HomeTabType.local, label: '同城'),
    ];
    /*

    final tabs = <HomeTabConfig>[
      const HomeTabConfig(type: HomeTabType.recommend, label: '推荐'),
      const HomeTabConfig(type: HomeTabType.following, label: '关注'),
      const HomeTabConfig(type: HomeTabType.hot, label: '热门'),
    ];

    if (categories.isEmpty) {
      tabs.add(
        const HomeTabConfig(
          type: HomeTabType.category,
          label: '分类',
          category: '',
        ),
      );
    } else {
      tabs.addAll(categories.take(8).map(categoryTab));
    }

    tabs.add(const HomeTabConfig(type: HomeTabType.local, label: '同城'));
    return tabs;
*/
  }

  void _selectTab(int index) {
    setState(() => _currentTab = index);
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOut,
    );
  }

  void _toggleMenu() {
    setState(() {
      _menuOpen = !_menuOpen;
      _showSearchPanel = false;
      _showNotificationPanel = false;
      _searchFocusNode.unfocus();
    });
  }

  void _toggleNotifications() {
    setState(() {
      _showNotificationPanel = !_showNotificationPanel;
      _showSearchPanel = false;
      _menuOpen = false;
      _searchFocusNode.unfocus();
    });
  }

  void _openSearchPanel() {
    setState(() {
      _showSearchPanel = true;
      _menuOpen = false;
      _showNotificationPanel = false;
    });
    _searchFocusNode.requestFocus();
  }

  void _hideSearchPanel() {
    _searchFocusNode.unfocus();
    setState(() => _showSearchPanel = false);
  }

  void _useSearchKeyword(String keyword) {
    _hideSearchPanel();
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
    setState(() {
      _searchHistory = [
        query,
        ..._searchHistory.where((item) => item != query),
      ];
    });
    context.push('/search?q=${Uri.encodeQueryComponent(query)}');
  }

  Future<void> _openBanner(HomeBanner banner) async {
    final type = banner.linkType.toLowerCase();
    final value = banner.linkValue.trim();
    if (type == 'recipe' && value.isNotEmpty) {
      context.push('/recipe/$value');
      return;
    }
    if (type == 'category' && value.isNotEmpty) {
      final tabs = _visibleTabs();
      final index = tabs.indexWhere((tab) => tab.type == HomeTabType.category);
      if (index >= 0) _selectTab(index);
      return;
    }
    if ({'webview', 'link', 'page'}.contains(type) && value.isNotEmpty) {
      if (type == 'page' &&
          value.startsWith('/') &&
          !value.startsWith('/h5/')) {
        context.push(value);
        return;
      }
      final opened = await LinkLauncher.openUrl(_bannerUrl(value));
      if (!opened && mounted) {
        showCapsuleToast(context, '无法打开页面', icon: Icons.error_outline);
      }
    }
  }

  String _bannerUrl(String value) {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    final api = Uri.parse(AppConstants.apiBaseDev);
    final port = api.hasPort ? ':${api.port}' : '';
    final origin = '${api.scheme}://${api.host}$port';
    return value.startsWith('/') ? '$origin$value' : '$origin/$value';
  }

  void _openMenuRoute(String route) {
    setState(() => _menuOpen = false);
    context.push(route);
  }
}

class _HomeTopBarDelegate extends SliverPersistentHeaderDelegate {
  final bool compact;
  final TextEditingController searchController;
  final FocusNode searchFocusNode;
  final VoidCallback onMenuTap;
  final VoidCallback onSearchTap;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<String> onSearchSubmitted;
  final VoidCallback onNotificationTap;

  const _HomeTopBarDelegate({
    required this.compact,
    required this.searchController,
    required this.searchFocusNode,
    required this.onMenuTap,
    required this.onSearchTap,
    required this.onSearchChanged,
    required this.onSearchSubmitted,
    required this.onNotificationTap,
  });

  @override
  double get minExtent => 56;

  @override
  double get maxExtent => 72;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    final t = (shrinkOffset / (maxExtent - minExtent)).clamp(0.0, 1.0);
    final height = maxExtent - (maxExtent - minExtent) * t;

    return Container(
      height: height,
      color: AppColors.surface,
      padding: EdgeInsets.fromLTRB(16, compact ? 8 : 12, 16, 8),
      child: Row(
        children: [
          GestureDetector(
            onTap: onMenuTap,
            child: const Icon(Icons.menu, color: AppColors.textPrimary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: AnimatedScale(
              scale: compact ? 0.96 : 1,
              alignment: Alignment.centerLeft,
              duration: const Duration(milliseconds: 180),
              curve: Curves.easeOut,
              child: GlassSearchBar(
                controller: searchController,
                focusNode: searchFocusNode,
                onTap: onSearchTap,
                onChanged: onSearchChanged,
                onSubmitted: onSearchSubmitted,
              ),
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: onNotificationTap,
            child: const Icon(
              Icons.notifications_outlined,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _HomeTopBarDelegate oldDelegate) {
    return oldDelegate.compact != compact ||
        oldDelegate.searchController != searchController ||
        oldDelegate.searchFocusNode != searchFocusNode;
  }
}

class _HomeTabHeaderDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;

  const _HomeTabHeaderDelegate({required this.child});

  @override
  double get minExtent => 40;

  @override
  double get maxExtent => 40;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return child;
  }

  @override
  bool shouldRebuild(covariant _HomeTabHeaderDelegate oldDelegate) {
    return oldDelegate.child != child;
  }
}

class _NotificationPanel extends StatelessWidget {
  final List<NotificationItem> notifications;
  final VoidCallback onViewAll;

  const _NotificationPanel({
    required this.notifications,
    required this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
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
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                GestureDetector(
                  onTap: onViewAll,
                  child: Text(
                    '查看全部',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.accentBlue,
                    ),
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
              ...notifications.take(4).map((item) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        margin: const EdgeInsets.only(top: 6, right: 10),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: item.isUnread
                              ? AppColors.accentBlue
                              : Colors.transparent,
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${item.fromUserName} ${item.action} ${item.targetName}',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.textPrimary,
                                height: 1.3,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              item.timeAgo,
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
                );
              }),
          ],
        ),
      ),
    );
  }
}

class _MenuPanel extends StatelessWidget {
  final ValueChanged<String> onSelect;

  const _MenuPanel({required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Container(
        width: 200,
        padding: const EdgeInsets.all(8),
        decoration: GlassTheme.glassDecoration(borderRadius: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _menuItem(context, Icons.edit_document, '草稿箱', '/drafts'),
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
    );
  }

  Widget _menuItem(
    BuildContext context,
    IconData icon,
    String label,
    String route,
  ) {
    return GestureDetector(
      onTap: () => onSelect(route),
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
                                leading: const Icon(Icons.restaurant_menu),
                                title: Text(
                                  recipe.title,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                subtitle: Text(
                                  '${recipe.cookTime}分钟 · ${recipe.difficulty}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                trailing: const Icon(Icons.chevron_right),
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
      title: Text('搜索 "$query"'),
      subtitle: const Text('查看完整搜索结果'),
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
              '暂无直接匹配，点击上方搜索 "$query" 查看全部结果',
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

List<String> _homeHotSearches(List<String> categories, List<Recipe> recipes) {
  final values = <String>[
    ...categories,
    ...recipes.map((recipe) => recipe.title),
  ];
  final seen = <String>{};
  return values
      .map((value) => value.trim())
      .where((value) => value.isNotEmpty)
      .where((value) => seen.add(value))
      .take(8)
      .toList();
}
