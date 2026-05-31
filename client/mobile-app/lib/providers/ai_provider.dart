import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/mock_data.dart';

final chatMessagesProvider = StateProvider<List<ChatMessage>>((ref) => []);

final chatHistoryProvider = Provider<List<ChatHistoryItem>>((ref) => mockChatHistory);

class ChatMessage {
  final String id;
  final bool isUser;
  final String text;
  final DateTime timestamp;

  const ChatMessage({
    required this.id,
    required this.isUser,
    required this.text,
    required this.timestamp,
  });
}

class ChatHistoryItem {
  final String id;
  final String title;
  final String preview;
  final String timeAgo;
  final int recipeCount;
  final String tag; // e.g. "restaurant", "kitchen"

  const ChatHistoryItem({
    required this.id,
    required this.title,
    this.preview = '',
    this.timeAgo = '',
    this.recipeCount = 0,
    this.tag = '',
  });
}
