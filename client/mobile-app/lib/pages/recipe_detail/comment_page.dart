import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../config/theme.dart';
import '../../models/comment.dart';
import '../../providers/api_providers.dart';
import '../../widgets/capsule_toast.dart';

class RecipeCommentPage extends ConsumerStatefulWidget {
  final String recipeId;
  final String recipeTitle;

  const RecipeCommentPage({
    super.key,
    required this.recipeId,
    this.recipeTitle = '',
  });

  @override
  ConsumerState<RecipeCommentPage> createState() => _RecipeCommentPageState();
}

class _RecipeCommentPageState extends ConsumerState<RecipeCommentPage> {
  final _scrollController = ScrollController();
  final _inputController = TextEditingController();
  final _inputFocusNode = FocusNode();
  final _comments = <RecipeComment>[];
  bool _loading = true;
  bool _loadingMore = false;
  bool _sending = false;
  bool _hasMore = true;
  int _page = 0;
  int _total = 0;
  RecipeComment? _replyTarget;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _load(refresh: true);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _inputController.dispose();
    _inputFocusNode.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients || _loadingMore || !_hasMore) return;
    final position = _scrollController.position;
    if (position.pixels > position.maxScrollExtent - 320) {
      _load();
    }
  }

  Future<void> _load({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _loading = true;
        _page = 0;
        _hasMore = true;
      });
    } else {
      setState(() => _loadingMore = true);
    }

    try {
      final result = await ref
          .read(commentApiProvider)
          .getRecipeComments(widget.recipeId, page: refresh ? 1 : _page + 1);
      if (!mounted) return;
      setState(() {
        if (refresh) _comments.clear();
        _comments.addAll(result.items);
        _page = result.page;
        _total = result.total;
        _hasMore = result.hasMore;
        _loading = false;
        _loadingMore = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _loadingMore = false;
      });
      showCapsuleToast(context, '评论加载失败', icon: Icons.error_outline);
    }
  }

  Future<void> _send() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      if (_replyTarget == null) {
        await ref.read(commentApiProvider).createComment(widget.recipeId, text);
      } else {
        final target = _replyTarget!;
        await ref.read(commentApiProvider).replyComment(target.id, text);
      }
      if (!mounted) return;
      _inputController.clear();
      setState(() => _replyTarget = null);
      await _load(refresh: true);
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 240),
          curve: Curves.easeOut,
        );
      }
    } catch (_) {
      if (mounted) showCapsuleToast(context, '发送失败', icon: Icons.error_outline);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _replyTo(RecipeComment comment) {
    setState(() => _replyTarget = comment);
    _inputFocusNode.requestFocus();
  }

  Future<void> _toggleLike(RecipeComment comment, {String? parentId}) async {
    try {
      final result = await ref.read(commentApiProvider).toggleLike(comment.id);
      if (!mounted) return;
      setState(() {
        final updated = comment.copyWith(
          isLiked: result.liked,
          likeCount: result.likeCount,
        );
        if (parentId == null) {
          final index = _comments.indexWhere((item) => item.id == comment.id);
          if (index >= 0) _comments[index] = updated;
        } else {
          final parentIndex = _comments.indexWhere(
            (item) => item.id == parentId,
          );
          if (parentIndex >= 0) {
            final parent = _comments[parentIndex];
            final replies = [...parent.replies];
            final replyIndex = replies.indexWhere(
              (item) => item.id == comment.id,
            );
            if (replyIndex >= 0) replies[replyIndex] = updated;
            _comments[parentIndex] = parent.copyWith(replies: replies);
          }
        }
      });
    } catch (_) {
      if (mounted) showCapsuleToast(context, '操作失败', icon: Icons.error_outline);
    }
  }

  Future<void> _delete(RecipeComment comment) async {
    try {
      await ref.read(commentApiProvider).deleteComment(comment.id);
      if (!mounted) return;
      showCapsuleToast(context, '已删除');
      await _load(refresh: true);
    } catch (_) {
      if (mounted) showCapsuleToast(context, '删除失败', icon: Icons.error_outline);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text('评论 $_total'), centerTitle: false),
      body: Column(
        children: [
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _load(refresh: true),
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _comments.isEmpty
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: const [
                        SizedBox(height: 180),
                        Center(
                          child: Text(
                            '还没有评论，来坐第一排',
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                      itemCount: _comments.length + (_loadingMore ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index >= _comments.length) {
                          return const Padding(
                            padding: EdgeInsets.all(18),
                            child: Center(child: CircularProgressIndicator()),
                          );
                        }
                        return _CommentTile(
                          comment: _comments[index],
                          onReply: _replyTo,
                          onLike: _toggleLike,
                          onDelete: _delete,
                        );
                      },
                    ),
            ),
          ),
          _CommentInputBar(
            controller: _inputController,
            focusNode: _inputFocusNode,
            replyTarget: _replyTarget,
            sending: _sending,
            onCancelReply: () => setState(() => _replyTarget = null),
            onSend: _send,
          ),
        ],
      ),
    );
  }
}

class _CommentTile extends StatelessWidget {
  final RecipeComment comment;
  final ValueChanged<RecipeComment> onReply;
  final Future<void> Function(RecipeComment comment, {String? parentId}) onLike;
  final ValueChanged<RecipeComment> onDelete;

  const _CommentTile({
    required this.comment,
    required this.onReply,
    required this.onLike,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Avatar(url: comment.user.avatar, size: 38),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        comment.user.nickname,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    Text(
                      _timeAgo(comment.createdAt),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  comment.content,
                  style: const TextStyle(
                    fontSize: 15,
                    height: 1.45,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                _CommentActions(
                  comment: comment,
                  onReply: () => onReply(comment),
                  onLike: () => onLike(comment),
                  onDelete: () => onDelete(comment),
                ),
                if (comment.replies.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceSecondary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ...comment.replies.map(
                          (reply) => _ReplyRow(
                            parentId: comment.id,
                            reply: reply,
                            onReply: onReply,
                            onLike: onLike,
                          ),
                        ),
                        if (comment.replyCount > comment.replies.length)
                          Padding(
                            padding: const EdgeInsets.only(top: 6),
                            child: Text(
                              '查看全部${comment.replyCount}条回复',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.accent,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReplyRow extends StatelessWidget {
  final String parentId;
  final RecipeComment reply;
  final ValueChanged<RecipeComment> onReply;
  final Future<void> Function(RecipeComment comment, {String? parentId}) onLike;

  const _ReplyRow({
    required this.parentId,
    required this.reply,
    required this.onReply,
    required this.onLike,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: reply.user.nickname,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                TextSpan(text: '  ${reply.content}'),
              ],
            ),
            style: const TextStyle(
              fontSize: 14,
              height: 1.4,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          _CommentActions(
            compact: true,
            comment: reply,
            onReply: () => onReply(reply),
            onLike: () => onLike(reply, parentId: parentId),
          ),
        ],
      ),
    );
  }
}

class _CommentActions extends StatelessWidget {
  final RecipeComment comment;
  final VoidCallback onReply;
  final VoidCallback onLike;
  final VoidCallback? onDelete;
  final bool compact;

  const _CommentActions({
    required this.comment,
    required this.onReply,
    required this.onLike,
    this.onDelete,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        GestureDetector(
          onTap: onLike,
          child: Row(
            children: [
              Icon(
                comment.isLiked ? Icons.favorite : Icons.favorite_border,
                size: compact ? 14 : 16,
                color: comment.isLiked
                    ? AppColors.accent
                    : AppColors.textSecondary,
              ),
              const SizedBox(width: 4),
              Text(
                comment.likeCount > 0 ? '${comment.likeCount}' : '赞',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 18),
        GestureDetector(
          onTap: onReply,
          child: const Text(
            '回复',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
        ),
        if (onDelete != null) ...[
          const SizedBox(width: 18),
          GestureDetector(
            onTap: onDelete,
            child: const Text(
              '删除',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ),
        ],
      ],
    );
  }
}

class _CommentInputBar extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final RecipeComment? replyTarget;
  final bool sending;
  final VoidCallback onCancelReply;
  final VoidCallback onSend;

  const _CommentInputBar({
    required this.controller,
    required this.focusNode,
    required this.replyTarget,
    required this.sending,
    required this.onCancelReply,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Container(
      padding: EdgeInsets.fromLTRB(16, 10, 16, bottom + 10),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.divider)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
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
