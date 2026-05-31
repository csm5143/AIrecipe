import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../config/glass_theme.dart';
import '../../providers/ai_provider.dart';

/// AI 全屏对话页（无底栏）
class ChatPage extends ConsumerStatefulWidget {
  const ChatPage({super.key});

  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();

  final _initialMessages = [
    ChatMessage(id: '1', isUser: true, text: '我想用冰箱里的三文鱼和芦笋做一道减脂餐，有什么建议吗？', timestamp: DateTime.now()),
    ChatMessage(
      id: '2', isUser: false,
      text: '建议您尝试【蒜香黄油煎三文鱼配芦笋】。三文鱼富含优质蛋白和 Omega-3，芦笋低卡高纤维。以下是烹饪步骤：\n\n1. 腌制：将三文鱼两面均匀撒上少许海盐和黑胡椒，静置10分钟。\n2. 煎制：热锅少油，皮面朝下煎至金黄酥脆...',
      timestamp: DateTime.now(),
    ),
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

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        title: const Text('AI 营养师'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => context.go('/ai'),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.more_horiz), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          // 聊天区域
          Expanded(
            child: messages.isEmpty
                ? _buildInitialMessages()
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final msg = messages[index];
                      return _ChatBubble(message: msg);
                    },
                  ),
          ),
          // 底部输入栏
          SafeArea(
            child: Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppColors.background.withAlpha(0),
                    AppColors.background,
                  ],
                ),
              ),
              child: Row(
                children: [
                  // 语音按钮
                  GestureDetector(
                    child: Container(
                      width: 40, height: 40,
                      decoration: const BoxDecoration(color: Colors.transparent),
                      child: const Icon(Icons.mic, color: AppColors.textSecondary),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // 输入框
                  Expanded(
                    child: Container(
                      height: 48,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: GlassTheme.glassDecoration(
                        borderRadius: 24,
                        bgColor: const Color(0xB8FFFFFF),
                      ),
                      child: TextField(
                        controller: _textController,
                        decoration: const InputDecoration(
                          hintText: '输入你的想法或食谱需求...',
                          hintStyle: TextStyle(color: AppColors.textPlaceholder, fontSize: 15),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.zero,
                        ),
                        style: const TextStyle(fontSize: 15),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // 发送按钮（珊瑚橙）
                  GestureDetector(
                    onTap: () {
                      if (_textController.text.trim().isNotEmpty) {
                        ref.read(chatMessagesProvider.notifier).state = [
                          ...messages,
                          ChatMessage(
                            id: DateTime.now().toString(),
                            isUser: true,
                            text: _textController.text.trim(),
                            timestamp: DateTime.now(),
                          ),
                        ];
                        _textController.clear();
                      }
                    },
                    child: Container(
                      width: 40, height: 40,
                      decoration: const BoxDecoration(
                        color: AppColors.accent,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.send, color: AppColors.surface, size: 20),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInitialMessages() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      children: _initialMessages.map((msg) => _ChatBubble(message: msg)).toList(),
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
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: AppColors.surfaceSecondary,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(Icons.smart_toy_outlined, size: 18),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              constraints: const BoxConstraints(maxWidth: 300),
              decoration: BoxDecoration(
                color: isUser ? AppColors.textPrimary : AppColors.surface,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: isUser ? const Radius.circular(16) : const Radius.circular(4),
                  bottomRight: isUser ? const Radius.circular(4) : const Radius.circular(16),
                ),
                border: isUser ? null : Border.all(color: const Color(0x0A000000)),
                boxShadow: isUser
                    ? const [BoxShadow(color: Color(0x1A000000), blurRadius: 8, offset: Offset(0, 2))]
                    : const [BoxShadow(color: Color(0x0A000000), blurRadius: 24, offset: Offset(0, 4))],
              ),
              child: Text(
                message.text,
                style: TextStyle(
                  fontSize: 15,
                  height: 1.5,
                  color: isUser ? AppColors.surface : AppColors.textPrimary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
