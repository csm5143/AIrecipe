import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/chat.dart';
import 'api_providers.dart';

export '../models/chat.dart';

final chatSessionIdProvider = StateProvider<String?>((ref) => null);

final chatMessagesProvider = StateProvider<List<ChatMessage>>((ref) => []);

final chatHistoryProvider = FutureProvider<List<ChatHistoryItem>>((ref) {
  return ref.read(aiApiProvider).getHistory();
});
