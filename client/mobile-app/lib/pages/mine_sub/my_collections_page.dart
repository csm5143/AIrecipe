import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../providers/collection_provider.dart';
import '../../widgets/capsule_toast.dart';

class MyCollectionsPage extends ConsumerWidget {
  const MyCollectionsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final collections = ref.watch(myCollectionProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.of(context).canPop()
              ? context.pop()
              : context.go('/mine'),
        ),
        title: const Text('我的收藏'),
        centerTitle: true,
        actions: [
          IconButton(
            tooltip: '新建收藏夹',
            icon: const Icon(Icons.create_new_folder),
            onPressed: () => _showCreateDialog(context, ref),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(myCollectionProvider.notifier).load(),
        child: collections.isEmpty
            ? const _EmptyCollections()
            : GridView.builder(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.82,
                ),
                itemCount: collections.length + 1,
                itemBuilder: (context, index) {
                  if (index == collections.length) {
                    return _CreateCard(
                      onTap: () => _showCreateDialog(context, ref),
                    );
                  }
                  return _CollectionCard(collection: collections[index]);
                },
              ),
      ),
    );
  }

  Future<void> _showCreateDialog(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('新建收藏夹'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: '收藏夹名称'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () {
              final value = controller.text.trim();
              if (value.isEmpty) return;
              Navigator.pop(context, value);
            },
            child: const Text('创建'),
          ),
        ],
      ),
    );
    controller.dispose();

    if (name == null || name.isEmpty) return;

    try {
      await ref.read(myCollectionProvider.notifier).create(name);
      if (context.mounted) {
        showCapsuleToast(context, '收藏夹已创建');
      }
    } catch (error) {
      if (context.mounted) {
        showCapsuleToast(context, '创建失败: $error');
      }
    }
  }
}

class _CollectionCard extends StatelessWidget {
  final Map<String, dynamic> collection;

  const _CollectionCard({required this.collection});

  @override
  Widget build(BuildContext context) {
    final name = collection['name']?.toString() ?? '未命名';
    final count = collection['itemCount'] ?? collection['item_count'] ?? 0;
    final coverImages = collection['coverImages'] is List
        ? collection['coverImages'] as List
        : const [];

    final id = collection['id']?.toString() ?? '';

    return GestureDetector(
      onTap: id.isNotEmpty ? () => context.push('/collection/$id') : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                boxShadow: const [
                  BoxShadow(color: Color(0x06000000), blurRadius: 20),
                ],
                border: Border.all(color: const Color(0x08000000)),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: coverImages.isEmpty
                    ? Container(
                        color: AppColors.surfaceSecondary,
                        child: const Center(
                          child: Icon(
                            Icons.collections_bookmark,
                            size: 40,
                            color: AppColors.textPlaceholder,
                          ),
                        ),
                      )
                    : _CoverGrid(images: coverImages),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 2),
          Text(
            '$count 个菜谱',
            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _CoverGrid extends StatelessWidget {
  final List images;

  const _CoverGrid({required this.images});

  @override
  Widget build(BuildContext context) {
    final visible = images.take(4).map((item) => item.toString()).toList();
    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
      ),
      itemCount: visible.length,
      itemBuilder: (context, index) => Image.network(
        visible[index],
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => Container(color: AppColors.surfaceSecondary),
      ),
    );
  }
}

class _CreateCard extends StatelessWidget {
  final VoidCallback onTap;

  const _CreateCard({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          boxShadow: const [
            BoxShadow(color: Color(0x06000000), blurRadius: 20),
          ],
          border: Border.all(color: const Color(0x08000000)),
        ),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: Color(0xFFE8E8EA),
              child: Icon(Icons.add, size: 22, color: AppColors.textSecondary),
            ),
            SizedBox(height: 8),
            Text(
              '新建',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyCollections extends StatelessWidget {
  const _EmptyCollections();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 120, 24, 100),
      children: [
        const Icon(
          Icons.collections_bookmark_outlined,
          size: 46,
          color: AppColors.textPlaceholder,
        ),
        const SizedBox(height: 14),
        Text(
          '暂无收藏夹',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 8),
        Text(
          '创建收藏夹，跨设备同步你收藏的菜谱。',
          textAlign: TextAlign.center,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
        ),
      ],
    );
  }
}
