import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/api/feed_api.dart';
import '../models/home_content.dart';
import '../models/post.dart';
import '../models/recipe.dart';
import 'api_providers.dart';
import 'collection_provider.dart';
import 'recipe_provider.dart';

enum HomeTabType { recommend, following, hot, category, local }

class HomeTabConfig {
  final HomeTabType type;
  final String label;
  final String? category;

  const HomeTabConfig({required this.type, required this.label, this.category});

  String get key => type == HomeTabType.category
      ? 'category:${category ?? label}'
      : type.name;
}

class HomeFeedState {
  final List<Object> items;
  final int page;
  final bool hasMore;
  final bool isLoading;
  final bool isRefreshing;
  final bool hasLoaded;
  final String? error;

  const HomeFeedState({
    this.items = const [],
    this.page = 0,
    this.hasMore = true,
    this.isLoading = false,
    this.isRefreshing = false,
    this.hasLoaded = false,
    this.error,
  });

  HomeFeedState copyWith({
    List<Object>? items,
    int? page,
    bool? hasMore,
    bool? isLoading,
    bool? isRefreshing,
    bool? hasLoaded,
    String? error,
    bool clearError = false,
  }) {
    return HomeFeedState(
      items: items ?? this.items,
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
      isLoading: isLoading ?? this.isLoading,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      hasLoaded: hasLoaded ?? this.hasLoaded,
      error: clearError ? null : error ?? this.error,
    );
  }
}

final homeContentProvider = FutureProvider<HomeContent>((ref) {
  return ref.read(contentApiProvider).getHomeData();
});

final homeFeedProvider = StateNotifierProvider.family
    .autoDispose<HomeFeedNotifier, HomeFeedState, HomeTabConfig>((ref, tab) {
      final notifier = HomeFeedNotifier(ref, tab);
      ref.keepAlive();
      return notifier;
    });

final followingFeedProvider = homeFeedProvider(
  const HomeTabConfig(type: HomeTabType.following, label: '关注'),
);

final hotRecipesProvider = homeFeedProvider(
  const HomeTabConfig(type: HomeTabType.hot, label: '热门'),
);

HomeTabConfig categoryTab(String category) {
  return HomeTabConfig(
    type: HomeTabType.category,
    label: category,
    category: category,
  );
}

class HomeFeedNotifier extends StateNotifier<HomeFeedState> {
  HomeFeedNotifier(this._ref, this.tab) : super(const HomeFeedState());

  final Ref _ref;
  final HomeTabConfig tab;
  static const _pageSize = 20;

  Future<void> ensureLoaded() async {
    if (!state.hasLoaded && !state.isLoading) {
      await refresh();
    }
  }

  Future<void> refresh() async {
    state = state.copyWith(
      isLoading: true,
      isRefreshing: state.hasLoaded,
      clearError: true,
    );
    try {
      final page = await _loadPage(1);
      state = state.copyWith(
        items: page.items,
        page: 1,
        hasMore: page.hasMore,
        isLoading: false,
        isRefreshing: false,
        hasLoaded: true,
        clearError: true,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        isRefreshing: false,
        hasLoaded: true,
        error: error.toString(),
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore) return;
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final nextPage = state.page + 1;
      final page = await _loadPage(nextPage);
      state = state.copyWith(
        items: [...state.items, ...page.items],
        page: nextPage,
        hasMore: page.hasMore,
        isLoading: false,
        hasLoaded: true,
        clearError: true,
      );
    } catch (error) {
      state = state.copyWith(isLoading: false, error: error.toString());
    }
  }

  Future<FeedPage> _loadPage(int page) {
    switch (tab.type) {
      case HomeTabType.recommend:
        return _loadRecommend(page);
      case HomeTabType.following:
        return _ref
            .read(feedApiProvider)
            .getFollowingFeed(page: page, pageSize: _pageSize);
      case HomeTabType.hot:
        return _ref
            .read(feedApiProvider)
            .getHotRecipes(page: page, pageSize: _pageSize);
      case HomeTabType.category:
        return _ref
            .read(feedApiProvider)
            .getCategoryRecipes(
              tab.category ?? tab.label,
              page: page,
              pageSize: _pageSize,
            );
      case HomeTabType.local:
        return _ref
            .read(feedApiProvider)
            .getLocalFeed(page: page, pageSize: _pageSize);
    }
  }

  Future<FeedPage> _loadRecommend(int page) async {
    if (page == 1) {
      await Future.wait([
        _ref.refresh(homeContentProvider.future),
        _ref.read(recipeListProvider.notifier).refresh(),
      ]);
      _ref.invalidate(postListProvider);
    }

    final homeContent = _ref.read(homeContentProvider).valueOrNull;
    final recipes = _ref.read(recipeListProvider).isNotEmpty
        ? _ref.read(recipeListProvider)
        : homeContent?.latestRecipes ?? const <Recipe>[];
    final posts = _ref.read(postListProvider).valueOrNull ?? const <Post>[];
    final items = _interleave(recipes, posts);

    return FeedPage(
      items: items,
      total: items.length,
      page: 1,
      pageSize: items.length,
    );
  }

  List<Object> _interleave(List<Recipe> recipes, List<Post> posts) {
    final items = <Object>[];
    final maxCount = recipes.length > posts.length
        ? recipes.length
        : posts.length;
    for (var i = 0; i < maxCount; i++) {
      if (i < recipes.length) items.add(recipes[i]);
      if (i < posts.length) items.add(posts[i]);
    }
    return items;
  }
}
