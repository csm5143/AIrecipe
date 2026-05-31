import 'package:flutter_riverpod/flutter_riverpod.dart';

final currentTabIndexProvider = StateProvider<int>((ref) => 0);

/// 发布 BottomSheet 开关状态
final isPublishSheetOpenProvider = StateProvider<bool>((ref) => false);
