import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../config/glass_theme.dart';
import '../../models/recipe.dart';
import '../../models/post.dart';
import '../../providers/recipe_provider.dart';
import '../../providers/collection_provider.dart';
import '../../data/mock_data.dart';
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
  int _bannerIndex = 0;
  bool _showNotificationPanel = false;
  bool _menuOpen = false;
  int _activeFilter = 0;

  static const _filterPills = ['为你推荐', '关注', '早餐', '晚餐', '快手菜', '素食'];
  static const _banners = ['🔥 夏日清爽减脂食谱特辑', '🌟 新用户专享：注册即得AI食谱'];

  @override
  void initState() {
    super.initState();
    _startBannerAutoScroll();
  }

  void _startBannerAutoScroll() {
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) {
        _bannerIndex = (_bannerIndex + 1) % _banners.length;
        _pageCtrl.animateToPage(_bannerIndex, duration: const Duration(milliseconds: 500), curve: Curves.easeInOut);
        _startBannerAutoScroll();
      }
    });
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final recipes = ref.watch(recipeListProvider);
    final notifications = ref.watch(notificationListProvider);
    final feedItems = _buildFeedItems(recipes, mockPosts);

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
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      // 顶栏
                      Row(children: [
                        GestureDetector(
                          onTap: () => setState(() => _menuOpen = !_menuOpen),
                          child: const Icon(Icons.menu, color: AppColors.textPrimary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: GestureDetector(onTap: () => context.push('/search'), child: const GlassSearchBar())),
                        const SizedBox(width: 12),
                        GestureDetector(
                          onTap: () => setState(() => _showNotificationPanel = !_showNotificationPanel),
                          child: const Icon(Icons.notifications_outlined, color: AppColors.textPrimary),
                        ),
                      ]),
                      const SizedBox(height: 16),
                      // 分类 Pill
                      SizedBox(height: 40, child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _filterPills.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 10),
                        itemBuilder: (ctx, i) {
                          final active = i == _activeFilter;
                          return GestureDetector(
                            onTap: () => setState(() => _activeFilter = i),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                              decoration: BoxDecoration(
                                color: active ? AppColors.textPrimary : AppColors.surface,
                                borderRadius: BorderRadius.circular(20),
                                border: active ? null : Border.all(color: const Color(0x0A000000)),
                              ),
                              child: Text(_filterPills[i], style: Theme.of(context).textTheme.labelMedium?.copyWith(color: active ? AppColors.surface : AppColors.textSecondary)),
                            ),
                          );
                        },
                      )),
                      const SizedBox(height: 16),
                    ]),
                  ),
                ),
                // Banner 轮播
                SliverToBoxAdapter(
                  child: Column(children: [
                    SizedBox(
                      height: 160,
                      child: PageView.builder(
                        controller: _pageCtrl,
                        onPageChanged: (i) => _bannerIndex = i,
                        itemCount: _banners.length,
                        itemBuilder: (ctx, i) => Container(
                          margin: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0x0A000000))),
                          child: Center(child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                            Icon(Icons.campaign, color: AppColors.accent.withAlpha(100), size: 40),
                            const SizedBox(width: 12),
                            Text(_banners[i], style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary)),
                          ])),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    // 指示点
                    Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(_banners.length, (i) => Container(
                      width: 6, height: 6,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      decoration: BoxDecoration(shape: BoxShape.circle, color: i == _bannerIndex ? AppColors.textPrimary : AppColors.divider),
                    ))),
                  ]),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 16)),
              ],
              body: RefreshIndicator(
                onRefresh: () async => await Future.delayed(const Duration(seconds: 1)),
                child: MasonryGridView.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: feedItems.length,
                  itemBuilder: (context, index) {
                    final item = feedItems[index];
                    if (item is Recipe) {
                      return RecipeCard(recipe: item, onTap: () => context.push('/recipe/${item.id}'));
                    } else if (item is Post) {
                      return PostCard(post: item, onTap: () {});
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ),
            ),
            // 通知预览面板
            if (_showNotificationPanel)
              Positioned.fill(child: GestureDetector(onTap: () => setState(() => _showNotificationPanel = false), child: Container(color: Colors.transparent))),
            if (_showNotificationPanel)
              Positioned(
                top: 56, right: 16, width: 280,
                child: Material(
                  elevation: 0,
                  color: Colors.transparent,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: GlassTheme.glassDecoration(borderRadius: 16),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                        Text('通知', style: Theme.of(context).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600)),
                        GestureDetector(onTap: () { setState(() => _showNotificationPanel = false); context.push('/notifications'); }, child: Text('查看全部', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.accentBlue))),
                      ]),
                      const SizedBox(height: 12),
                      ...notifications.take(4).map((n) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Container(width: 8, height: 8, margin: const EdgeInsets.only(top: 6, right: 10), decoration: BoxDecoration(shape: BoxShape.circle, color: n.isUnread ? AppColors.accentBlue : Colors.transparent)),
                          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            RichText(text: TextSpan(style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, height: 1.3), children: [TextSpan(text: n.fromUserName, style: const TextStyle(fontWeight: FontWeight.w600)), TextSpan(text: ' ${n.action} ${n.targetName}')])),
                            const SizedBox(height: 2),
                            Text(n.timeAgo, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                          ])),
                        ]),
                      )),
                    ]),
                  ),
                ),
              ),
            // 汉堡菜单面板
            if (_menuOpen) Positioned.fill(child: GestureDetector(onTap: () => setState(() => _menuOpen = false), child: Container(color: Colors.transparent))),
            if (_menuOpen)
              Positioned(top: 56, left: 16, child: Material(color: Colors.transparent, child: Container(width: 200, padding: const EdgeInsets.all(8), decoration: GlassTheme.glassDecoration(borderRadius: 20), child: Column(mainAxisSize: MainAxisSize.min, children: [
                _menuItem(context, Icons.edit_document, '草稿箱', '/drafts'),
                _menuItem(context, Icons.shopping_bag_outlined, '我的订单', ''),
                _menuItem(context, Icons.history, '浏览历史', '/history'),
                _menuItem(context, Icons.favorite_border, '我的收藏', '/my-collections'),
              ])))),
          ],
        ),
      ),
    );
  }

  Widget _menuItem(BuildContext ctx, IconData icon, String label, String route) {
    return GestureDetector(
      onTap: () { setState(() => _menuOpen = false); if (route.isNotEmpty) context.push(route); },
      child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12), decoration: BoxDecoration(borderRadius: BorderRadius.circular(12)), child: Row(children: [Icon(icon, size: 20, color: AppColors.textPrimary), const SizedBox(width: 12), Text(label, style: Theme.of(context).textTheme.labelMedium)])),
    );
  }

  List<Object> _buildFeedItems(List<Recipe> recipes, List<Post> posts) {
    return [recipes[0], posts[0], recipes[1], posts.length > 1 ? posts[1] : recipes[2], recipes[3], recipes[2], recipes.length > 4 ? recipes[4] : recipes[0]];
  }
}
