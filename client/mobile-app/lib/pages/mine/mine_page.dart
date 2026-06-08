import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../config/glass_theme.dart';
import '../../models/notification_item.dart';
import '../../models/recipe.dart';
import '../../providers/recipe_provider.dart';
import '../../providers/collection_provider.dart';
import '../../providers/auth_provider.dart';

class MinePage extends ConsumerStatefulWidget {
  const MinePage({super.key});
  @override
  ConsumerState<MinePage> createState() => _MinePageState();
}

class _MinePageState extends ConsumerState<MinePage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl;
  bool _menuOpen = false;
  bool _showNotifPanel = false;

  static const _menuItems = [
    _MenuAction(icon: Icons.edit_document, label: '草稿箱', route: '/drafts'),
    _MenuAction(icon: Icons.history, label: '浏览历史', route: '/history'),
    _MenuAction(
      icon: Icons.favorite_border,
      label: '我的收藏',
      route: '/my-collections',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final myRecipesAsync = ref.watch(myRecipeListProvider);
    final likedRecipesAsync = ref.watch(likedRecipesProvider);
    final myRecipes = myRecipesAsync.valueOrNull ?? const <Recipe>[];
    final myCollections = ref.watch(myCollectionProvider);
    final notifications =
        ref.watch(notificationListProvider).valueOrNull ??
        const <NotificationItem>[];
    final auth = ref.watch(authControllerProvider);
    final user = auth.user;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                // 鈹€鈹€ 椤舵爮 鈹€鈹€
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                  child: Row(
                    children: [
                      _GlassBtn(
                        icon: Icons.menu,
                        onTap: () => setState(() => _menuOpen = !_menuOpen),
                      ),
                      const Spacer(),
                      _GlassBtn(
                        icon: Icons.settings_outlined,
                        onTap: () => context.push('/settings'),
                      ),
                      const SizedBox(width: 12),
                      _GlassBtn(
                        icon: Icons.notifications_outlined,
                        onTap: () =>
                            setState(() => _showNotifPanel = !_showNotifPanel),
                        badge: notifications.any((item) => item.isUnread),
                      ),
                    ],
                  ),
                ),
                // 鈹€鈹€ 鍙粴鍔ㄥ唴瀹?鈹€鈹€
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 24),
                        // 头像 — 点击跳转编辑资料
                        GestureDetector(
                          onTap: () => context.push('/settings/edit-profile'),
                          child: Center(
                            child: Stack(
                              clipBehavior: Clip.none,
                              children: [
                                Container(
                                  width: 96,
                                  height: 96,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: AppColors.surface,
                                      width: 4,
                                    ),
                                    boxShadow: const [
                                      BoxShadow(
                                        color: Color(0x1A000000),
                                        blurRadius: 16,
                                      ),
                                    ],
                                  ),
                                  child: CircleAvatar(
                                    radius: 44,
                                    backgroundColor: AppColors.surfaceSecondary,
                                    backgroundImage:
                                        (user?.avatar.isNotEmpty ?? false)
                                        ? NetworkImage(user!.avatar)
                                        : null,
                                    child: (user?.avatar.isNotEmpty ?? false)
                                        ? null
                                        : const Icon(
                                            Icons.person,
                                            size: 44,
                                            color: AppColors.textSecondary,
                                          ),
                                  ),
                                ),
                                Positioned(
                                  bottom: 0,
                                  right: -4,
                                  child: Container(
                                    width: 32,
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: AppColors.textPrimary,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: AppColors.background,
                                        width: 2,
                                      ),
                                      boxShadow: const [
                                        BoxShadow(
                                          color: Color(0x1A000000),
                                          blurRadius: 4,
                                        ),
                                      ],
                                    ),
                                    child: const Icon(
                                      Icons.add_a_photo,
                                      size: 16,
                                      color: AppColors.surface,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        GestureDetector(
                          onTap: () => context.push('/settings/edit-profile'),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                user?.nickname.isNotEmpty == true
                                    ? user!.nickname
                                    : '未命名用户',
                                style: Theme.of(
                                  context,
                                ).textTheme.headlineLarge,
                              ),
                              const SizedBox(width: 6),
                              Icon(
                                Icons.stars_rounded,
                                size: 20,
                                color: AppColors.accent,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 6),
                        const SizedBox.shrink(),
                        const SizedBox(height: 24),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              _Stat(
                                value: '${user?.following ?? 0}',
                                label: '关注',
                              ),
                              _Stat(
                                value: '${user?.followers ?? 0}',
                                label: '粉丝',
                              ),
                              _Stat(
                                value:
                                    '${_countOrLoaded(user?.works, myRecipes.length)}',
                                label: '作品',
                              ),
                              _Stat(
                                value:
                                    '${_countOrLoaded(user?.collections, myCollections.length)}',
                                label: '收藏',
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                        // ── TabBar ──
                        TabBar(
                          controller: _tabCtrl,
                          labelColor: AppColors.textPrimary,
                          unselectedLabelColor: AppColors.textSecondary,
                          indicatorColor: AppColors.textPrimary,
                          indicatorSize: TabBarIndicatorSize.label,
                          labelStyle: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                          unselectedLabelStyle: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w400,
                          ),
                          dividerColor: AppColors.divider,
                          tabs: const [
                            Tab(text: '作品'),
                            Tab(text: '动态'),
                            Tab(text: '收藏'),
                            Tab(text: '点赞'),
                          ],
                        ),
                        // 鈹€鈹€ TabBarView with constrained height 鈹€鈹€
                        SizedBox(
                          height: MediaQuery.of(context).size.height * 0.55,
                          child: TabBarView(
                            controller: _tabCtrl,
                            children: [
                              myRecipesAsync.when(
                                loading: () =>
                                    const _MineMessage(message: '正在加载你的作品'),
                                error: (error, _) => _MineMessage(
                                  message: error.toString(),
                                  actionLabel: '重试',
                                  onAction: () =>
                                      ref.invalidate(myRecipeListProvider),
                                ),
                                data: (recipes) => _MineRecipeGrid(
                                  recipes: recipes,
                                  onTap: _openMyRecipe,
                                ),
                              ),
                              const Center(
                                child: Text(
                                  '你的发布、点赞和评论会同步显示在这里。',
                                  style: TextStyle(
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ),
                              _MineCollectionList(
                                collections: myCollections,
                                onOpenAll: () =>
                                    context.push('/my-collections'),
                              ),
                              likedRecipesAsync.when(
                                loading: () =>
                                    const _MineMessage(message: '正在加载你点赞的菜谱'),
                                error: (error, _) => _MineMessage(
                                  message: error.toString(),
                                  actionLabel: '重试',
                                  onAction: () =>
                                      ref.invalidate(likedRecipesProvider),
                                ),
                                data: (recipes) => _MineRecipeGrid(
                                  recipes: recipes,
                                  emptyMessage: '还没有点赞过菜谱。',
                                  onTap: (recipe) =>
                                      context.push('/recipe/${recipe.id}'),
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
            // 鈹€鈹€ 姹夊牎鑿滃崟 鈹€鈹€
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
                    width: 224,
                    padding: const EdgeInsets.all(8),
                    decoration: GlassTheme.glassDecoration(borderRadius: 24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: _menuItems
                          .map(
                            (item) => GestureDetector(
                              onTap: () {
                                setState(() => _menuOpen = false);
                                if (item.route.isNotEmpty) {
                                  context.push(item.route);
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 12,
                                ),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      item.icon,
                                      size: 20,
                                      color: AppColors.textPrimary,
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      item.label,
                                      style: Theme.of(
                                        context,
                                      ).textTheme.labelMedium,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ),
              ),
            // 鈹€鈹€ 閫氱煡棰勮闈㈡澘 鈹€鈹€
            if (_showNotifPanel)
              Positioned.fill(
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => setState(() => _showNotifPanel = false),
                  child: Container(color: Colors.transparent),
                ),
              ),
            if (_showNotifPanel)
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
                                setState(() => _showNotifPanel = false);
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
          ],
        ),
      ),
    );
  }

  void _openMyRecipe(Recipe recipe) {
    final status = recipe.status.toLowerCase();
    if (status == 'draft' || status == 'pending' || status == 'rejected') {
      context.push('/publish/recipe', extra: recipe);
      return;
    }
    context.push('/recipe/${recipe.id}');
  }
}

int _countOrLoaded(int? profileCount, int loadedCount) {
  final count = profileCount ?? 0;
  return count > 0 ? count : loadedCount;
}

class _MenuAction {
  final IconData icon;
  final String label, route;
  const _MenuAction({
    required this.icon,
    required this.label,
    required this.route,
  });
}

class _GlassBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool badge;
  const _GlassBtn({
    required this.icon,
    required this.onTap,
    this.badge = false,
  });
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: const Color(0x80FFFFFF),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0x0A000000)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A000000),
              blurRadius: 24,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(icon, size: 20, color: AppColors.textPrimary),
            if (badge)
              Positioned(
                top: 8,
                right: 10,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppColors.accent,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String value, label;
  const _Stat({required this.value, required this.label});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      child: Column(
        children: [
          Text(value, style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _MineRecipeGrid extends StatelessWidget {
  final List<Recipe> recipes;
  final ValueChanged<Recipe> onTap;
  final String emptyMessage;

  const _MineRecipeGrid({
    required this.recipes,
    required this.onTap,
    this.emptyMessage = '还没有作品，发布或保存草稿后会显示在这里。',
  });

  @override
  Widget build(BuildContext context) {
    if (recipes.isEmpty) {
      return _MineMessage(message: emptyMessage);
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      child: GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.75,
        ),
        itemCount: recipes.length,
        itemBuilder: (context, index) {
          final recipe = recipes[index];
          return _MineRecipeCard(recipe: recipe, onTap: () => onTap(recipe));
        },
      ),
    );
  }
}

class _MineRecipeCard extends StatelessWidget {
  final Recipe recipe;
  final VoidCallback onTap;

  const _MineRecipeCard({required this.recipe, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: const [
            BoxShadow(color: Color(0x0A000000), blurRadius: 24),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: recipe.coverImage.isEmpty
                  ? const _RecipeCoverFallback()
                  : CachedNetworkImage(
                      imageUrl: recipe.coverImage,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      errorWidget: (_, _, _) => const _RecipeCoverFallback(),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    recipe.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _RecipeMeta(
                        icon: Icons.schedule,
                        text: '${recipe.cookTime}分钟',
                      ),
                      _RecipeMeta(
                        icon: Icons.favorite,
                        text: _compactCount(recipe.likes),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RecipeCoverFallback extends StatelessWidget {
  const _RecipeCoverFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: AppColors.surfaceSecondary,
      child: const Icon(Icons.restaurant, color: AppColors.textPlaceholder),
    );
  }
}

class _RecipeMeta extends StatelessWidget {
  final IconData icon;
  final String text;

  const _RecipeMeta({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(
          text,
          style: Theme.of(
            context,
          ).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

class _MineCollectionList extends StatelessWidget {
  final List<Map<String, dynamic>> collections;
  final VoidCallback onOpenAll;

  const _MineCollectionList({
    required this.collections,
    required this.onOpenAll,
  });

  @override
  Widget build(BuildContext context) {
    if (collections.isEmpty) {
      return _MineMessage(
        message: '收藏夹会同步显示在这里。',
        actionLabel: '去管理收藏',
        onAction: onOpenAll,
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      itemCount: collections.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final item = collections[index];
        final name = (item['name'] ?? '未命名收藏夹').toString();
        final description = (item['description'] ?? '').toString();
        final count = item['itemCount'] ?? item['item_count'] ?? 0;

        return GestureDetector(
          onTap: onOpenAll,
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x0A000000)),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceSecondary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.folder_outlined,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelLarge,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        description.isEmpty ? '$count 个菜谱' : description,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: AppColors.textSecondary),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _MineMessage extends StatelessWidget {
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _MineMessage({required this.message, this.actionLabel, this.onAction});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 10),
              TextButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}

String _compactCount(int value) {
  if (value >= 10000) return '${(value / 10000).toStringAsFixed(1)}w';
  if (value >= 1000) return '${(value / 1000).toStringAsFixed(1)}k';
  return '$value';
}
