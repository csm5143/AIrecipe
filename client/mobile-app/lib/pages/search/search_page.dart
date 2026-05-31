import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';

/// 搜索结果页 — 搜索栏 + 筛选Tab + 用户卡片 + 食谱 + 社区帖子
class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final _controller = TextEditingController(text: 'Pasta');
  int _filterIndex = 0;
  static const _filters = ['All', 'Recipes', 'Users', 'Posts'];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
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
                child: Row(children: [
                  const Icon(Icons.search, color: AppColors.textSecondary, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      style: const TextStyle(fontSize: 15),
                      decoration: const InputDecoration(border: InputBorder.none, isDense: true, contentPadding: EdgeInsets.zero),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => _controller.clear(),
                    child: const Icon(Icons.cancel, color: AppColors.textSecondary, size: 18),
                  ),
                ]),
              ),
              leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.of(context).canPop() ? context.pop() : context.go('/')),
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
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        decoration: BoxDecoration(
                          color: i == _filterIndex ? AppColors.textPrimary : AppColors.surfaceSecondary,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(_filters[i], style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: i == _filterIndex ? AppColors.surface : AppColors.textSecondary)),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            // Users section
            SliverToBoxAdapter(child: _buildSection('Users', action: 'See all')),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 172,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: 4,
                  itemBuilder: (ctx, i) => Container(
                    width: 128, margin: const EdgeInsets.only(right: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0x0A000000))),
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      const CircleAvatar(radius: 30, backgroundColor: AppColors.surfaceSecondary),
                      const SizedBox(height: 6),
                      Text(['Mia Pasta', 'Chef Luigi', 'Sarah Bakes', 'Pasta Lover'][i], style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500), textAlign: TextAlign.center, overflow: TextOverflow.ellipsis),
                      Text('${[12, 8, 45, 1][i]}k Followers', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary)),
                      const SizedBox(height: 6),
                      SizedBox(width: double.infinity, height: 26, child: FilledButton(onPressed: () {}, style: FilledButton.styleFrom(backgroundColor: AppColors.textPrimary, padding: EdgeInsets.zero, minimumSize: const Size(0, 26), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))), child: const Text('Follow', style: TextStyle(fontSize: 11)))),
                    ]),
                  ),
                ),
              ),
            ),
            // Recipes section
            SliverToBoxAdapter(child: _buildSection('Recipes', action: 'See all')),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.72),
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) => Container(
                    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)]),
                    clipBehavior: Clip.antiAlias,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Expanded(child: Container(color: AppColors.surfaceSecondary, child: const Center(child: Icon(Icons.restaurant, size: 40, color: AppColors.textPlaceholder)))),
                      Padding(
                        padding: const EdgeInsets.all(10),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(['Classic Roman Carbonara', 'Handmade Tagliatelle'][i % 2], maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                          const SizedBox(height: 4),
                          Row(children: [
                            const Icon(Icons.schedule, size: 14, color: AppColors.textSecondary),
                            const SizedBox(width: 4),
                            Text(['20m', '1h 30m'][i % 2], style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary)),
                            const SizedBox(width: 12),
                            const Icon(Icons.restaurant_menu, size: 14, color: AppColors.textSecondary),
                            const SizedBox(width: 4),
                            Text(['Medium', 'Hard'][i % 2], style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary)),
                          ]),
                        ]),
                      ),
                    ]),
                  ),
                  childCount: 2,
                ),
              ),
            ),
            // Posts section
            SliverToBoxAdapter(child: _buildSection('Community Posts')),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) => Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.divider)),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [const CircleAvatar(radius: 12, backgroundColor: AppColors.surfaceSecondary), const SizedBox(width: 8), Text(i == 0 ? 'Elena R.' : 'PastaKing99', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary))]),
                          const SizedBox(height: 8),
                          Text(i == 0 ? 'Found this amazing hidden gem in Rome...' : "What's everyone's secret ingredient for the perfect bolognese?", style: Theme.of(context).textTheme.bodyMedium, maxLines: 2, overflow: TextOverflow.ellipsis),
                          const SizedBox(height: 8),
                          Row(children: [
                            _LikeButton(count: i == 0 ? '245' : '89'), const SizedBox(width: 16),
                            const Icon(Icons.mode_comment_outlined, size: 18, color: AppColors.textSecondary), const SizedBox(width: 4), Text(i == 0 ? '12' : '45', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary)),
                          ]),
                        ]),
                      ),
                      if (i == 0) ...[const SizedBox(width: 12), ClipRRect(borderRadius: BorderRadius.circular(8), child: SizedBox(width: 96, height: 96, child: Container(color: AppColors.surfaceSecondary, child: const Icon(Icons.restaurant, color: AppColors.textPlaceholder))))],
                    ]),
                  ),
                  childCount: 2,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, {String? action}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(title, style: Theme.of(context).textTheme.headlineMedium),
        if (action != null) Text(action, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary)),
      ]),
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
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(_liked ? Icons.favorite : Icons.favorite_border, size: 18, color: _liked ? AppColors.accent : AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(widget.count, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary)),
      ]),
    );
  }
}
