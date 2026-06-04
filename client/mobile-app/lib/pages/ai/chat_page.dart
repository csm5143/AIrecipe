import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../config/glass_theme.dart';
import '../../providers/ai_provider.dart';
import '../../widgets/capsule_toast.dart';

class ChatPage extends ConsumerStatefulWidget {
  const ChatPage({super.key});

  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();

  final _starterMessages = [
    ChatMessage(
      id: 'starter-1',
      isUser: false,
      text: '我是小厨子。把食材、口味、人数告诉我，我来帮你把今天这顿饭整理清楚。',
      timestamp: DateTime.now(),
    ),
  ];

  static const _promptChips = [
    _PromptChipData(Icons.kitchen_outlined, '用冰箱食材'),
    _PromptChipData(Icons.local_fire_department_outlined, '低卡一点'),
    _PromptChipData(Icons.child_care_outlined, '儿童友好'),
    _PromptChipData(Icons.timer_outlined, '15分钟内'),
  ];

  @override
  void dispose() {
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
            onPressed: () {
              ref.read(chatMessagesProvider.notifier).state = [];
              showCapsuleToast(context, '已新建对话', icon: Icons.add_comment);
            },
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_horiz),
            color: AppColors.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            onSelected: (value) => showCapsuleToast(context, value),
            itemBuilder: (context) => const [
              PopupMenuItem(value: '对话已保存', child: Text('保存对话')),
              PopupMenuItem(value: '历史记录稍后接入', child: Text('查看历史')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
              itemCount: visibleMessages.length + (messages.isEmpty ? 1 : 0),
              itemBuilder: (context, index) {
                if (messages.isEmpty && index == visibleMessages.length) {
                  return _PromptGrid(items: _promptChips, onTap: _applyPrompt);
                }

                return _ChatBubble(message: visibleMessages[index]);
              },
            ),
          ),
          _Composer(
            controller: _textController,
            onMicTap: () =>
                showCapsuleToast(context, '语音输入稍后接入', icon: Icons.mic),
            onAttachTap: () => showCapsuleToast(
              context,
              '食材识别稍后接入',
              icon: Icons.add_photo_alternate_outlined,
            ),
            onSend: _sendDraft,
          ),
        ],
      ),
    );
  }

  void _applyPrompt(String value) {
    _textController.text = value;
    _textController.selection = TextSelection.collapsed(offset: value.length);
  }

  void _sendDraft() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    final messages = ref.read(chatMessagesProvider);
    ref.read(chatMessagesProvider.notifier).state = [
      ...messages,
      ChatMessage(
        id: DateTime.now().microsecondsSinceEpoch.toString(),
        isUser: true,
        text: text,
        timestamp: DateTime.now(),
      ),
    ];
    _textController.clear();
    showCapsuleToast(context, '小厨子回复逻辑稍后接入', icon: Icons.auto_awesome);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
      );
    });
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

  const _ChatBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: isUser
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[const _AssistantAvatar(), const SizedBox(width: 8)],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              constraints: const BoxConstraints(maxWidth: 308),
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
              child: Text(
                message.text,
                style: TextStyle(
                  fontSize: 15,
                  height: 1.48,
                  color: isUser ? AppColors.surface : AppColors.textPrimary,
                ),
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: AppColors.surfaceSecondary,
                borderRadius: BorderRadius.circular(11),
              ),
              child: const Icon(Icons.person_outline, size: 18),
            ),
          ],
        ],
      ),
    );
  }
}

class _AssistantAvatar extends StatelessWidget {
  const _AssistantAvatar();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(
        color: AppColors.textPrimary,
        borderRadius: BorderRadius.circular(11),
      ),
      child: const Icon(
        Icons.restaurant_menu,
        color: AppColors.surface,
        size: 17,
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
  final VoidCallback onMicTap;
  final VoidCallback onAttachTap;
  final VoidCallback onSend;

  const _Composer({
    required this.controller,
    required this.onMicTap,
    required this.onAttachTap,
    required this.onSend,
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
        child: Row(
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
              onTap: onSend,
              child: Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: AppColors.textPrimary,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x22000000),
                      blurRadius: 18,
                      offset: Offset(0, 8),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.arrow_upward,
                  color: AppColors.surface,
                  size: 22,
                ),
              ),
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

class _PromptChipData {
  final IconData icon;
  final String label;

  const _PromptChipData(this.icon, this.label);
}
