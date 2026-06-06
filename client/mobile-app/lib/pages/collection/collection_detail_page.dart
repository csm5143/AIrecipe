import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../providers/api_providers.dart';
import '../../providers/collection_provider.dart';
import '../../widgets/capsule_toast.dart';

class CollectionDetailPage extends ConsumerStatefulWidget {
  final String collectionId;

  const CollectionDetailPage({super.key, required this.collectionId});

  @override
  ConsumerState<CollectionDetailPage> createState() =>
      _CollectionDetailPageState();
}

class _CollectionDetailPageState extends ConsumerState<CollectionDetailPage> {
  Map<String, dynamic>? _detail;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final result = await ref
          .read(collectionApiProvider)
          .getCollectionDetail(widget.collectionId);
      if (mounted) setState(() {
        _detail = result;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _removeRecipe(dynamic recipe) async {
    try {
      await ref.read(collectionApiProvider).removeFromCollection(
            widget.collectionId,
            recipe['id'].toString(),
          );
      ref.invalidate(myCollectionProvider);
      await _load();
      if (mounted) showCapsuleToast(context, '已移出收藏夹');
    } catch (_) {
      if (mounted) showCapsuleToast(context, '操作失败', icon: Icons.error_outline);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = _detail?['name']?.toString() ?? '收藏夹';
    final recipes = (_detail?['recipes'] as List?) ?? <dynamic>[];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        title: Text(name),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () =>
              Navigator.of(context).canPop() ? context.pop() : context.go('/my-collections'),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : recipes.isEmpty
              ? const Center(
                  child: Text('收藏夹是空的', style: TextStyle(color: AppColors.textSecondary)),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: GridView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.72,
                    ),
                    itemCount: recipes.length,
                    itemBuilder: (context, index) {
                      final recipe = recipes[index] as Map<String, dynamic>;
                      return _RecipeCard(
                        recipe: recipe,
                        onTap: () => context.push('/recipe/${recipe['id']}'),
                        onRemove: () => _removeRecipe(recipe),
                      );
                    },
                  ),
                ),
    );
  }
}

class _RecipeCard extends StatelessWidget {
  final Map<String, dynamic> recipe;
  final VoidCallback onTap;
  final VoidCallback onRemove;

  const _RecipeCard({
    required this.recipe,
    required this.onTap,
    required this.onRemove,
  });

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
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: recipe['coverImage']?.toString() ?? '',
                    fit: BoxFit.cover,
                    errorWidget: (_, _, _) => Container(
                      color: AppColors.surfaceSecondary,
                      child: const Icon(Icons.restaurant, color: AppColors.textPlaceholder),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: GestureDetector(
                      onTap: onRemove,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: Colors.black45,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.close, size: 16, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Text(
                recipe['title']?.toString() ?? '',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
