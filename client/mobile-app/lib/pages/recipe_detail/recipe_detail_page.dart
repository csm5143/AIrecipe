import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../config/glass_theme.dart';
import '../../config/theme.dart';
import '../../data/api/app_exception.dart';
import '../../data/api/auth_storage.dart';
import '../../models/recipe.dart';
import '../../providers/api_providers.dart';
import '../../providers/collection_provider.dart';
import '../../providers/recipe_provider.dart';
import '../../widgets/capsule_toast.dart';
import 'widgets/recipe_comments_section.dart';

class RecipeDetailPage extends ConsumerWidget {
  final String recipeId;

  const RecipeDetailPage({super.key, required this.recipeId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recipeAsync = ref.watch(recipeByIdProvider(recipeId));

    return recipeAsync.when(
      loading: () => const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (error, _) => Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('菜谱详情')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              '菜谱加载失败\n$error',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            ),
          ),
        ),
      ),
      data: (recipe) => _RecipeDetailContent(recipe: recipe),
    );
  }
}

class _RecipeDetailContent extends ConsumerStatefulWidget {
  final Recipe recipe;

  const _RecipeDetailContent({required this.recipe});

  @override
  ConsumerState<_RecipeDetailContent> createState() =>
      _RecipeDetailContentState();
}

class _RecipeDetailContentState extends ConsumerState<_RecipeDetailContent> {
  final _scrollController = ScrollController();
  final _commentsAnchorKey = GlobalKey();
  final _commentsKey = GlobalKey<RecipeCommentsSectionState>();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent - 520) {
      _commentsKey.currentState?.loadMore();
    }
  }

  void _focusComments() {
    final anchorContext = _commentsAnchorKey.currentContext;
    if (anchorContext != null) {
      Scrollable.ensureVisible(
        anchorContext,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOut,
        alignment: 0.08,
      );
    }
    _commentsKey.currentState?.focusComposer();
  }

  @override
  Widget build(BuildContext context) {
    final recipe = widget.recipe;
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          CustomScrollView(
            controller: _scrollController,
            slivers: [
              SliverToBoxAdapter(child: _HeroImage(recipe: recipe)),
              SliverToBoxAdapter(
                child: Container(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 116),
                  decoration: const BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(32),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        recipe.title,
                        style: Theme.of(
                          context,
                        ).textTheme.displayLarge?.copyWith(fontSize: 28),
                      ),
                      if (recipe.description.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Text(
                          recipe.description,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: AppColors.textSecondary,
                                height: 1.5,
                              ),
                        ),
                      ],
                      const SizedBox(height: 20),
                      _InfoRow(recipe: recipe),
                      const SizedBox(height: 28),
                      _IngredientsSection(recipe: recipe),
                      const SizedBox(height: 28),
                      _StepsSection(steps: recipe.steps),
                      const SizedBox(height: 28),
                      Container(
                        key: _commentsAnchorKey,
                        child: RecipeCommentsSection(
                          key: _commentsKey,
                          recipeId: recipe.id,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: _BottomActionBar(recipe: recipe, onComment: _focusComments),
          ),
        ],
      ),
    );
  }
}

class _HeroImage extends StatelessWidget {
  final Recipe recipe;

  const _HeroImage({required this.recipe});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        SizedBox(
          height: 350,
          width: double.infinity,
          child: CachedNetworkImage(
            imageUrl: recipe.coverImage,
            fit: BoxFit.cover,
            errorWidget: (_, _, _) => Container(
              color: AppColors.surfaceSecondary,
              child: const Icon(
                Icons.restaurant,
                size: 54,
                color: AppColors.textPlaceholder,
              ),
            ),
          ),
        ),
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            height: 90,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, Color(0xAA000000)],
              ),
            ),
          ),
        ),
        Positioned(
          top: MediaQuery.of(context).padding.top + 8,
          left: 16,
          right: 16,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _CircleGlassButton(
                icon: Icons.arrow_back_ios_new,
                onTap: () => Navigator.of(context).canPop()
                    ? context.pop()
                    : context.go('/'),
              ),
              _CircleGlassButton(
                icon: Icons.more_horiz,
                onTap: () => _showRecipeMenu(context, recipe),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CircleGlassButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _CircleGlassButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: GlassTheme.glassDecoration(borderRadius: 20),
        child: Icon(icon, size: 20, color: AppColors.textPrimary),
      ),
    );
  }
}

void _showRecipeMenu(BuildContext context, Recipe recipe) {
  showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (context) => Padding(
      padding: EdgeInsets.fromLTRB(
        16,
        0,
        16,
        16 + MediaQuery.of(context).padding.bottom,
      ),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: GlassTheme.glassDecoration(
          borderRadius: 24,
          bgColor: const Color(0xF2FFFFFF),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _MenuActionTile(
              icon: Icons.ios_share,
              label: '分享菜谱',
              onTap: () async {
                final link = 'airecipe://recipe/${recipe.id}';
                await Clipboard.setData(ClipboardData(text: link));
                if (context.mounted) {
                  showCapsuleToast(context, '链接已复制', icon: Icons.ios_share);
                }
              },
            ),
            _MenuActionTile(
              icon: Icons.flag_outlined,
              label: '举报内容',
              onTap: () => _showReportDialog(context, recipe),
            ),
            _MenuActionTile(
              icon: Icons.visibility_off_outlined,
              label: '不感兴趣',
              onTap: () => _hideRecipe(context, recipe.id),
            ),
          ],
        ),
      ),
    ),
  );
}

class _MenuActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Future<void> Function()? onTap;

  const _MenuActionTile({required this.icon, required this.label, this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.textPrimary),
      title: Text(label, style: Theme.of(context).textTheme.bodyMedium),
      onTap: () async {
        Navigator.pop(context);
        await onTap?.call();
      },
    );
  }
}

Future<void> _showReportDialog(BuildContext context, Recipe recipe) async {
  const reasons = ['内容错误', '图片不适', '侵权内容', '其他问题'];
  final reason = await showDialog<String>(
    context: context,
    builder: (context) => SimpleDialog(
      title: const Text('举报原因'),
      children: reasons
          .map(
            (item) => SimpleDialogOption(
              onPressed: () => Navigator.pop(context, item),
              child: Text(item),
            ),
          )
          .toList(),
    ),
  );

  if (reason == null || !context.mounted) return;
  final container = ProviderScope.containerOf(context, listen: false);
  try {
    await container
        .read(feedbackApiProvider)
        .submitFeedback(
          type: 'CONTENT_ISSUE',
          content: reason,
          contact: '菜谱ID:${recipe.id} 标题:${recipe.title}',
        );
    if (context.mounted) {
      showCapsuleToast(context, '举报已提交', icon: Icons.flag_outlined);
    }
  } catch (error) {
    if (context.mounted) {
      showCapsuleToast(
        context,
        _errorMessage(error),
        icon: Icons.error_outline,
      );
    }
  }
}

Future<void> _hideRecipe(BuildContext context, String recipeId) async {
  final prefs = await SharedPreferences.getInstance();
  final hidden = prefs.getStringList('hidden_recipes') ?? <String>[];
  if (!hidden.contains(recipeId)) {
    await prefs.setStringList('hidden_recipes', [...hidden, recipeId]);
  }
  if (context.mounted) {
    showCapsuleToast(context, '已减少类似推荐', icon: Icons.visibility_off_outlined);
    if (Navigator.of(context).canPop()) {
      context.pop();
    }
  }
}

class _InfoRow extends StatelessWidget {
  final Recipe recipe;

  const _InfoRow({required this.recipe});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 24,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          _InfoItem(
            icon: Icons.schedule,
            label: '耗时',
            value: '${recipe.cookTime} 分钟',
          ),
          const _InfoDivider(),
          _InfoItem(
            icon: Icons.local_fire_department,
            label: '难度',
            value: _cnDifficulty(recipe.difficulty),
          ),
          const _InfoDivider(),
          _InfoItem(
            icon: Icons.kitchen,
            label: '食材',
            value: '${recipe.ingredientCount} 种',
          ),
          const _InfoDivider(),
          _InfoItem(
            icon: Icons.bolt,
            label: '热量',
            value: '${recipe.calories} 千卡',
          ),
        ],
      ),
    );
  }
}

class _InfoDivider extends StatelessWidget {
  const _InfoDivider();

  @override
  Widget build(BuildContext context) {
    return Container(width: 1, height: 44, color: AppColors.divider);
  }
}

class _InfoItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoItem({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: AppColors.textSecondary),
          const SizedBox(height: 4),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
              letterSpacing: 0,
            ),
          ),
          const SizedBox(height: 2),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              value,
              maxLines: 1,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class _IngredientsSection extends StatelessWidget {
  final Recipe recipe;

  const _IngredientsSection({required this.recipe});

  @override
  Widget build(BuildContext context) {
    final ingredients = recipe.ingredients;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('所需食材', style: Theme.of(context).textTheme.headlineMedium),
            Text(
              '${recipe.servings} 人份',
              style: Theme.of(
                context,
              ).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (ingredients.isEmpty)
          Text(
            '暂无食材明细',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
          )
        else
          ...ingredients.map(
            (item) => Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: AppColors.divider)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      item.name,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    [
                      item.amount,
                      item.unit,
                    ].where((v) => v.isNotEmpty).join(''),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _StepsSection extends StatelessWidget {
  final List<CookingStep> steps;

  const _StepsSection({required this.steps});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('烹饪步骤', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 20),
        if (steps.isEmpty)
          Text(
            '暂无步骤说明',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
          )
        else
          ...steps.map(
            (step) => Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: const BoxDecoration(
                      color: AppColors.textPrimary,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '${step.stepNumber}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.surface,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (step.imageUrl != null &&
                            step.imageUrl!.isNotEmpty) ...[
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: CachedNetworkImage(
                              imageUrl: step.imageUrl!,
                              fit: BoxFit.cover,
                              width: double.infinity,
                              errorWidget: (_, _, _) => const SizedBox.shrink(),
                            ),
                          ),
                          const SizedBox(height: 10),
                        ],
                        if (step.title.isNotEmpty)
                          Text(
                            step.title,
                            style: Theme.of(
                              context,
                            ).textTheme.labelMedium?.copyWith(fontSize: 15),
                          ),
                        if (step.title.isNotEmpty) const SizedBox(height: 4),
                        Text(
                          step.description,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: AppColors.textSecondary,
                                height: 1.6,
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
    );
  }
}

class _BottomActionBar extends ConsumerStatefulWidget {
  final Recipe recipe;
  final VoidCallback onComment;

  const _BottomActionBar({required this.recipe, required this.onComment});

  @override
  ConsumerState<_BottomActionBar> createState() => _BottomActionBarState();
}

class _BottomActionBarState extends ConsumerState<_BottomActionBar> {
  bool _isLiked = false;
  bool _savingLike = false;
  bool _bookmarked = false;
  bool _savingFavorite = false;
  bool _savingBasket = false;

  @override
  void initState() {
    super.initState();
    _checkLikedStatus();
  }

  Future<void> _checkLikedStatus() async {
    try {
      final results = await Future.wait([
        ref.read(favoritesApiProvider).getLikedRecipes(pageSize: 200),
        ref.read(collectionApiProvider).getCollections(),
      ]);
      if (!mounted) return;
      final likedRecipes = results[0] as List<Recipe>;
      final collections = results[1] as List<Map<String, dynamic>>;
      final liked = likedRecipes.any((r) => r.id == widget.recipe.id);
      final bookmarked = collections.any((c) {
        final items = c['items'] as List? ?? [];
        return items.any((item) {
          final recipeId =
              (item is Map ? item['recipeId'] : null)?.toString() ?? '';
          return recipeId == widget.recipe.id;
        });
      });
      setState(() {
        _isLiked = liked;
        _bookmarked = bookmarked;
      });
    } catch (_) {
      // Best-effort state hydration only; the action buttons still work.
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: GlassTheme.glassDecoration(
        borderRadius: GlassTheme.navRadius,
        bgColor: const Color(0xD9FFFFFF),
      ),
      child: Row(
        children: [
          _ActionIcon(
            active: _isLiked,
            activeIcon: Icons.favorite,
            inactiveIcon: Icons.favorite_border,
            activeColor: AppColors.accent,
            onTap: _savingLike ? null : _toggleLike,
          ),
          _ActionIcon(
            active: _bookmarked,
            activeIcon: Icons.bookmark,
            inactiveIcon: Icons.bookmark_border,
            activeColor: AppColors.textPrimary,
            onTap: _savingFavorite ? null : _saveToCollection,
          ),
          _ActionIcon(
            active: false,
            activeIcon: Icons.mode_comment,
            inactiveIcon: Icons.mode_comment_outlined,
            activeColor: AppColors.textPrimary,
            onTap: widget.onComment,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: SizedBox(
              height: 44,
              child: FilledButton(
                onPressed: _savingBasket ? null : _saveShoppingList,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.textPrimary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: _savingBasket
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('加入菜篮', style: TextStyle(fontSize: 15)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _toggleLike() async {
    setState(() => _savingLike = true);
    try {
      final result = await ref
          .read(recipeApiProvider)
          .toggleLike(widget.recipe.id);
      if (!mounted) return;
      final liked = result['liked'] == true;
      setState(() => _isLiked = liked);
      ref.invalidate(likedRecipesProvider);
    } catch (_) {
      if (mounted) showCapsuleToast(context, '操作失败', icon: Icons.error_outline);
    } finally {
      if (mounted) setState(() => _savingLike = false);
    }
  }

  Future<void> _saveToCollection() async {
    if ((await AuthStorage.getToken()).isEmpty) {
      if (mounted) showCapsuleToast(context, '请先登录');
      return;
    }
    try {
      final collections = await ref
          .read(collectionApiProvider)
          .getCollections();
      if (!mounted) return;

      if (collections.isEmpty) {
        // Create default collection
        await ref.read(collectionApiProvider).createCollection('默认收藏');
        final newCollections = await ref
            .read(collectionApiProvider)
            .getCollections();
        if (newCollections.isNotEmpty) {
          await _addToCollection(newCollections.first['id'].toString());
        }
        return;
      }

      // Show collection picker
      final pickedId = await showModalBottomSheet<String>(
        context: context,
        backgroundColor: AppColors.surface,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
        ),
        builder: (ctx) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  '选择收藏夹',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                ),
              ),
              const Divider(height: 1),
              ...collections.map(
                (c) => ListTile(
                  leading: const Icon(Icons.folder_outlined),
                  title: Text((c['name'] ?? '').toString()),
                  trailing: Text(
                    '${c['itemCount'] ?? 0}项',
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                  onTap: () => Navigator.pop(ctx, c['id'].toString()),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.add, color: AppColors.accent),
                title: const Text(
                  '新建收藏夹',
                  style: TextStyle(color: AppColors.accent),
                ),
                onTap: () async {
                  final name = await _showCreateCollectionDialog(ctx);
                  if (name != null && ctx.mounted) {
                    Navigator.pop(ctx, 'new:$name');
                  }
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      );

      if (pickedId == null || !mounted) return;

      String collectionId = pickedId;
      if (pickedId.startsWith('new:')) {
        final name = pickedId.substring(4);
        final created = await ref
            .read(collectionApiProvider)
            .createCollection(name);
        collectionId = created['id'].toString();
      }

      await _addToCollection(collectionId);
    } catch (error) {
      if (!mounted) return;
      showCapsuleToast(
        context,
        _errorMessage(error),
        icon: Icons.error_outline,
      );
    }
  }

  Future<String?> _showCreateCollectionDialog(BuildContext ctx) async {
    final ctrl = TextEditingController();
    return showDialog<String>(
      context: ctx,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('新建收藏夹'),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration: const InputDecoration(hintText: '收藏夹名称'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () {
              final name = ctrl.text.trim();
              Navigator.pop(dialogCtx, name.isEmpty ? null : name);
            },
            child: const Text('创建'),
          ),
        ],
      ),
    );
  }

  Future<void> _addToCollection(String collectionId) async {
    setState(() => _savingFavorite = true);
    try {
      await ref
          .read(collectionApiProvider)
          .addRecipeToCollection(widget.recipe.id, collectionId);
      await ref.read(myCollectionProvider.notifier).load();
      if (!mounted) return;
      setState(() => _bookmarked = true);
      showCapsuleToast(context, '已加入收藏夹', icon: Icons.bookmark);
    } catch (error) {
      if (!mounted) return;
      showCapsuleToast(
        context,
        _errorMessage(error),
        icon: Icons.error_outline,
      );
    } finally {
      if (mounted) setState(() => _savingFavorite = false);
    }
  }

  Future<void> _saveShoppingList() async {
    if ((await AuthStorage.getToken()).isEmpty) {
      if (mounted) showCapsuleToast(context, '请先登录');
      return;
    }
    final ingredients = widget.recipe.ingredients;
    if (ingredients.isEmpty) {
      if (!mounted) return;
      showCapsuleToast(context, '这个菜谱还没有食材明细', icon: Icons.info_outline);
      return;
    }

    setState(() => _savingBasket = true);
    try {
      await ref
          .read(collectionApiProvider)
          .saveShoppingList(
            name: '${widget.recipe.title} 食材清单',
            recipeId: widget.recipe.id,
            items: ingredients
                .map(
                  (item) => {
                    'name': item.name,
                    'amount': item.amount,
                    'unit': item.unit,
                  },
                )
                .toList(),
          );
      await ref.read(shoppingListProvider.notifier).load();

      if (!mounted) return;
      showCapsuleToast(context, '已加入小菜篮', icon: Icons.shopping_basket_outlined);
    } catch (error) {
      if (!mounted) return;
      showCapsuleToast(
        context,
        _errorMessage(error),
        icon: Icons.error_outline,
      );
    } finally {
      if (mounted) {
        setState(() => _savingBasket = false);
      }
    }
  }
}

class _ActionIcon extends StatelessWidget {
  final bool active;
  final IconData activeIcon;
  final IconData inactiveIcon;
  final Color activeColor;
  final VoidCallback? onTap;

  const _ActionIcon({
    required this.active,
    required this.activeIcon,
    required this.inactiveIcon,
    required this.activeColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 48,
        height: 48,
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          transitionBuilder: (child, anim) =>
              ScaleTransition(scale: anim, child: child),
          child: Icon(
            active ? activeIcon : inactiveIcon,
            key: ValueKey(active),
            color: active ? activeColor : AppColors.textSecondary,
            size: 24,
          ),
        ),
      ),
    );
  }
}

String _errorMessage(Object error) {
  if (error is AppException) return error.message;
  return error.toString();
}

String _cnDifficulty(String value) {
  switch (value) {
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
      return value;
  }
}
