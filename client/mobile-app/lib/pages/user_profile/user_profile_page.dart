import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../data/api/app_exception.dart';
import '../../models/recipe.dart';
import '../../models/user.dart';
import '../../providers/api_providers.dart';
import '../../widgets/capsule_toast.dart';

class UserProfilePage extends ConsumerStatefulWidget {
  final String userId;

  const UserProfilePage({super.key, required this.userId});

  @override
  ConsumerState<UserProfilePage> createState() => _UserProfilePageState();
}

class _UserProfilePageState extends ConsumerState<UserProfilePage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  AppUser? _profile;
  List<Recipe> _works = const [];
  var _isLoading = true;
  var _isFollowing = false;
  var _isFollowBusy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        ref.read(userApiProvider).getUserProfile(widget.userId),
        ref.read(recipeApiProvider).getRecipes(authorId: widget.userId),
      ]);
      if (!mounted) return;
      final profile = results[0] as AppUser;
      setState(() {
        _profile = profile;
        _isFollowing = profile.isFollowing;
        _works = results[1] as List<Recipe>;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error = error is AppException ? error.message : error.toString();
      });
    }
  }

  Future<void> _toggleFollow() async {
    final profile = _profile;
    if (profile == null || _isFollowBusy) return;
    setState(() => _isFollowBusy = true);
    try {
      if (_isFollowing) {
        await ref.read(userApiProvider).unfollowUser(profile.id);
      } else {
        await ref.read(userApiProvider).followUser(profile.id);
      }
      if (!mounted) return;
      setState(() => _isFollowing = !_isFollowing);
      showCapsuleToast(
        context,
        _isFollowing ? '已关注' : '已取消关注',
        icon: Icons.check_circle_outline,
      );
    } catch (error) {
      final message = error is AppException ? error.message : error.toString();
      if (mounted) {
        showCapsuleToast(context, message, icon: Icons.error_outline);
      }
    } finally {
      if (mounted) setState(() => _isFollowBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = _profile;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () =>
              Navigator.of(context).canPop() ? context.pop() : context.go('/'),
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_horiz),
            color: AppColors.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            onSelected: (value) => showCapsuleToast(context, value),
            itemBuilder: (context) => const [
              PopupMenuItem(value: '主页链接已复制', child: Text('分享主页')),
              PopupMenuItem(value: '举报入口开发中', child: Text('举报用户')),
              PopupMenuItem(value: '黑名单功能开发中', child: Text('拉黑用户')),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _ErrorState(message: _error!, onRetry: _load)
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.only(bottom: 100),
                children: [
                  const SizedBox(height: 20),
                  _ProfileHeader(
                    profile: profile!,
                    isFollowing: _isFollowing,
                    isBusy: _isFollowBusy,
                    onFollow: _toggleFollow,
                  ),
                  const SizedBox(height: 20),
                  _Stats(profile: profile, worksCount: _works.length),
                  const SizedBox(height: 16),
                  TabBar(
                    controller: _tabController,
                    labelColor: AppColors.textPrimary,
                    unselectedLabelColor: AppColors.textSecondary,
                    indicatorColor: AppColors.textPrimary,
                    tabs: const [
                      Tab(text: '作品'),
                      Tab(text: '帖子'),
                      Tab(text: '收藏'),
                    ],
                  ),
                  SizedBox(
                    height: 520,
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        _WorksGrid(recipes: _works),
                        const _PlaceholderTab(text: '帖子接口暂未开放'),
                        _CollectionsList(
                          collections: profile.publicCollections,
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

class _ProfileHeader extends StatelessWidget {
  final AppUser profile;
  final bool isFollowing;
  final bool isBusy;
  final VoidCallback onFollow;

  const _ProfileHeader({
    required this.profile,
    required this.isFollowing,
    required this.isBusy,
    required this.onFollow,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          CircleAvatar(
            radius: 64,
            backgroundColor: AppColors.surfaceSecondary,
            backgroundImage: profile.avatar.isNotEmpty
                ? CachedNetworkImageProvider(profile.avatar)
                : null,
            child: profile.avatar.isEmpty
                ? const Icon(
                    Icons.person,
                    size: 64,
                    color: AppColors.textSecondary,
                  )
                : null,
          ),
          const SizedBox(height: 12),
          Text(
            profile.nickname.isEmpty ? '小厨子用户' : profile.nickname,
            style: Theme.of(
              context,
            ).textTheme.displayLarge?.copyWith(fontSize: 28),
          ),
          const SizedBox(height: 8),
          Text(
            profile.bio.isEmpty ? '这个用户还没有写简介。' : profile.bio,
            textAlign: TextAlign.center,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: 132,
            child: FilledButton(
              onPressed: isBusy ? null : onFollow,
              child: Text(isFollowing ? '已关注' : '关注'),
            ),
          ),
        ],
      ),
    );
  }
}

class _Stats extends StatelessWidget {
  final AppUser profile;
  final int worksCount;

  const _Stats({required this.profile, required this.worksCount});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x0A000000)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _StatColumn(value: profile.followers.toString(), label: '粉丝'),
          _StatColumn(value: profile.following.toString(), label: '关注'),
          _StatColumn(value: worksCount.toString(), label: '作品'),
          _StatColumn(value: profile.collections.toString(), label: '收藏'),
        ],
      ),
    );
  }
}

class _WorksGrid extends StatelessWidget {
  final List<Recipe> recipes;

  const _WorksGrid({required this.recipes});

  @override
  Widget build(BuildContext context) {
    if (recipes.isEmpty) return const _PlaceholderTab(text: '还没有公开作品');

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.78,
      ),
      itemCount: recipes.length,
      itemBuilder: (context, index) {
        final recipe = recipes[index];
        return GestureDetector(
          onTap: () => context.push('/recipe/${recipe.id}'),
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [
                BoxShadow(color: Color(0x0A000000), blurRadius: 24),
              ],
              border: Border.all(color: const Color(0x0A000000)),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: recipe.coverImage.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: recipe.coverImage,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          errorWidget: (_, _, _) =>
                              Container(color: AppColors.surfaceSecondary),
                        )
                      : Container(color: AppColors.surfaceSecondary),
                ),
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    recipe.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _CollectionsList extends StatelessWidget {
  final List<PublicCollection> collections;

  const _CollectionsList({required this.collections});

  @override
  Widget build(BuildContext context) {
    if (collections.isEmpty) return const _PlaceholderTab(text: '暂无公开收藏夹');

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: collections.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final collection = collections[index];
        return ListTile(
          tileColor: AppColors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          leading: collection.coverImage.isNotEmpty
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: CachedNetworkImage(
                    imageUrl: collection.coverImage,
                    width: 48,
                    height: 48,
                    fit: BoxFit.cover,
                  ),
                )
              : const Icon(Icons.collections_bookmark_outlined),
          title: Text(collection.name),
          subtitle: Text('${collection.itemCount} 个收藏'),
        );
      },
    );
  }
}

class _StatColumn extends StatelessWidget {
  final String value;
  final String label;

  const _StatColumn({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

class _PlaceholderTab extends StatelessWidget {
  final String text;

  const _PlaceholderTab({required this.text});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(text, style: const TextStyle(color: AppColors.textSecondary)),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(message, style: const TextStyle(color: AppColors.textSecondary)),
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('重新加载'),
          ),
        ],
      ),
    );
  }
}
