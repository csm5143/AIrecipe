import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/ingredient.dart';
import '../models/post.dart';
import '../models/notification_item.dart';
import 'api_providers.dart';

final ingredientListProvider =
    StateNotifierProvider<FridgeNotifier, List<Ingredient>>((ref) {
      return FridgeNotifier(ref)..load();
    });

final shoppingListProvider =
    StateNotifierProvider<ShoppingListNotifier, List<Map<String, dynamic>>>((
      ref,
    ) {
      return ShoppingListNotifier(ref)..load();
    });

final myCollectionProvider =
    StateNotifierProvider<MyCollectionNotifier, List<Map<String, dynamic>>>((
      ref,
    ) {
      return MyCollectionNotifier(ref)..load();
    });

final postListProvider = FutureProvider<List<Post>>((ref) {
  return ref.read(postApiProvider).getPosts();
});

final postByIdProvider = FutureProvider.family<Post, String>((ref, id) {
  final cached = ref
      .watch(postListProvider)
      .valueOrNull
      ?.where((post) => post.id == id);
  if (cached != null && cached.isNotEmpty) {
    return cached.first;
  }
  return ref.read(postApiProvider).getPostById(id);
});

final notificationListProvider = FutureProvider<List<NotificationItem>>((
  ref,
) async {
  final notices = await ref.read(contentApiProvider).getNotices();
  return notices.map(NotificationItem.fromJson).toList();
});

class FridgeNotifier extends StateNotifier<List<Ingredient>> {
  final Ref _ref;

  FridgeNotifier(this._ref) : super(const []);

  Future<void> load() async {
    state = await _ref.read(ingredientApiProvider).getFridgeItems();
  }

  Future<void> add(Ingredient ingredient) async {
    await _ref.read(ingredientApiProvider).addToFridge(ingredient);
    await load();
  }

  Future<void> remove(String id) async {
    await _ref.read(ingredientApiProvider).removeFromFridge(id);
    state = state.where((item) => item.id != id).toList();
  }
}

class ShoppingListNotifier extends StateNotifier<List<Map<String, dynamic>>> {
  final Ref _ref;

  ShoppingListNotifier(this._ref) : super(const []);

  Future<void> load() async {
    state = await _ref.read(collectionApiProvider).getShoppingLists();
  }

  Future<void> remove(String id) async {
    await _ref.read(collectionApiProvider).deleteShoppingList(id);
    state = state.where((item) => item['id']?.toString() != id).toList();
  }
}

class MyCollectionNotifier extends StateNotifier<List<Map<String, dynamic>>> {
  final Ref _ref;

  MyCollectionNotifier(this._ref) : super(const []);

  Future<void> load() async {
    state = await _ref.read(collectionApiProvider).getCollections();
  }

  Future<void> create(String name) async {
    await _ref.read(collectionApiProvider).createCollection(name);
    await load();
  }
}
