import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../models/recipe.dart';
import '../../providers/recipe_provider.dart';

class SearchPage extends ConsumerStatefulWidget {
  final String initialQuery;

  const SearchPage({super.key, this.initialQuery = ''});

  @override
  ConsumerState<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends ConsumerState<SearchPage> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  bool _showSuggest = false;
  String _submittedQuery = '';

  static const _history = ['意面', '三文鱼', '牛油果早餐'];
  static const _hotSearches = ['减脂餐', '快手早餐', '鸡蛋', '宝宝餐', '低卡晚餐'];

  String get _query => _controller.text.trim();

  @override
  void initState() {
    super.initState();
    _controller.text = widget.initialQuery;
    _submittedQuery = widget.initialQuery.trim();
    _focusNode.addListener(() {
      if (mounted) {
        setState(() => _showSuggest = _focusNode.hasFocus);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final recipesAsync = ref.watch(recipeSearchProvider(_submittedQuery));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Stack(
          children: [
            CustomScrollView(
              slivers: [
                SliverAppBar(
                  floating: true,
                  backgroundColor: AppColors.background,
                  title: _SearchInput(
                    controller: _controller,
                    focusNode: _focusNode,
                    onChanged: (_) => setState(() => _showSuggest = true),
                    onSubmitted: _submitSearch,
                    onClear: () {
                      _controller.clear();
                      setState(() {
                        _submittedQuery = '';
                        _showSuggest = true;
                      });
                      _focusNode.requestFocus();
                    },
                  ),
                  leading: IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => Navigator.of(context).canPop()
                        ? context.pop()
                        : context.go('/'),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                    child: Text(
                      _submittedQuery.isEmpty
                          ? '推荐菜谱'
                          : '“$_submittedQuery”的搜索结果',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                  ),
                ),
                recipesAsync.when(
                  loading: () => const SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  error: (error, _) => SliverFillRemaining(
                    hasScrollBody: false,
                    child: _SearchMessage(
                      icon: Icons.cloud_off,
                      title: '搜索失败',
                      message: error.toString(),
                    ),
                  ),
                  data: (recipes) {
                    if (recipes.isEmpty) {
                      return const SliverFillRemaining(
                        hasScrollBody: false,
                        child: _SearchMessage(
                          icon: Icons.search_off,
                          title: '没有找到相关菜谱',
                          message: '换个关键词试试，比如“鸡蛋”或“早餐”。',
                        ),
                      );
                    }

                    return SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                      sliver: SliverGrid(
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 12,
                              childAspectRatio: 0.72,
                            ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) => _RecipeResultCard(
                            recipe: recipes[index],
                            onTap: () =>
                                context.push('/recipe/${recipes[index].id}'),
                          ),
                          childCount: recipes.length,
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
            if (_showSuggest)
              Positioned(
                top: 52,
                left: 16,
                right: 16,
                child: _SearchSuggestPanel(
                  query: _query,
                  history: _history,
                  hotSearches: _hotSearches,
                  onKeywordTap: _useKeyword,
                  onSearchTap: _submitSearch,
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _submitSearch(String value) {
    final keyword = value.trim();
    _hideSuggest();
    setState(() => _submittedQuery = keyword);
  }

  void _useKeyword(String keyword) {
    _controller.text = keyword;
    _controller.selection = TextSelection.collapsed(offset: keyword.length);
    _submitSearch(keyword);
  }

  void _hideSuggest() {
    _focusNode.unfocus();
    setState(() => _showSuggest = false);
  }
}

class _SearchInput extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;
  final ValueChanged<String> onSubmitted;
  final VoidCallback onClear;

  const _SearchInput({
    required this.controller,
    required this.focusNode,
    required this.onChanged,
    required this.onSubmitted,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 40,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.surfaceSecondary,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0x0A000000)),
      ),
      child: Row(
        children: [
          const Icon(Icons.search, color: AppColors.textSecondary, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: controller,
              focusNode: focusNode,
              onChanged: onChanged,
              onSubmitted: onSubmitted,
              style: const TextStyle(fontSize: 15),
              decoration: const InputDecoration(
                hintText: '搜索菜谱、食材',
                hintStyle: TextStyle(
                  color: AppColors.textPlaceholder,
                  fontSize: 15,
                ),
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
          GestureDetector(
            onTap: onClear,
            child: const Icon(
              Icons.cancel,
              color: AppColors.textSecondary,
              size: 18,
            ),
          ),
        ],
      ),
    );
  }
}

class _RecipeResultCard extends StatelessWidget {
  final Recipe recipe;
  final VoidCallback onTap;

  const _RecipeResultCard({required this.recipe, required this.onTap});

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
              child: CachedNetworkImage(
                imageUrl: recipe.coverImage,
                fit: BoxFit.cover,
                width: double.infinity,
                errorWidget: (_, _, _) => Container(
                  color: AppColors.surfaceSecondary,
                  child: const Icon(
                    Icons.restaurant,
                    color: AppColors.textPlaceholder,
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    recipe.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(
                        Icons.schedule,
                        size: 14,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${recipe.cookTime} 分钟',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
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

class _SearchSuggestPanel extends StatelessWidget {
  final String query;
  final List<String> history;
  final List<String> hotSearches;
  final ValueChanged<String> onKeywordTap;
  final ValueChanged<String> onSearchTap;

  const _SearchSuggestPanel({
    required this.query,
    required this.history,
    required this.hotSearches,
    required this.onKeywordTap,
    required this.onSearchTap,
  });

  @override
  Widget build(BuildContext context) {
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
            ? Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _KeywordSection(
                    title: '搜索历史',
                    items: history,
                    onKeywordTap: onKeywordTap,
                  ),
                  const SizedBox(height: 14),
                  _KeywordSection(
                    title: '热门搜索',
                    items: hotSearches,
                    onKeywordTap: onKeywordTap,
                  ),
                ],
              )
            : ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.textPrimary,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.search,
                    size: 18,
                    color: AppColors.surface,
                  ),
                ),
                title: Text(
                  '搜索“$query”',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelMedium,
                ),
                subtitle: Text(
                  '查看完整搜索结果',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                trailing: const Icon(Icons.arrow_forward, size: 18),
                onTap: () => onSearchTap(query),
              ),
      ),
    );
  }
}

class _KeywordSection extends StatelessWidget {
  final String title;
  final List<String> items;
  final ValueChanged<String> onKeywordTap;

  const _KeywordSection({
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

class _SearchMessage extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;

  const _SearchMessage({
    required this.icon,
    required this.title,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 38, color: AppColors.textPlaceholder),
          const SizedBox(height: 12),
          Text(title, style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
