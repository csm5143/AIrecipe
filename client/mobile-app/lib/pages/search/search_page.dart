import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../data/mock_data.dart';
import '../../models/recipe.dart';

/// 搜索结果页 — 搜索栏 + 筛选Tab + 用户卡片 + 食谱 + 社区帖子
class SearchPage extends StatefulWidget {
  final String initialQuery;

  const SearchPage({super.key, this.initialQuery = ''});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  int _filterIndex = 0;
  bool _showSuggest = false;
  static const _filters = ['全部', '菜谱', '用户', '帖子'];
  static const _history = ['意面', '三文鱼', '牛油果早餐'];
  static const _hotSearches = ['减脂餐', '快手早餐', '鸡蛋', '宝宝餐', '低卡晚餐'];

  String get _query => _controller.text.trim();

  @override
  void initState() {
    super.initState();
    _controller.text = widget.initialQuery;
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
                  title: Container(
                    height: 40,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceSecondary,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0x0A000000)),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.search,
                          color: AppColors.textSecondary,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _controller,
                            focusNode: _focusNode,
                            onTap: () => setState(() => _showSuggest = true),
                            onChanged: (_) =>
                                setState(() => _showSuggest = true),
                            onSubmitted: _submitSearch,
                            style: const TextStyle(fontSize: 15),
                            decoration: const InputDecoration(
                              hintText: '搜索菜谱、食材、博主...',
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
                          onTap: () {
                            _controller.clear();
                            setState(() => _showSuggest = true);
                            _focusNode.requestFocus();
                          },
                          child: const Icon(
                            Icons.cancel,
                            color: AppColors.textSecondary,
                            size: 18,
                          ),
                        ),
                      ],
                    ),
                  ),
                  leading: IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => Navigator.of(context).canPop()
                        ? context.pop()
                        : context.go('/'),
                  ),
                ),
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 44,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _filters.length,
                      itemBuilder: (ctx, i) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () => setState(() => _filterIndex = i),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: i == _filterIndex
                                  ? AppColors.textPrimary
                                  : AppColors.surfaceSecondary,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              _filters[i],
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: i == _filterIndex
                                    ? AppColors.surface
                                    : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                // Users section
                SliverToBoxAdapter(child: _buildSection('用户', action: '查看全部')),
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 172,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: 4,
                      itemBuilder: (ctx, i) => GestureDetector(
                        onTap: () => context.push('/user/${i + 1}'),
                        child: Container(
                          width: 128,
                          margin: const EdgeInsets.only(right: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0x0A000000)),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const CircleAvatar(
                                radius: 30,
                                backgroundColor: AppColors.surfaceSecondary,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                [
                                  'Mia Pasta',
                                  'Chef Luigi',
                                  'Sarah Bakes',
                                  'Pasta Lover',
                                ][i],
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                                textAlign: TextAlign.center,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                '${[12, 8, 45, 1][i]}k 粉丝',
                                style: Theme.of(context).textTheme.labelSmall
                                    ?.copyWith(color: AppColors.textSecondary),
                              ),
                              const SizedBox(height: 6),
                              SizedBox(
                                width: double.infinity,
                                height: 26,
                                child: FilledButton(
                                  onPressed: () =>
                                      context.push('/user/${i + 1}'),
                                  style: FilledButton.styleFrom(
                                    backgroundColor: AppColors.textPrimary,
                                    padding: EdgeInsets.zero,
                                    minimumSize: const Size(0, 26),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  child: const Text(
                                    '查看',
                                    style: TextStyle(fontSize: 11),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                // Recipes section
                SliverToBoxAdapter(child: _buildSection('菜谱', action: '查看全部')),
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverGrid(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 0.72,
                        ),
                    delegate: SliverChildBuilderDelegate(
                      (ctx, i) => GestureDetector(
                        onTap: () => context.push('/recipe/${i + 1}'),
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x0A000000),
                                blurRadius: 24,
                              ),
                            ],
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Container(
                                  color: AppColors.surfaceSecondary,
                                  child: const Center(
                                    child: Icon(
                                      Icons.restaurant,
                                      size: 40,
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
                                      ['经典罗马培根蛋面', '手工宽面'][i % 2],
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.schedule,
                                          size: 14,
                                          color: AppColors.textSecondary,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          ['20分钟', '90分钟'][i % 2],
                                          style: Theme.of(context)
                                              .textTheme
                                              .labelSmall
                                              ?.copyWith(
                                                color: AppColors.textSecondary,
                                              ),
                                        ),
                                        const SizedBox(width: 12),
                                        const Icon(
                                          Icons.restaurant_menu,
                                          size: 14,
                                          color: AppColors.textSecondary,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          ['中等', '困难'][i % 2],
                                          style: Theme.of(context)
                                              .textTheme
                                              .labelSmall
                                              ?.copyWith(
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
                      ),
                      childCount: 2,
                    ),
                  ),
                ),
                // Posts section
                SliverToBoxAdapter(child: _buildSection('社区帖子')),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (ctx, i) => GestureDetector(
                        onTap: () =>
                            context.push('/post/${i == 0 ? 'p1' : 'p2'}'),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.divider),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        const CircleAvatar(
                                          radius: 12,
                                          backgroundColor:
                                              AppColors.surfaceSecondary,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          i == 0 ? 'Elena R.' : 'PastaKing99',
                                          style: Theme.of(context)
                                              .textTheme
                                              .labelSmall
                                              ?.copyWith(
                                                color: AppColors.textSecondary,
                                              ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      i == 0
                                          ? '在罗马发现了一家很棒的隐藏小店...'
                                          : '大家做肉酱面的秘密配料是什么？',
                                      style: Theme.of(
                                        context,
                                      ).textTheme.bodyMedium,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        _LikeButton(
                                          count: i == 0 ? '245' : '89',
                                        ),
                                        const SizedBox(width: 16),
                                        const Icon(
                                          Icons.mode_comment_outlined,
                                          size: 18,
                                          color: AppColors.textSecondary,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          i == 0 ? '12' : '45',
                                          style: Theme.of(context)
                                              .textTheme
                                              .labelSmall
                                              ?.copyWith(
                                                color: AppColors.textSecondary,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              if (i == 0) ...[
                                const SizedBox(width: 12),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: SizedBox(
                                    width: 96,
                                    height: 96,
                                    child: Container(
                                      color: AppColors.surfaceSecondary,
                                      child: const Icon(
                                        Icons.restaurant,
                                        color: AppColors.textPlaceholder,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      childCount: 2,
                    ),
                  ),
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
                  onRecipeTap: (id) {
                    _hideSuggest();
                    context.push('/recipe/$id');
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _submitSearch(String value) {
    if (value.trim().isEmpty) return;
    _hideSuggest();
  }

  void _useKeyword(String keyword) {
    _controller.text = keyword;
    _controller.selection = TextSelection.collapsed(offset: keyword.length);
    setState(() => _showSuggest = true);
    _focusNode.requestFocus();
  }

  void _hideSuggest() {
    _focusNode.unfocus();
    setState(() => _showSuggest = false);
  }

  Widget _buildSection(String title, {String? action}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: Theme.of(context).textTheme.headlineMedium),
          if (action != null)
            Text(
              action,
              style: Theme.of(
                context,
              ).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary),
            ),
        ],
      ),
    );
  }
}

class _SearchSuggestPanel extends StatelessWidget {
  final String query;
  final List<String> history;
  final List<String> hotSearches;
  final ValueChanged<String> onKeywordTap;
  final ValueChanged<String> onRecipeTap;

  const _SearchSuggestPanel({
    required this.query,
    required this.history,
    required this.hotSearches,
    required this.onKeywordTap,
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
            ? _SearchStarter(
                history: history,
                hotSearches: hotSearches,
                onKeywordTap: onKeywordTap,
              )
            : matches.isEmpty
            ? _NoMatch(query: query)
            : ListView.separated(
                shrinkWrap: true,
                padding: EdgeInsets.zero,
                itemCount: matches.length,
                separatorBuilder: (_, _) =>
                    const Divider(height: 1, color: AppColors.divider),
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
                      style: Theme.of(context).textTheme.labelMedium,
                    ),
                    subtitle: Text(
                      '${recipe.cookTime}分钟 · ${_cnDifficulty(recipe.difficulty)} · ${recipe.ingredientCount}种食材',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    trailing: const Icon(Icons.north_west, size: 16),
                    onTap: () => onRecipeTap(recipe.id),
                  );
                },
              ),
      ),
    );
  }

  List<Recipe> _matches(String value) {
    final keyword = value.toLowerCase();
    return mockRecipes
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
        .take(6)
        .toList();
  }
}

String _cnDifficulty(String difficulty) {
  switch (difficulty) {
    case 'Easy':
      return '简单';
    case 'Medium':
      return '中等';
    case 'Hard':
      return '困难';
    default:
      return difficulty;
  }
}

class _SearchStarter extends StatelessWidget {
  final List<String> history;
  final List<String> hotSearches;
  final ValueChanged<String> onKeywordTap;

  const _SearchStarter({
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
        _KeywordSection(
          title: '搜索历史',
          items: history,
          onKeywordTap: onKeywordTap,
        ),
        const SizedBox(height: 14),
        _KeywordSection(
          title: '热搜',
          items: hotSearches,
          onKeywordTap: onKeywordTap,
        ),
      ],
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

class _NoMatch extends StatelessWidget {
  final String query;

  const _NoMatch({required this.query});

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
              '没有找到与“$query”匹配的内容',
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

class _LikeButton extends StatefulWidget {
  final String count;
  const _LikeButton({required this.count});
  @override
  State<_LikeButton> createState() => _LikeButtonState();
}

class _LikeButtonState extends State<_LikeButton> {
  bool _liked = false;
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => setState(() => _liked = !_liked),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _liked ? Icons.favorite : Icons.favorite_border,
            size: 18,
            color: _liked ? AppColors.accent : AppColors.textSecondary,
          ),
          const SizedBox(width: 4),
          Text(
            widget.count,
            style: Theme.of(
              context,
            ).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
