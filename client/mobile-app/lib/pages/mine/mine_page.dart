import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../config/glass_theme.dart';
import '../../providers/recipe_provider.dart';
import '../../providers/collection_provider.dart';

/// 我的页
class MinePage extends ConsumerStatefulWidget {
  const MinePage({super.key});
  @override
  ConsumerState<MinePage> createState() => _MinePageState();
}

class _MinePageState extends ConsumerState<MinePage> with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl;
  bool _menuOpen = false;
  bool _showNotifPanel = false;

  static const _menuItems = [
    _MenuAction(icon: Icons.edit_document, label: '草稿箱', route: '/drafts'),
    _MenuAction(icon: Icons.shopping_bag_outlined, label: '我的订单', route: ''),
    _MenuAction(icon: Icons.history, label: '浏览历史', route: ''),
    _MenuAction(icon: Icons.favorite_border, label: '我的收藏', route: '/collection'),
  ];

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final recipes = ref.watch(recipeListProvider);
    final notifications = ref.watch(notificationListProvider);
    if (recipes.isEmpty) return const SizedBox.shrink();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Stack(children: [
          Column(children: [
            // ── 顶栏 ──
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: Row(children: [
                _GlassBtn(icon: Icons.menu, onTap: () => setState(() => _menuOpen = !_menuOpen)),
                const Spacer(),
                _GlassBtn(icon: Icons.settings_outlined, onTap: () => context.push('/settings')),
                const SizedBox(width: 12),
                _GlassBtn(
                  icon: Icons.notifications_outlined,
                  onTap: () => setState(() => _showNotifPanel = !_showNotifPanel),
                  badge: true,
                ),
              ]),
            ),
            // ── 可滚动内容 ──
            Expanded(
              child: SingleChildScrollView(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const SizedBox(height: 24),
                  // 头像
                  Center(
                    child: Stack(clipBehavior: Clip.none, children: [
                      Container(
                        width: 96, height: 96,
                        decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AppColors.surface, width: 4), boxShadow: const [BoxShadow(color: Color(0x1A000000), blurRadius: 16)]),
                        child: const CircleAvatar(radius: 44, backgroundColor: AppColors.surfaceSecondary, child: Icon(Icons.person, size: 44, color: AppColors.textSecondary)),
                      ),
                      Positioned(bottom: 0, right: -4, child: Container(width: 32, height: 32, decoration: BoxDecoration(color: AppColors.textPrimary, shape: BoxShape.circle, border: Border.all(color: AppColors.background, width: 2), boxShadow: const [BoxShadow(color: Color(0x1A000000), blurRadius: 4)]), child: const Icon(Icons.add_a_photo, size: 16, color: AppColors.surface))),
                    ]),
                  ),
                  const SizedBox(height: 12),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text('小食家', style: Theme.of(context).textTheme.headlineLarge),
                    const SizedBox(width: 6),
                    Icon(Icons.stars_rounded, size: 20, color: AppColors.accent),
                  ]),
                  const SizedBox(height: 6),
                  Text('探索美食的无限可能。AI 食谱创作者，记录每一次完美的味蕾邂逅。', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary)),
                  const SizedBox(height: 24),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
                      _Stat(value: '128', label: '关注'), _Stat(value: '3.2k', label: '粉丝'),
                      _Stat(value: '42', label: '作品'), _Stat(value: '560', label: '收藏'),
                    ]),
                  ),
                  const SizedBox(height: 20),
                  Center(child: OutlinedButton(onPressed: () {}, style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 10), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)), side: const BorderSide(color: AppColors.divider), backgroundColor: AppColors.surfaceSecondary), child: const Text('编辑资料', style: TextStyle(fontSize: 13)))),
                  const SizedBox(height: 20),
                  // ── TabBar ──
                  TabBar(
                    controller: _tabCtrl,
                    labelColor: AppColors.textPrimary,
                    unselectedLabelColor: AppColors.textSecondary,
                    indicatorColor: AppColors.textPrimary,
                    indicatorSize: TabBarIndicatorSize.label,
                    labelStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    unselectedLabelStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w400),
                    dividerColor: AppColors.divider,
                    tabs: const [Tab(text: '作品'), Tab(text: '动态'), Tab(text: '收藏')],
                  ),
                  // ── TabBarView with constrained height ──
                  SizedBox(
                    height: MediaQuery.of(context).size.height * 0.55,
                    child: TabBarView(controller: _tabCtrl, children: [
                      // 作品
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                        child: GridView.builder(
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.75),
                          itemCount: recipes.length,
                          itemBuilder: (context, index) {
                            final r = recipes[index];
                            return GestureDetector(
                              onTap: () => context.push('/recipe/${r.id}'),
                              child: Container(
                                decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)]),
                                clipBehavior: Clip.antiAlias,
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Expanded(child: CachedNetworkImage(imageUrl: r.coverImage, fit: BoxFit.cover, width: double.infinity, errorWidget: (_, __, ___) => Container(color: AppColors.surfaceSecondary))),
                                  Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Text(r.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                                    const SizedBox(height: 6),
                                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                      Row(children: [const Icon(Icons.schedule, size: 14, color: AppColors.textSecondary), const SizedBox(width: 4), Text('${r.cookTime}分钟', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary))]),
                                      Row(children: [Icon(Icons.favorite, size: 14, color: AppColors.accent.withAlpha(200)), const SizedBox(width: 4), Text('${(r.likes / 1000).toStringAsFixed(1)}k', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary))]),
                                    ]),
                                  ])),
                                ]),
                              ),
                            );
                          },
                        ),
                      ),
                      // 动态
                      const Center(child: Text('暂无动态', style: TextStyle(color: AppColors.textSecondary))),
                      // 收藏
                      const Center(child: Text('暂无收藏', style: TextStyle(color: AppColors.textSecondary))),
                    ]),
                  ),
                ]),
              ),
            ),
          ]),
          // ── 汉堡菜单 ──
          if (_menuOpen) Positioned.fill(child: GestureDetector(onTap: () => setState(() => _menuOpen = false), child: Container(color: Colors.transparent))),
          if (_menuOpen)
            Positioned(top: 56, left: 16, child: Material(color: Colors.transparent, child: Container(width: 224, padding: const EdgeInsets.all(8), decoration: GlassTheme.glassDecoration(borderRadius: 24), child: Column(mainAxisSize: MainAxisSize.min, children: _menuItems.map((item) => GestureDetector(
              onTap: () { setState(() => _menuOpen = false); if (item.route.isNotEmpty) context.push(item.route); },
              child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12), decoration: BoxDecoration(borderRadius: BorderRadius.circular(12)), child: Row(children: [Icon(item.icon, size: 20, color: AppColors.textPrimary), const SizedBox(width: 12), Text(item.label, style: Theme.of(context).textTheme.labelMedium)])),
            )).toList()),)),),
          // ── 通知预览面板 ──
          if (_showNotifPanel) Positioned.fill(child: GestureDetector(behavior: HitTestBehavior.opaque, onTap: () => setState(() => _showNotifPanel = false), child: Container(color: Colors.transparent))),
          if (_showNotifPanel)
            Positioned(top: 56, right: 16, width: 280, child: Material(elevation: 0, color: Colors.transparent, child: Container(padding: const EdgeInsets.all(16), decoration: GlassTheme.glassDecoration(borderRadius: 16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('通知', style: Theme.of(context).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600)),
                GestureDetector(
                  onTap: () { setState(() => _showNotifPanel = false); context.push('/notifications'); },
                  child: Text('查看全部', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.accentBlue)),
                ),
              ]),
              const SizedBox(height: 12),
              ...notifications.take(4).map((n) => Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(width: 8, height: 8, margin: const EdgeInsets.only(top: 6, right: 10), decoration: BoxDecoration(shape: BoxShape.circle, color: n.isUnread ? AppColors.accentBlue : Colors.transparent)),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  RichText(text: TextSpan(style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, height: 1.3), children: [TextSpan(text: n.fromUserName, style: const TextStyle(fontWeight: FontWeight.w600)), TextSpan(text: ' ${n.action} ${n.targetName}')])),
                  const SizedBox(height: 2), Text(n.timeAgo, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                ])),
              ]))),
            ])))),
        ]),
      ),
    );
  }
}

class _MenuAction { final IconData icon; final String label, route; const _MenuAction({required this.icon, required this.label, required this.route}); }

class _GlassBtn extends StatelessWidget {
  final IconData icon; final VoidCallback onTap; final bool badge;
  const _GlassBtn({required this.icon, required this.onTap, this.badge = false});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(onTap: onTap, child: Container(width: 40, height: 40, decoration: BoxDecoration(color: const Color(0x80FFFFFF), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0x0A000000)), boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24, offset: Offset(0, 4))]), child: Stack(alignment: Alignment.center, children: [Icon(icon, size: 20, color: AppColors.textPrimary), if (badge) Positioned(top: 8, right: 10, child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle)))])),);
  }
}

class _Stat extends StatelessWidget {
  final String value, label;
  const _Stat({required this.value, required this.label});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(child: Column(children: [Text(value, style: Theme.of(context).textTheme.headlineMedium), const SizedBox(height: 4), Text(label, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary))]));
  }
}
