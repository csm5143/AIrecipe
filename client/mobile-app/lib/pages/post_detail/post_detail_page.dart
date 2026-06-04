import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/glass_theme.dart';
import '../../config/theme.dart';
import '../../models/post.dart';
import '../../providers/collection_provider.dart';
import '../../widgets/capsule_toast.dart';

class PostDetailPage extends ConsumerWidget {
  final String postId;

  const PostDetailPage({super.key, required this.postId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final post = ref.watch(postByIdProvider(postId));

    if (post == null) {
      return Scaffold(
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
        body: const Center(child: Text('帖子未找到')),
      );
    }

    return _PostDetailContent(post: post);
  }
}

class _PostDetailContent extends StatefulWidget {
  final Post post;

  const _PostDetailContent({required this.post});

  @override
  State<_PostDetailContent> createState() => _PostDetailContentState();
}

class _PostDetailContentState extends State<_PostDetailContent> {
  final _scrollController = ScrollController();
  final _commentController = TextEditingController();
  final _commentFocus = FocusNode();
  final _commentsKey = GlobalKey();
  bool _liked = false;
  bool _bookmarked = false;
  bool _following = false;

  @override
  void dispose() {
    _scrollController.dispose();
    _commentController.dispose();
    _commentFocus.dispose();
    super.dispose();
  }

  void _scrollToComments() {
    final context = _commentsKey.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 420),
        curve: Curves.easeOutCubic,
        alignment: 0.08,
      );
    }
    Future.delayed(const Duration(milliseconds: 260), () {
      if (mounted) _commentFocus.requestFocus();
    });
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
                onTap: () => _closeWithSnack('分享面板稍后接入'),
              ),
              _SheetAction(
                icon: Icons.flag_outlined,
                label: '举报内容',
                onTap: () => _closeWithSnack('已收到举报入口'),
              ),
              _SheetAction(
                icon: Icons.visibility_off_outlined,
                label: '不感兴趣',
                onTap: () => _closeWithSnack('将减少类似内容推荐'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _closeWithSnack(String message) {
    Navigator.pop(context);
    showCapsuleToast(context, message);
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
                      _AuthorRow(
                        post: post,
                        following: _following,
                        onToggleFollow: () =>
                            setState(() => _following = !_following),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        post.content,
                        style: Theme.of(
                          context,
                        ).textTheme.bodyLarge?.copyWith(height: 1.55),
                      ),
                      const SizedBox(height: 16),
                      _PostImage(imageUrl: post.imageUrl),
                      const SizedBox(height: 16),
                      _EngagementRow(
                        likes: post.likes + (_liked ? 1 : 0),
                        comments: post.comments,
                        favorites: post.favorites + (_bookmarked ? 1 : 0),
                      ),
                      const SizedBox(height: 28),
                      _CommentsSection(
                        key: _commentsKey,
                        controller: _commentController,
                        focusNode: _commentFocus,
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
            bottom: 16 + MediaQuery.of(context).padding.bottom,
            child: _BottomActionBar(
              liked: _liked,
              bookmarked: _bookmarked,
              onLike: () => setState(() => _liked = !_liked),
              onBookmark: () => setState(() => _bookmarked = !_bookmarked),
              onComment: _scrollToComments,
            ),
          ),
        ],
      ),
    );
  }
}

class _AuthorRow extends StatelessWidget {
  final Post post;
  final bool following;
  final VoidCallback onToggleFollow;

  const _AuthorRow({
    required this.post,
    required this.following,
    required this.onToggleFollow,
  });

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
                  post.authorName,
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
          GestureDetector(
            onTap: onToggleFollow,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
              decoration: BoxDecoration(
                color: following
                    ? AppColors.surfaceSecondary
                    : AppColors.textPrimary,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Text(
                following ? '已关注' : '关注',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: following
                      ? AppColors.textSecondary
                      : AppColors.surface,
                ),
              ),
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
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 24,
            offset: Offset(0, 4),
          ),
        ],
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
  final TextEditingController controller;
  final FocusNode focusNode;

  const _CommentsSection({
    super.key,
    required this.controller,
    required this.focusNode,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('评论', style: Theme.of(context).textTheme.headlineMedium),
            Row(
              children: [
                Text('最新', style: Theme.of(context).textTheme.labelMedium),
                const SizedBox(width: 12),
                Text(
                  '最热',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 12),
        _CommentTile(
          name: 'Mia',
          time: '12分钟前',
          content: '这个饼底看起来太漂亮了，边缘烤色刚刚好。',
        ),
        _CommentTile(name: '小食家', time: '1小时前', content: '秘密酱汁也想看，已经收藏等更新。'),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.divider),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  focusNode: focusNode,
                  minLines: 1,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    hintText: '写下你的评论',
                    hintStyle: TextStyle(color: AppColors.textPlaceholder),
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.send_rounded, color: AppColors.accent),
                onPressed: () {
                  controller.clear();
                  focusNode.unfocus();
                  showCapsuleToast(
                    context,
                    '评论已暂存',
                    icon: Icons.mode_comment_outlined,
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CommentTile extends StatelessWidget {
  final String name;
  final String time;
  final String content;

  const _CommentTile({
    required this.name,
    required this.time,
    required this.content,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CircleAvatar(
            radius: 18,
            backgroundColor: AppColors.surfaceSecondary,
            child: Icon(Icons.person, size: 18, color: AppColors.textSecondary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      name,
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      time,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  content,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(
            Icons.favorite_border,
            size: 18,
            color: AppColors.textPlaceholder,
          ),
        ],
      ),
    );
  }
}

class _BottomActionBar extends StatelessWidget {
  final bool liked;
  final bool bookmarked;
  final VoidCallback onLike;
  final VoidCallback onBookmark;
  final VoidCallback onComment;

  const _BottomActionBar({
    required this.liked,
    required this.bookmarked,
    required this.onLike,
    required this.onBookmark,
    required this.onComment,
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
            onTap: onLike,
          ),
          _IconAction(
            icon: bookmarked ? Icons.bookmark : Icons.bookmark_border,
            active: bookmarked,
            onTap: onBookmark,
          ),
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
  final VoidCallback onTap;

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
        width: 48,
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
