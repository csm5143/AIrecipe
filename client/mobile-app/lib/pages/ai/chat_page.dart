import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../config/theme.dart';
import '../../config/glass_theme.dart';
import '../../data/api/app_exception.dart';
import '../../providers/ai_provider.dart';
import '../../providers/api_providers.dart';
import '../../providers/auth_provider.dart';
import '../../services/local_notification_service.dart';
import '../../widgets/capsule_toast.dart';

class ChatPage extends ConsumerStatefulWidget {
  final String initialPrompt;
  final String initialSessionId;

  const ChatPage({
    super.key,
    this.initialPrompt = '',
    this.initialSessionId = '',
  });

  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  final _picker = ImagePicker();
  final List<XFile> _selectedImages = [];
  CancelToken? _sendCancelToken;
  ChatMessage? _editingMessage;
  var _typingAnimationId = 0;
  var _isSending = false;
  var _isLoadingSession = false;

  final _starterMessages = [
    ChatMessage(
      id: 'starter-1',
      isUser: false,
      text: '我是小厨子。把食材、口味、人数告诉我，我来帮你把今天这顿饭安排清楚。',
      timestamp: DateTime.now(),
    ),
  ];

  static const _promptChips = [
    _PromptChipData(Icons.kitchen_outlined, '用冰箱食材配菜'),
    _PromptChipData(Icons.local_fire_department_outlined, '低卡一点'),
    _PromptChipData(Icons.child_care_outlined, '儿童友好'),
    _PromptChipData(Icons.timer_outlined, '15分钟快手菜'),
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialPrompt.isNotEmpty) {
      _textController.text = widget.initialPrompt;
      _textController.selection = TextSelection.collapsed(
        offset: widget.initialPrompt.length,
      );
    }
    if (widget.initialSessionId.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadSession(widget.initialSessionId);
      });
    }
  }

  @override
  void dispose() {
    _sendCancelToken?.cancel('页面已关闭');
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatMessagesProvider);
    final visibleMessages = messages.isEmpty ? _starterMessages : messages;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        titleSpacing: 0,
        title: const _ChatTitle(),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => context.go('/ai'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_comment_outlined),
            onPressed: _isSending || _isLoadingSession ? null : _startNewChat,
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_horiz),
            color: AppColors.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            onSelected: (value) => showCapsuleToast(context, value),
            itemBuilder: (context) => const [
              PopupMenuItem(value: '对话会自动保存到后端', child: Text('自动保存')),
              PopupMenuItem(value: '可在最近对话中继续打开', child: Text('历史记录')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          if (_isLoadingSession) const LinearProgressIndicator(minHeight: 2),
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
              itemCount:
                  visibleMessages.length +
                  (messages.isEmpty && !_isLoadingSession ? 1 : 0) +
                  (_isSending ? 1 : 0),
              itemBuilder: (context, index) {
                if (index < visibleMessages.length) {
                  final authState = ref.watch(authControllerProvider);
                  final userAvatar = authState.user?.avatar ?? '';
                  return _ChatBubble(
                    message: visibleMessages[index],
                    onCopy: _copyMessage,
                    onDelete: _deleteMessage,
                    onEdit: visibleMessages[index].isUser ? _editMessage : null,
                    userAvatarUrl: userAvatar,
                    onConfirmAction: visibleMessages[index].isUser
                        ? null
                        : (actionId, confirmed) => _confirmAction(
                              messageId: visibleMessages[index].id,
                              actionId: actionId,
                              confirmed: confirmed,
                              sessionId: int.tryParse(
                                    ref.read(chatSessionIdProvider) ?? '',
                                  ) ??
                                  0,
                            ),
                  );
                }

                if (_isSending && index == visibleMessages.length) {
                  return const _TypingBubble();
                }

                return _PromptGrid(items: _promptChips, onTap: _applyPrompt);
              },
            ),
          ),
          _Composer(
            controller: _textController,
            isSending: _isSending || _isLoadingSession,
            selectedImages: _selectedImages,
            onMicTap: () =>
                showCapsuleToast(context, '语音输入还在接入中', icon: Icons.mic),
            onAttachTap: _pickChatImages,
            onRemoveImage: _removeSelectedImage,
            onSend: _sendDraft,
            onCancel: _cancelSending,
          ),
        ],
      ),
    );
  }

  Future<void> _loadSession(String sessionId) async {
    setState(() => _isLoadingSession = true);
    try {
      final messages = await ref
          .read(aiApiProvider)
          .getSessionMessages(sessionId);
      ref.read(chatSessionIdProvider.notifier).state = sessionId;
      ref.read(chatMessagesProvider.notifier).state = messages;
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    } catch (error) {
      final message = error is AppException ? error.message : error.toString();
      if (mounted) {
        showCapsuleToast(context, message, icon: Icons.error_outline);
      }
    } finally {
      if (mounted) setState(() => _isLoadingSession = false);
    }
  }

  void _startNewChat() {
    ref.read(chatSessionIdProvider.notifier).state = null;
    ref.read(chatMessagesProvider.notifier).state = [];
    _editingMessage = null;
    showCapsuleToast(context, '已新建对话', icon: Icons.add_comment);
  }

  void _applyPrompt(String value) {
    _textController.text = value;
    _textController.selection = TextSelection.collapsed(offset: value.length);
  }

  Future<void> _pickChatImages() async {
    if (_isSending || _isLoadingSession) return;
    final remaining = 3 - _selectedImages.length;
    if (remaining <= 0) {
      showCapsuleToast(context, '最多添加 3 张图片', icon: Icons.image);
      return;
    }

    final picked = await _picker.pickMultiImage(
      imageQuality: 85,
      maxWidth: 1600,
    );
    if (picked.isEmpty || !mounted) return;
    setState(() {
      _selectedImages.addAll(picked.take(remaining));
    });
  }

  void _removeSelectedImage(int index) {
    if (index < 0 || index >= _selectedImages.length) return;
    setState(() {
      _selectedImages.removeAt(index);
    });
  }

  void _cancelSending() {
    if (!_isSending) return;
    _sendCancelToken?.cancel('用户取消发送');
    ref.read(chatMessagesProvider.notifier).state = ref
        .read(chatMessagesProvider)
        .where((message) => !message.isPending)
        .toList(growable: false);
    setState(() => _isSending = false);
    showCapsuleToast(context, '已取消本次发送', icon: Icons.stop_circle_outlined);
  }

  Future<void> _sendDraft() async {
    final text = _textController.text.trim();
    if ((text.isEmpty && _selectedImages.isEmpty) ||
        _isSending ||
        _isLoadingSession) {
      return;
    }
    if (_editingMessage != null) {
      if (_selectedImages.isNotEmpty) {
        showCapsuleToast(
          context,
          '修改历史消息暂不支持追加图片',
          icon: Icons.image_not_supported_outlined,
        );
        return;
      }
      await _submitEditedDraft(_editingMessage!, text);
      return;
    }

    final currentMessages = ref.read(chatMessagesProvider);
    final pickedImages = List<XFile>.from(_selectedImages);
    final localImagePaths = pickedImages
        .map((file) => file.path)
        .toList(growable: false);
    final userMessage = ChatMessage(
      id: 'local-${DateTime.now().microsecondsSinceEpoch}',
      isUser: true,
      text: text.isEmpty ? '请帮我看看这张图片' : text,
      imageUrls: localImagePaths,
      timestamp: DateTime.now(),
      isPending: true,
    );
    final nextMessages = [...currentMessages, userMessage];

    ref.read(chatMessagesProvider.notifier).state = nextMessages;
    _textController.clear();
    setState(() {
      _selectedImages.clear();
      _isSending = true;
    });
    _sendCancelToken = CancelToken();
    _scrollToBottom();

    try {
      final uploadedUrls = <String>[];
      for (final image in pickedImages) {
        final url = await ref.read(uploadApiProvider).uploadChatImage(image);
        if (url.isNotEmpty) uploadedUrls.add(url);
      }

      if (pickedImages.isNotEmpty && uploadedUrls.isEmpty) {
        throw const AppException('upload_failed', '图片上传失败，请稍后重试');
      }

      final reply = await ref
          .read(aiApiProvider)
          .sendMessage(
            text: text,
            imageUrls: uploadedUrls,
            sessionId: ref.read(chatSessionIdProvider),
            cancelToken: _sendCancelToken,
          );

      ref.read(chatSessionIdProvider.notifier).state = reply.sessionId;
      ref.read(chatMessagesProvider.notifier).state = [
        ...ref
            .read(chatMessagesProvider)
            .map(
              (message) => message.id == userMessage.id
                  ? message.copyWith(
                      id: reply.userMessageId.isNotEmpty
                          ? reply.userMessageId
                          : message.id,
                      isPending: false,
                    )
                  : message,
            ),
      ];
      await _scheduleLocalReminders(reply);
      _appendAssistantReply(reply);
      ref.invalidate(chatHistoryProvider);
    } catch (error) {
      if (error is DioException && CancelToken.isCancel(error)) {
        return;
      }
      final message = error is AppException ? error.message : error.toString();
      ref.read(chatMessagesProvider.notifier).state = ref
          .read(chatMessagesProvider)
          .map(
            (item) => item.id == userMessage.id
                ? item.copyWith(isPending: false, isFailed: true)
                : item,
          )
          .toList(growable: false);
      if (mounted) {
        showCapsuleToast(context, message, icon: Icons.error_outline);
      }
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
        _sendCancelToken = null;
        _scrollToBottom();
      }
    }
  }

  Future<void> _copyMessage(ChatMessage message) async {
    await Clipboard.setData(ClipboardData(text: message.text));
    if (mounted) {
      showCapsuleToast(context, '已复制', icon: Icons.copy_outlined);
    }
  }

  Future<void> _deleteMessage(ChatMessage message) async {
    final current = ref.read(chatMessagesProvider);
    ref.read(chatMessagesProvider.notifier).state = current
        .where((item) => item.id != message.id)
        .toList(growable: false);

    if (message.id.startsWith('local-') || message.id.startsWith('starter-')) {
      return;
    }

    try {
      await ref.read(aiApiProvider).deleteMessage(message.id);
      ref.invalidate(chatHistoryProvider);
    } catch (error) {
      ref.read(chatMessagesProvider.notifier).state = current;
      final text = error is AppException ? error.message : error.toString();
      if (mounted) {
        showCapsuleToast(context, text, icon: Icons.error_outline);
      }
    }
  }

  Future<void> _editMessage(ChatMessage message) async {
    if (message.isPending || message.id.startsWith('local-')) return;
    _textController.text = message.text;
    _textController.selection = TextSelection.collapsed(
      offset: _textController.text.length,
    );
    _editingMessage = message;
    showCapsuleToast(context, '已放入输入框，修改后点发送', icon: Icons.edit_outlined);
  }

  Future<void> _submitEditedDraft(ChatMessage message, String nextText) async {
    if (nextText.isEmpty || nextText == message.text) return;

    final current = ref.read(chatMessagesProvider);
    final messageIndex = current.indexWhere((item) => item.id == message.id);
    if (messageIndex < 0) return;

    ref.read(chatMessagesProvider.notifier).state = [
      ...current.take(messageIndex),
      message.copyWith(text: nextText, isPending: true, isFailed: false),
    ];
    _textController.clear();
    setState(() => _isSending = true);
    _scrollToBottom();

    try {
      final reply = await ref
          .read(aiApiProvider)
          .editMessage(messageId: message.id, text: nextText);
      ref.read(chatSessionIdProvider.notifier).state = reply.sessionId;
      ref.read(chatMessagesProvider.notifier).state = [
        ...ref
            .read(chatMessagesProvider)
            .map(
              (item) => item.id == message.id
                  ? item.copyWith(
                      id: reply.userMessageId.isNotEmpty
                          ? reply.userMessageId
                          : item.id,
                      isPending: false,
                    )
                  : item,
            ),
      ];
      await _scheduleLocalReminders(reply);
      _appendAssistantReply(reply);
      ref.invalidate(chatHistoryProvider);
      _editingMessage = null;
    } catch (error) {
      ref.read(chatMessagesProvider.notifier).state = current;
      final text = error is AppException ? error.message : error.toString();
      if (mounted) {
        showCapsuleToast(context, text, icon: Icons.error_outline);
      }
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
        _scrollToBottom();
      }
    }
  }

  void _appendAssistantReply(ChatReply reply) {
    final assistantId = reply.assistantMessageId.isNotEmpty
        ? reply.assistantMessageId
        : 'ai-${DateTime.now().microsecondsSinceEpoch}';
    final fullText = reply.message.trim();
    final chunks = _splitReplyChunks(fullText);
    final animationId = ++_typingAnimationId;

    ref.read(chatMessagesProvider.notifier).state = [
      ...ref.read(chatMessagesProvider),
      ChatMessage(
        id: assistantId,
        isUser: false,
        text: chunks.isEmpty ? fullText : '',
        recommendations: reply.recommendations,
        pendingActions: reply.pendingActions,
        timestamp: DateTime.now(),
      ),
    ];

    if (chunks.isEmpty) {
      _scrollToBottom();
      return;
    }

    Future<void>(() async {
      var visibleText = '';
      for (var i = 0; i < chunks.length; i++) {
        if (!mounted || animationId != _typingAnimationId) return;
        await Future<void>.delayed(Duration(milliseconds: i == 0 ? 80 : 260));
        visibleText = visibleText.isEmpty
            ? chunks[i]
            : '$visibleText\n\n${chunks[i]}';
        if (!mounted || animationId != _typingAnimationId) return;
        ref.read(chatMessagesProvider.notifier).state = ref
            .read(chatMessagesProvider)
            .map(
              (message) => message.id == assistantId
                  ? message.copyWith(text: visibleText)
                  : message,
            )
            .toList(growable: false);
        _scrollToBottom();
      }
    });
  }

  Future<void> _confirmAction({
    required String messageId,
    required String actionId,
    required bool confirmed,
    required int sessionId,
  }) async {
    try {
      final reply = await ref.read(aiApiProvider).continueAgent(
        sessionId: sessionId,
        messageId: int.tryParse(messageId) ?? 0,
        actions: [{'id': actionId, 'confirmed': confirmed}],
      );

      // Replace the message with updated content
      ref.read(chatMessagesProvider.notifier).state = ref
          .read(chatMessagesProvider)
          .map((msg) {
            if (msg.id == messageId) {
              return msg.copyWith(
                text: reply.message,
                recommendations: reply.recommendations,
                pendingActions: reply.pendingActions,
              );
            }
            return msg;
          })
          .toList(growable: false);
    } catch (error) {
      final message = error is AppException ? error.message : error.toString();
      if (mounted) {
        showCapsuleToast(context, message, icon: Icons.error_outline);
      }
    }
  }

  Future<void> _scheduleLocalReminders(ChatReply reply) async {
    final reminders = reply.toolActions.reminders;
    if (reminders.isEmpty) return;

    var scheduled = 0;
    for (final reminder in reminders) {
      try {
        await LocalNotificationService.instance.scheduleShoppingReminder(
          reminder,
        );
        scheduled++;
      } catch (_) {
        // 服务端提醒仍会保留；本地通知失败时不阻断聊天回复。
      }
    }

    if (mounted && scheduled > 0) {
      showCapsuleToast(
        context,
        '已同步到本机提醒，到点会弹出系统通知',
        icon: Icons.notifications_active_outlined,
      );
    }
  }

  List<String> _splitReplyChunks(String text) {
    return text
        .split(RegExp(r'\n\s*\n+'))
        .map((chunk) => chunk.trim())
        .where((chunk) => chunk.isNotEmpty)
        .toList(growable: false);
  }

  void _scrollToBottom() {
    if (!_scrollController.hasClients) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
      return;
    }
    final position = _scrollController.position;
    if (position.maxScrollExtent - position.pixels > 2000) {
      // Jump directly for large distances (loading history)
      _scrollController.jumpTo(position.maxScrollExtent);
    } else {
      _scrollController.animateTo(
        position.maxScrollExtent,
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
      );
    }
  }
}

class _ChatTitle extends StatelessWidget {
  const _ChatTitle();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: AppColors.textPrimary,
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(
            Icons.restaurant_menu,
            color: AppColors.surface,
            size: 19,
          ),
        ),
        const SizedBox(width: 10),
        Text('小厨子', style: Theme.of(context).appBarTheme.titleTextStyle),
      ],
    );
  }
}

class _ChatBubble extends StatelessWidget {
  final ChatMessage message;
  final ValueChanged<ChatMessage> onCopy;
  final ValueChanged<ChatMessage> onDelete;
  final ValueChanged<ChatMessage>? onEdit;
  final void Function(String actionId, bool confirmed)? onConfirmAction;
  final String userAvatarUrl;
  final String aiAvatarUrl;

  const _ChatBubble({
    required this.message,
    required this.onCopy,
    required this.onDelete,
    this.onEdit,
    this.onConfirmAction,
    this.userAvatarUrl = '',
    this.aiAvatarUrl = '',
  });

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onLongPress: () => _showMessageActions(context),
        child: Row(
          mainAxisAlignment: isUser
              ? MainAxisAlignment.end
              : MainAxisAlignment.start,
          crossAxisAlignment:
              isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            if (!isUser) ...[
              _AssistantAvatar(imageUrl: aiAvatarUrl),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: Column(
                crossAxisAlignment: isUser
                    ? CrossAxisAlignment.end
                    : CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    constraints: const BoxConstraints(maxWidth: 340),
                    decoration: BoxDecoration(
                      color: isUser ? AppColors.textPrimary : AppColors.surface,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(18),
                        topRight: const Radius.circular(18),
                        bottomLeft: Radius.circular(isUser ? 18 : 6),
                        bottomRight: Radius.circular(isUser ? 6 : 18),
                      ),
                      border: isUser
                          ? null
                          : Border.all(color: const Color(0x0A000000)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x0A000000),
                          blurRadius: 22,
                          offset: Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (message.imageUrls.isNotEmpty) ...[
                          _MessageImages(imageUrls: message.imageUrls),
                          if (message.text.isNotEmpty)
                            const SizedBox(height: 10),
                        ],
                        if (!isUser && message.recommendations.isNotEmpty) ...[
                          _RecommendationStrip(
                            items: message.recommendations,
                            onTap: (item) => context.push(item.route),
                          ),
                          if (message.text.isNotEmpty)
                            const SizedBox(height: 12),
                        ],
                        if (message.text.isNotEmpty)
                          isUser
                              ? Text(
                                  message.text,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    height: 1.48,
                                    color: AppColors.surface,
                                  ),
                                )
                              : _AssistantMessageText(text: message.text),
                      ],
                    ),
                  ),
                  if (!isUser &&
                      message.pendingActions.isNotEmpty &&
                      onConfirmAction != null) ...[
                    const SizedBox(height: 8),
                    ...message.pendingActions.map(
                      (action) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: _ActionConfirmChip(
                          action: action,
                          onConfirm: (confirmed) =>
                              onConfirmAction!(action.id, confirmed),
                        ),
                      ),
                    ),
                  ],
                  if (message.isPending || message.isFailed) ...[
                    const SizedBox(height: 5),
                    Text(
                      message.isFailed ? '发送失败，长按可编辑重试' : '发送中...',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: message.isFailed
                            ? AppColors.error
                            : AppColors.textSecondary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (isUser) ...[
              const SizedBox(width: 8),
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppColors.surfaceSecondary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: userAvatarUrl.isNotEmpty
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          userAvatarUrl,
                          width: 34,
                          height: 34,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const Icon(
                            Icons.person_outline,
                            size: 18,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      )
                    : const Icon(
                        Icons.person_outline,
                        size: 18,
                        color: AppColors.textSecondary,
                      ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showMessageActions(BuildContext context) {
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
              _ChatActionTile(
                icon: Icons.copy_outlined,
                label: '复制',
                onTap: () => onCopy(message),
              ),
              if (message.isUser && onEdit != null)
                _ChatActionTile(
                  icon: Icons.edit_outlined,
                  label: '修改并重新发送',
                  onTap: () => onEdit!(message),
                ),
              _ChatActionTile(
                icon: Icons.delete_outline,
                label: '删除',
                isDestructive: true,
                onTap: () => onDelete(message),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecommendationStrip extends StatelessWidget {
  final List<ChatRecommendation> items;
  final ValueChanged<ChatRecommendation> onTap;

  const _RecommendationStrip({required this.items, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 142,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final item = items[index];
          return _RecommendationCard(item: item, onTap: () => onTap(item));
        },
      ),
    );
  }
}

class _RecommendationCard extends StatelessWidget {
  final ChatRecommendation item;
  final VoidCallback onTap;

  const _RecommendationCard({required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 232,
        decoration: BoxDecoration(
          color: AppColors.surfaceSecondary,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0x0A000000)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          children: [
            SizedBox(
              width: 86,
              height: double.infinity,
              child: item.coverImage.isNotEmpty
                  ? Image.network(
                      item.coverImage,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) =>
                          const _RecommendationImageFallback(),
                    )
                  : const _RecommendationImageFallback(),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 7,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: item.type == 'post'
                                ? AppColors.accentBlue.withAlpha(20)
                                : AppColors.accent.withAlpha(22),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            item.type == 'post' ? '帖子' : '菜谱',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: item.type == 'post'
                                  ? AppColors.accentBlue
                                  : AppColors.accent,
                            ),
                          ),
                        ),
                        const Spacer(),
                        const Icon(Icons.chevron_right, size: 16),
                      ],
                    ),
                    const SizedBox(height: 7),
                    Text(
                      item.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14,
                        height: 1.25,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Expanded(
                      child: Text(
                        item.description.isNotEmpty
                            ? item.description
                            : '点击查看完整内容',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          height: 1.3,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                    Text(
                      [
                        if (item.cookingTime > 0) '${item.cookingTime}分钟',
                        if (item.difficulty.isNotEmpty) item.difficulty,
                        if (item.authorName.isNotEmpty) item.authorName,
                      ].join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RecommendationImageFallback extends StatelessWidget {
  const _RecommendationImageFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFE8E8EE),
      child: const Icon(
        Icons.restaurant_menu,
        color: AppColors.textSecondary,
        size: 24,
      ),
    );
  }
}

class _AssistantMessageText extends StatelessWidget {
  final String text;

  const _AssistantMessageText({required this.text});

  @override
  Widget build(BuildContext context) {
    final blocks = text
        .split('\n')
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .toList(growable: false);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: blocks.map((line) => _MessageLine(text: line)).toList(),
    );
  }
}

class _MessageLine extends StatelessWidget {
  final String text;

  const _MessageLine({required this.text});

  @override
  Widget build(BuildContext context) {
    final isFocus = text.startsWith('重点：') || text.startsWith('重点:');
    final isNumbered = RegExp(r'^\d+[.、]').hasMatch(text);

    if (isFocus) {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.accent.withAlpha(18),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.accent.withAlpha(48)),
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 15,
            height: 1.45,
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
      );
    }

    return Padding(
      padding: EdgeInsets.only(bottom: isNumbered ? 5 : 7),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 15,
          height: 1.5,
          color: AppColors.textPrimary,
          fontWeight: isNumbered ? FontWeight.w500 : FontWeight.w400,
        ),
      ),
    );
  }
}

class _ChatActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;

  const _ChatActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isDestructive ? AppColors.error : AppColors.textPrimary;
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(label, style: TextStyle(color: color, fontSize: 15)),
      onTap: () {
        Navigator.pop(context);
        onTap();
      },
    );
  }
}

class _MessageImages extends StatelessWidget {
  final List<String> imageUrls;

  const _MessageImages({required this.imageUrls});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: imageUrls
          .map(
            (url) => ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: imageUrls.length == 1 ? 168 : 92,
                height: imageUrls.length == 1 ? 126 : 92,
                child: (url.startsWith('http') || url.startsWith('blob:'))
                    ? Image.network(url, fit: BoxFit.cover)
                    : _XFileImage(path: url),
              ),
            ),
          )
          .toList(growable: false),
    );
  }
}

class _XFileImage extends StatelessWidget {
  final XFile? file;
  final String? path;
  final double? width;
  final double? height;

  const _XFileImage({this.file, this.path, this.width, this.height});

  Future<Uint8List> _readBytes() {
    final source = file ?? XFile(path ?? '');
    return source.readAsBytes();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Uint8List>(
      future: _readBytes(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return SizedBox(
            width: width,
            height: height,
            child: const Center(
              child: SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          );
        }

        return Image.memory(
          snapshot.data!,
          width: width,
          height: height,
          fit: BoxFit.cover,
        );
      },
    );
  }
}

class _TypingBubble extends StatelessWidget {
  const _TypingBubble();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          _AssistantAvatar(),
          SizedBox(width: 8),
          DecoratedBox(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
                bottomRight: Radius.circular(18),
                bottomLeft: Radius.circular(6),
              ),
            ),
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AssistantAvatar extends StatelessWidget {
  final String imageUrl;
  const _AssistantAvatar({this.imageUrl = ''});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 34,
      height: 34,
      decoration: BoxDecoration(
        color: AppColors.accent.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: imageUrl.isNotEmpty
          ? ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                imageUrl,
                width: 34,
                height: 34,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Icon(
                  Icons.restaurant_menu,
                  color: AppColors.accent,
                  size: 18,
                ),
              ),
            )
          : const Icon(
              Icons.restaurant_menu,
              color: AppColors.accent,
              size: 18,
            ),
    );
  }
}

class _PromptGrid extends StatelessWidget {
  final List<_PromptChipData> items;
  final ValueChanged<String> onTap;

  const _PromptGrid({required this.items, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: items
            .map(
              (item) => GestureDetector(
                onTap: () => onTap(item.label),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0x0A000000)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(item.icon, size: 17, color: AppColors.textSecondary),
                      const SizedBox(width: 6),
                      Text(
                        item.label,
                        style: Theme.of(context).textTheme.labelMedium,
                      ),
                    ],
                  ),
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  final TextEditingController controller;
  final bool isSending;
  final List<XFile> selectedImages;
  final VoidCallback onMicTap;
  final VoidCallback onAttachTap;
  final ValueChanged<int> onRemoveImage;
  final VoidCallback onSend;
  final VoidCallback onCancel;

  const _Composer({
    required this.controller,
    required this.isSending,
    required this.selectedImages,
    required this.onMicTap,
    required this.onAttachTap,
    required this.onRemoveImage,
    required this.onSend,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppColors.background.withAlpha(0), AppColors.background],
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (selectedImages.isNotEmpty) ...[
              _SelectedImageStrip(
                images: selectedImages,
                onRemove: onRemoveImage,
              ),
              const SizedBox(height: 10),
            ],
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _RoundToolButton(icon: Icons.mic_none, onTap: onMicTap),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    constraints: const BoxConstraints(
                      minHeight: 48,
                      maxHeight: 112,
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: GlassTheme.glassDecoration(
                      borderRadius: 24,
                      bgColor: const Color(0xE6FFFFFF),
                    ),
                    child: TextField(
                      controller: controller,
                      enabled: !isSending,
                      minLines: 1,
                      maxLines: 4,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => onSend(),
                      decoration: const InputDecoration(
                        hintText: '告诉小厨子你想吃什么...',
                        hintStyle: TextStyle(
                          color: AppColors.textPlaceholder,
                          fontSize: 15,
                        ),
                        border: InputBorder.none,
                      ),
                      style: const TextStyle(fontSize: 15, height: 1.35),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                _RoundToolButton(
                  icon: Icons.add_photo_alternate_outlined,
                  onTap: onAttachTap,
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: isSending ? onCancel : onSend,
                  child: Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: isSending
                          ? AppColors.textSecondary
                          : AppColors.textPrimary,
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x22000000),
                          blurRadius: 18,
                          offset: Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Icon(
                      isSending ? Icons.stop_rounded : Icons.arrow_upward,
                      color: AppColors.surface,
                      size: 22,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _RoundToolButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _RoundToolButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x0A000000)),
        ),
        child: Icon(icon, color: AppColors.textSecondary, size: 21),
      ),
    );
  }
}

class _SelectedImageStrip extends StatelessWidget {
  final List<XFile> images;
  final ValueChanged<int> onRemove;

  const _SelectedImageStrip({required this.images, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 72,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: images.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          return Stack(
            clipBehavior: Clip.none,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: _XFileImage(file: images[index], width: 72, height: 72),
              ),
              Positioned(
                right: -6,
                top: -6,
                child: GestureDetector(
                  onTap: () => onRemove(index),
                  child: Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: AppColors.textPrimary,
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: const Icon(
                      Icons.close,
                      color: AppColors.surface,
                      size: 14,
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ActionConfirmChip extends StatelessWidget {
  final PendingAction action;
  final ValueChanged<bool> onConfirm;

  const _ActionConfirmChip({required this.action, required this.onConfirm});

  @override
  Widget build(BuildContext context) {
    final toolIcons = {
      'add_to_shopping_list': Icons.shopping_basket_outlined,
      'add_to_fridge': Icons.kitchen_outlined,
      'schedule_reminder': Icons.notifications_outlined,
      'save_preference': Icons.bookmark_outline,
      'generate_recipe_draft': Icons.auto_awesome_outlined,
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surfaceSecondary.withOpacity(0.6),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.accent.withOpacity(0.12)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            toolIcons[action.toolName] ?? Icons.touch_app_outlined,
            size: 16,
            color: AppColors.accent,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              action.body.isNotEmpty ? action.body : action.title,
              style: const TextStyle(fontSize: 13, height: 1.4),
            ),
          ),
          const SizedBox(width: 8),
          _ConfirmButton(
            label: action.toolName == 'schedule_reminder' ? '设置' : '好的',
            isPrimary: true,
            onTap: () => onConfirm(true),
          ),
          const SizedBox(width: 4),
          _ConfirmButton(
            label: '不用',
            isPrimary: false,
            onTap: () => onConfirm(false),
          ),
        ],
      ),
    );
  }
}

class _ConfirmButton extends StatelessWidget {
  final String label;
  final bool isPrimary;
  final VoidCallback onTap;

  const _ConfirmButton({
    required this.label,
    required this.isPrimary,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isPrimary ? AppColors.accent : AppColors.surfaceSecondary,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isPrimary ? AppColors.surface : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _PromptChipData {
  final IconData icon;
  final String label;

  const _PromptChipData(this.icon, this.label);
}
