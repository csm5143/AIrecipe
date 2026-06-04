import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/mock_data.dart';
import '../models/chat.dart';

export '../models/chat.dart';

final chatMessagesProvider = StateProvider<List<ChatMessage>>((ref) => []);

final chatHistoryProvider = Provider<List<ChatHistoryItem>>(
  (ref) => mockChatHistory,
);
