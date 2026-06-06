import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/glass_theme.dart';
import '../../config/theme.dart';
import '../../data/api/app_exception.dart';
import '../../models/post.dart';
import '../../providers/api_providers.dart';
import '../../providers/collection_provider.dart';
import '../../widgets/capsule_toast.dart';

class PostDetailPage extends ConsumerWidget {
  final String postId;

  const PostDetailPage({super.key, required this.postId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postAsync = ref.watch(postByIdProvider(postId));

    return postAsync.when(
      loading: () => const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (error, _) => Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('帖子详情'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, size: 20),
            onPressed: () => Navigator.of(context).canPop()
                ? context.pop()
                : context.go('/'),
          ),
        ),
        body: _MessageState(
          message: error.toString(),
          onRetry: () => ref.invalidate(postByIdProvider(postId)),
        ),
      ),
      data: (post) => _PostDetailContent(post: post),
    );
  }
}

class _PostDetailContent extends ConsumerStatefulWidget {
  final Post post;

  const _PostDetailContent({required this.post});

  @override
  ConsumerState<_PostDetailContent> createState() => _PostDetailContentState();
}

class _PostDetailContentState extends ConsumerState<_PostDetailContent> {
  final _scrollController = ScrollController();
  final _commentsKey = GlobalKey();
  var _liked = false;
  var _likeBusy = false;
  late int _likes = widget.post.likes;

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _toggleLike() async {
    if (_likeBusy) return;
    setState(() => _likeBusy = true);
    try {
      final updated = await ref.read(postApiProvider).likePost(widget.post.id);
      if (!mounted) return;
      setState(() {
        _liked = !_liked;
        _likes = updated.likes;
      });
      ref.invalidate(postByIdProvider(widget.post.id));
      ref.invalidate(postListProvider);
    } catch (error) {
      final message = error is AppException ? error.message : error.toString();
      if (mounted) {
        showCapsuleToast(context, message, icon: Icons.error_outline);
      }
    } finally {
      if (mounted) setState(() => _likeBusy = false);
    }
  }

  void _bookmark() {
    showCapsuleToast(context, '收藏功能开发中', icon: Icons.bookmark_border);
  }

  Future<void> _share() async {
    final link = 'airecipe://post/${widget.post.id}';
    await Clipboard.setData(ClipboardData(text: link));
    if (!mounted) return;
    showCapsuleToast(context, '链接已复制', icon: Icons.ios_share);
  }

  void _scrollToComments() {
    final context = _commentsKey.currentContext;
    if (context == null) return;
    Scrollable.ensureVisible(
      context,
      duration: const Duration(milliseconds: 420),
      curve: Curves.easeOutCubic,
      alignment: 0.08,
    );
  }

  void _showMoreMenu() {
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
              _SheetAction(
                icon: Icons.ios_share,
                label: '分享帖子',
                onTap: () {
                  Navigator.pop(context);
                  _share();
                },
              ),
              _SheetAction(
                icon: Icons.flag_outlined,
                label: '举报内容',
                onTap: () {
                  Navigator.pop(context);
                  showCapsuleToast(context, '举报入口开发中');
                },
              ),
              _SheetAction(
                icon: Icons.visibility_off_outlined,
                label: '不感兴趣',
                onTap: () {
                  Navigator.pop(context);
                  showCapsuleToast(context, '将减少类似内容推荐');
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          CustomScrollView(
            controller: _scrollController,
            slivers: [
              SliverAppBar(
                pinned: true,
                backgroundColor: AppColors.background.withAlpha(230),
                title: const Text('社区帖子'),
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new, size: 20),
                  onPressed: () => Navigator.of(context).canPop()
                      ? context.pop()
                      : context.go('/'),
                ),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.more_horiz),
                    onPressed: _showMoreMenu,
                  ),
                ],
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 112),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _AuthorRow(post: post),
                      const SizedBox(height: 16),
                      Text(
                        post.content,
                        style: Theme.of(
                          context,
                        ).textTheme.bodyLarge?.copyWith(height: 1.55),
                      ),
                      if (post.imageUrls.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        _PostImages(imageUrls: post.imageUrls),
                      ],
                      const SizedBox(height: 16),
                      _EngagementRow(
                        likes: _likes,
                        comments: post.comments,
                        favorites: post.favorites,
                      ),
                      const SizedBox(height: 28),
                      _CommentsSection(key: _commentsKey),
                    ],
                  ),
                ),
              ),
            ],
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 16 + MediaQuery.of(context).padding.bottom,
            child: _BottomActionBar(
              liked: _liked,
              likeBusy: _likeBusy,
              onLike: _toggleLike,
              onBookmark: _bookmark,
              onComment: _scrollToComments,
              onShare: _share,
            ),
          ),
        ],
      ),
    );
  }
}

class _AuthorRow extends StatelessWidget {
  final Post post;

  const _AuthorRow({required this.post});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: GlassTheme.glassDecoration(
        borderRadius: 18,
        bgColor: const Color(0xCCFFFFFF),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: SizedBox(
              width: 44,
              height: 44,
              child: post.authorAvatar.isEmpty
                  ? const ColoredBox(
                      color: AppColors.surfaceSecondary,
                      child: Icon(Icons.person, color: AppColors.textSecondary),
                    )
                  : CachedNetworkImage(
                      imageUrl: post.authorAvatar,
                      fit: BoxFit.cover,
                      errorWidget: (_, _, _) => const Icon(
                        Icons.person,
                        color: AppColors.textSecondary,
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  post.authorName.isEmpty ? '小厨子用户' : post.authorName,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  post.timeAgo.isEmpty ? '刚刚发布' : post.timeAgo,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PostImage extends StatelessWidget {
  final String imageUrl;

  const _PostImage({required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: AspectRatio(
        aspectRatio: 1,
        child: CachedNetworkImage(
          imageUrl: imageUrl,
          fit: BoxFit.cover,
          errorWidget: (_, _, _) => Container(
            color: AppColors.surfaceSecondary,
            child: const Icon(
              Icons.restaurant,
              size: 48,
              color: AppColors.textPlaceholder,
            ),
          ),
        ),
      ),
    );
  }
}

class _PostImages extends StatelessWidget {
  final List<String> imageUrls;

  const _PostImages({required this.imageUrls});

  @override
  Widget build(BuildContext context) {
    if (imageUrls.length == 1) {
      return _PostImage(imageUrl: imageUrls.first);
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: imageUrls.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemBuilder: (context, index) => _PostImage(imageUrl: imageUrls[index]),
    );
  }
}

class _EngagementRow extends StatelessWidget {
  final int likes;
  final int comments;
  final int favorites;

  const _EngagementRow({
    required this.likes,
    required this.comments,
    required this.favorites,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _Metric(icon: Icons.favorite_border, value: likes, label: '点赞'),
          _Metric(icon: Icons.bookmark_border, value: favorites, label: '收藏'),
          _Metric(
            icon: Icons.mode_comment_outlined,
            value: comments,
            label: '评论',
          ),
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  final IconData icon;
  final int value;
  final String label;

  const _Metric({required this.icon, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: AppColors.textSecondary),
        const SizedBox(width: 6),
        Text(
          '$value',
          style: Theme.of(
            context,
          ).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(width: 4),
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

class _CommentsSection extends StatelessWidget {
  const _CommentsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('评论', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 12),
          const Text(
            '评论接口暂未开放，后续会在这里展示真实评论列表。',
            style: TextStyle(color: AppColors.textSecondary, height: 1.5),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => showCapsuleToast(
              context,
              '评论功能开发中',
              icon: Icons.mode_comment_outlined,
            ),
            icon: const Icon(Icons.mode_comment_outlined),
            label: const Text('写评论'),
          ),
        ],
      ),
    );
  }
}

class _BottomActionBar extends StatelessWidget {
  final bool liked;
  final bool likeBusy;
  final VoidCallback onLike;
  final VoidCallback onBookmark;
  final VoidCallback onComment;
  final VoidCallback onShare;

  const _BottomActionBar({
    required this.liked,
    required this.likeBusy,
    required this.onLike,
    required this.onBookmark,
    required this.onComment,
    required this.onShare,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: GlassTheme.glassDecoration(
        borderRadius: GlassTheme.navRadius,
        bgColor: const Color(0xE6FFFFFF),
      ),
      child: Row(
        children: [
          _IconAction(
            icon: liked ? Icons.favorite : Icons.favorite_border,
            active: liked,
            onTap: likeBusy ? null : onLike,
          ),
          _IconAction(
            icon: Icons.bookmark_border,
            active: false,
            onTap: onBookmark,
          ),
          _IconAction(icon: Icons.ios_share, active: false, onTap: onShare),
          const SizedBox(width: 8),
          Expanded(
            child: SizedBox(
              height: 44,
              child: FilledButton.icon(
                onPressed: onComment,
                icon: const Icon(Icons.mode_comment_outlined, size: 18),
                label: const Text('评论'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.textPrimary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _IconAction extends StatelessWidget {
  final IconData icon;
  final bool active;
  final VoidCallback? onTap;

  const _IconAction({
    required this.icon,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 44,
        height: 48,
        child: AnimatedScale(
          scale: active ? 1.08 : 1,
          duration: const Duration(milliseconds: 180),
          child: Icon(
            icon,
            color: active ? AppColors.accent : AppColors.textSecondary,
            size: 24,
          ),
        ),
      ),
    );
  }
}

class _SheetAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _SheetAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.textPrimary),
      title: Text(label, style: Theme.of(context).textTheme.bodyMedium),
      onTap: onTap,
    );
  }
}

class _MessageState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _MessageState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.article_outlined,
              size: 42,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            TextButton(onPressed: onRetry, child: const Text('重试')),
          ],
        ),
      ),
    );
  }
}
