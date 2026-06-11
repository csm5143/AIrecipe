import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../config/theme.dart';
import '../../../data/api/app_exception.dart';
import '../../../data/api/auth_storage.dart';
import '../../../models/comment.dart';
import '../../../providers/api_providers.dart';
import '../../../widgets/capsule_toast.dart';

class RecipeCommentsSection extends ConsumerStatefulWidget {
  final String recipeId;

  const RecipeCommentsSection({super.key, required this.recipeId});

  @override
  ConsumerState<RecipeCommentsSection> createState() =>
      RecipeCommentsSectionState();
}

class RecipeCommentsSectionState extends ConsumerState<RecipeCommentsSection> {
  final _inputController = TextEditingController();
  final _inputFocusNode = FocusNode();
  final _comments = <RecipeComment>[];
  final _expandedReplies = <String>{};
  bool _loading = true;
  bool _loadingMore = false;
  bool _sending = false;
  bool _hasMore = true;
  int _page = 0;
  int _total = 0;
  RecipeComment? _replyTarget;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load(refresh: true);
  }

  @override
  void didUpdateWidget(covariant RecipeCommentsSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.recipeId != widget.recipeId) {
      _comments.clear();
      _expandedReplies.clear();
      _replyTarget = null;
      _inputController.clear();
      _load(refresh: true);
    }
  }

  @override
  void dispose() {
    _inputController.dispose();
    _inputFocusNode.dispose();
    super.dispose();
  }

  bool get canLoadMore => !_loading && !_loadingMore && _hasMore;

  Future<void> loadMore() async {
    if (!canLoadMore) return;
    await _load();
  }

  void focusComposer() {
    _inputFocusNode.requestFocus();
  }

  Future<void> _load({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _loading = true;
        _page = 0;
        _hasMore = true;
        _error = null;
      });
    } else {
      setState(() => _loadingMore = true);
    }

    try {
      final result = await ref
          .read(commentApiProvider)
          .getRecipeComments(
            widget.recipeId,
            page: refresh ? 1 : _page + 1,
            pageSize: 12,
          );
      if (!mounted) return;
      setState(() {
        if (refresh) _comments.clear();
        _comments.addAll(result.items);
        _page = result.page;
        _total = result.total;
        _hasMore = result.hasMore;
        _loading = false;
        _loadingMore = false;
        _error = null;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _loadingMore = false;
        _error = error is AppException ? error.message : '评论加载失败';
      });
    }
  }

  Future<bool> _ensureSignedIn() async {
    final token = await AuthStorage.getToken();
    if (token.isNotEmpty) return true;
    if (!mounted) return false;
    showCapsuleToast(context, '请先登录', icon: Icons.person_outline);
    context.push('/login');
    return false;
  }

  Future<void> _send() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _sending) return;
    if (!await _ensureSignedIn()) return;

    setState(() => _sending = true);
    try {
      if (_replyTarget == null) {
        final created = await ref
            .read(commentApiProvider)
            .createComment(widget.recipeId, text);
        if (!mounted) return;
        setState(() {
          _comments.insert(0, created);
          _total += 1;
          _inputController.clear();
          _replyTarget = null;
        });
      } else {
        final target = _replyTarget!;
        final reply = await ref
            .read(commentApiProvider)
            .replyComment(target.id, text);
        if (!mounted) return;
        _insertReply(target, reply);
        setState(() {
          _inputController.clear();
          _replyTarget = null;
          _total += 1;
        });
      }
    } catch (error) {
      if (mounted) {
        final message = error is AppException ? error.message : '发送失败';
        showCapsuleToast(context, message, icon: Icons.error_outline);
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _insertReply(RecipeComment target, RecipeComment reply) {
    final parentIndex = _comments.indexWhere(
      (item) =>
          item.id == target.id || item.replies.any((r) => r.id == target.id),
    );
    if (parentIndex < 0) return;
    final parent = _comments[parentIndex];
    final replies = [...parent.replies, reply];
    _comments[parentIndex] = parent.copyWith(
      replies: replies,
      replyCount: parent.replyCount + 1,
    );
    _expandedReplies.add(parent.id);
  }

  void _replyTo(RecipeComment comment) {
    setState(() => _replyTarget = comment);
    _inputFocusNode.requestFocus();
  }

  Future<void> _toggleLike(RecipeComment comment, {String? parentId}) async {
    if (!await _ensureSignedIn()) return;
    try {
      final result = await ref.read(commentApiProvider).toggleLike(comment.id);
      if (!mounted) return;
      setState(() {
        _replaceComment(
          comment.id,
          comment.copyWith(isLiked: result.liked, likeCount: result.likeCount),
          parentId: parentId,
        );
      });
    } catch (error) {
      if (mounted) {
        final message = error is AppException ? error.message : '操作失败';
        showCapsuleToast(context, message, icon: Icons.error_outline);
      }
    }
  }

  Future<void> _expandReplies(RecipeComment comment) async {
    if (_expandedReplies.contains(comment.id)) return;
    try {
      final result = await ref
          .read(commentApiProvider)
          .getCommentReplies(comment.id, page: 1, pageSize: 50);
      if (!mounted) return;
      setState(() {
        final index = _comments.indexWhere((item) => item.id == comment.id);
        if (index >= 0) {
          _comments[index] = _comments[index].copyWith(
            replies: result.items,
            replyCount: result.total,
          );
          _expandedReplies.add(comment.id);
        }
      });
    } catch (error) {
      if (mounted) {
        final message = error is AppException ? error.message : '回复加载失败';
        showCapsuleToast(context, message, icon: Icons.error_outline);
      }
    }
  }

  void _replaceComment(String id, RecipeComment updated, {String? parentId}) {
    if (parentId == null) {
      final index = _comments.indexWhere((item) => item.id == id);
      if (index >= 0) _comments[index] = updated;
      return;
    }

    final parentIndex = _comments.indexWhere((item) => item.id == parentId);
    if (parentIndex < 0) return;
    final parent = _comments[parentIndex];
    final replies = [...parent.replies];
    final replyIndex = replies.indexWhere((item) => item.id == id);
    if (replyIndex >= 0) {
      replies[replyIndex] = updated;
      _comments[parentIndex] = parent.copyWith(replies: replies);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '评论 ${_total > 0 ? _total : ''}',
                  style: Theme.of(
                    context,
                  ).textTheme.headlineMedium?.copyWith(fontSize: 20),
                ),
              ),
              const Text(
                '下滑查看更多',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _CommentComposer(
            controller: _inputController,
            focusNode: _inputFocusNode,
            replyTarget: _replyTarget,
            sending: _sending,
            onCancelReply: () => setState(() => _replyTarget = null),
            onSend: _send,
          ),
          const SizedBox(height: 16),
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
            )
          else if (_error != null)
            _CommentError(message: _error!, onRetry: () => _load(refresh: true))
          else if (_comments.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 28),
              child: Center(
                child: Text(
                  '还没有评论，来分享你的做菜心得',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              ),
            )
          else ...[
            ..._comments.map(
              (comment) => _CommentItem(
                comment: comment,
                expanded: _expandedReplies.contains(comment.id),
                onReply: _replyTo,
                onLike: _toggleLike,
                onExpandReplies: _expandReplies,
              ),
            ),
            if (_loadingMore)
              const Padding(
                padding: EdgeInsets.all(18),
                child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
              )
            else if (!_hasMore)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Center(
                  child: Text(
                    '已经到底啦',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _CommentComposer extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final RecipeComment? replyTarget;
  final bool sending;
  final VoidCallback onCancelReply;
  final VoidCallback onSend;

  const _CommentComposer({
    required this.controller,
    required this.focusNode,
    required this.replyTarget,
    required this.sending,
    required this.onCancelReply,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (replyTarget != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    '回复 @${replyTarget!.user.nickname}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: onCancelReply,
                  child: const Icon(Icons.close, size: 18),
                ),
              ],
            ),
          ),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                focusNode: focusNode,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => onSend(),
                decoration: InputDecoration(
                  hintText: replyTarget == null ? '说点什么...' : '写下你的回复...',
                  filled: true,
                  fillColor: AppColors.surfaceSecondary,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 11,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            SizedBox(
              height: 40,
              child: FilledButton(
                onPressed: sending ? null : onSend,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.textPrimary,
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: sending
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('发送'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _CommentItem extends StatelessWidget {
  final RecipeComment comment;
  final bool expanded;
  final ValueChanged<RecipeComment> onReply;
  final Future<void> Function(RecipeComment comment, {String? parentId}) onLike;
  final ValueChanged<RecipeComment> onExpandReplies;

  const _CommentItem({
    required this.comment,
    required this.expanded,
    required this.onReply,
    required this.onLike,
    required this.onExpandReplies,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Avatar(url: comment.user.avatar, size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            comment.user.nickname,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${_timeAgo(comment.createdAt)}  回复',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    _LikeButton(comment: comment, onTap: () => onLike(comment)),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  comment.content,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 16,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () => onReply(comment),
                  child: const Text(
                    '回复',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                if (comment.replies.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  ...comment.replies.map(
                    (reply) => _ReplyItem(
                      parentId: comment.id,
                      reply: reply,
                      onReply: onReply,
                      onLike: onLike,
                    ),
                  ),
                ],
                if (comment.replyCount > comment.replies.length)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: GestureDetector(
                      onTap: () => onExpandReplies(comment),
                      child: Text(
                        '展开 ${comment.replyCount} 条回复',
                        style: const TextStyle(
                          color: AppColors.accent,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
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

class _ReplyItem extends StatelessWidget {
  final String parentId;
  final RecipeComment reply;
  final ValueChanged<RecipeComment> onReply;
  final Future<void> Function(RecipeComment comment, {String? parentId}) onLike;

  const _ReplyItem({
    required this.parentId,
    required this.reply,
    required this.onReply,
    required this.onLike,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Avatar(url: reply.user.avatar, size: 28),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        reply.user.nickname,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    _LikeButton(
                      comment: reply,
                      compact: true,
                      onTap: () => onLike(reply, parentId: parentId),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  '${_timeAgo(reply.createdAt)}  回复',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  reply.content,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 14,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 5),
                GestureDetector(
                  onTap: () => onReply(reply),
                  child: const Text(
                    '回复',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
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

class _LikeButton extends StatelessWidget {
  final RecipeComment comment;
  final VoidCallback onTap;
  final bool compact;

  const _LikeButton({
    required this.comment,
    required this.onTap,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.only(left: 10, bottom: 6),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${comment.likeCount}',
              style: TextStyle(
                color: comment.isLiked
                    ? AppColors.accent
                    : AppColors.textSecondary,
                fontSize: compact ? 12 : 13,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              comment.isLiked
                  ? Icons.thumb_up_alt
                  : Icons.thumb_up_alt_outlined,
              size: compact ? 16 : 20,
              color: comment.isLiked
                  ? AppColors.accent
                  : AppColors.textSecondary,
            ),
          ],
        ),
      ),
    );
  }
}

class _CommentError extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _CommentError({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(
        children: [
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: onRetry, child: const Text('重新加载')),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final String url;
  final double size;

  const _Avatar({required this.url, required this.size});

  @override
  Widget build(BuildContext context) {
    return ClipOval(
      child: SizedBox(
        width: size,
        height: size,
        child: url.isEmpty
            ? Container(
                color: AppColors.surfaceSecondary,
                child: Icon(Icons.person, size: size * 0.55),
              )
            : CachedNetworkImage(
                imageUrl: url,
                fit: BoxFit.cover,
                errorWidget: (_, _, _) => Container(
                  color: AppColors.surfaceSecondary,
                  child: Icon(Icons.person, size: size * 0.55),
                ),
              ),
      ),
    );
  }
}

String _timeAgo(DateTime time) {
  final diff = DateTime.now().difference(time);
  if (diff.inMinutes < 1) return '刚刚';
  if (diff.inHours < 1) return '${diff.inMinutes}分钟前';
  if (diff.inDays < 1) return '${diff.inHours}小时前';
  if (diff.inDays < 7) return '${diff.inDays}天前';
  return '${time.month}/${time.day}';
}
