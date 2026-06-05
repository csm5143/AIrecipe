import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/home_content.dart';
import 'api_providers.dart';

final homeContentProvider = FutureProvider<HomeContent>((ref) {
  return ref.read(contentApiProvider).getHomeData();
});
