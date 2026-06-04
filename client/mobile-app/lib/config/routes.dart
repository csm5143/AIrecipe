import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import '../pages/home/home_page.dart';
import '../pages/ai/ai_entry_page.dart';
import '../pages/ai/chat_page.dart';
import '../pages/collection/collection_page.dart';
import '../pages/mine/mine_page.dart';
import '../pages/login/login_page.dart';
import '../pages/recipe_detail/recipe_detail_page.dart';
import '../pages/post_detail/post_detail_page.dart';
import '../pages/notifications/notifications_page.dart';
import '../pages/settings/settings_page.dart';
import '../pages/user_profile/user_profile_page.dart';
import '../pages/search/search_page.dart';
import '../pages/publish/upload_recipe_page.dart';
import '../pages/publish/create_post_page.dart';
import '../pages/publish/scan_page.dart';
import '../pages/settings_sub/edit_profile_page.dart';
import '../pages/settings_sub/privacy_page.dart';
import '../pages/settings_sub/notification_settings_page.dart';
import '../pages/settings_sub/account_security_page.dart';
import '../pages/settings_sub/storage_page.dart';
import '../pages/settings_sub/help_page.dart';
import '../pages/settings_sub/about_page.dart';
import '../pages/mine_sub/drafts_page.dart';
import '../pages/mine_sub/history_page.dart';
import '../pages/mine_sub/my_collections_page.dart';
import '../widgets/bottom_nav_bar.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final goRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/',
  routes: [
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) => GlassScaffoldWithNav(
        body: child,
        currentLocation: state.uri.toString(),
      ),
      routes: [
        GoRoute(
          path: '/',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: HomePage()),
        ),
        GoRoute(
          path: '/ai',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: AiEntryPage()),
        ),
        GoRoute(
          path: '/collection',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: CollectionPage()),
        ),
        GoRoute(
          path: '/mine',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: MinePage()),
        ),
      ],
    ),
    GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
    GoRoute(path: '/ai/chat', builder: (context, state) => const ChatPage()),
    GoRoute(
      path: '/recipe/:id',
      builder: (context, state) =>
          RecipeDetailPage(recipeId: state.pathParameters['id'] ?? '0'),
    ),
    GoRoute(
      path: '/post/:id',
      builder: (context, state) =>
          PostDetailPage(postId: state.pathParameters['id'] ?? '0'),
    ),
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsPage(),
    ),
    GoRoute(
      path: '/settings',
      builder: (context, state) => const SettingsPage(),
    ),
    GoRoute(
      path: '/user/:id',
      builder: (context, state) =>
          UserProfilePage(userId: state.pathParameters['id'] ?? '0'),
    ),
    GoRoute(
      path: '/search',
      builder: (context, state) =>
          SearchPage(initialQuery: state.uri.queryParameters['q'] ?? ''),
    ),
    GoRoute(
      path: '/publish/recipe',
      builder: (context, state) => const UploadRecipePage(),
    ),
    GoRoute(
      path: '/publish/post',
      builder: (context, state) => const CreatePostPage(),
    ),
    GoRoute(
      path: '/publish/scan',
      builder: (context, state) => const ScanPage(),
    ),
    GoRoute(
      path: '/settings/edit-profile',
      builder: (context, state) => const EditProfilePage(),
    ),
    GoRoute(
      path: '/settings/privacy',
      builder: (context, state) => const PrivacyPage(),
    ),
    GoRoute(
      path: '/settings/notifications',
      builder: (context, state) => const NotificationSettingsPage(),
    ),
    GoRoute(
      path: '/settings/account',
      builder: (context, state) => const AccountSecurityPage(),
    ),
    GoRoute(
      path: '/settings/storage',
      builder: (context, state) => const StoragePage(),
    ),
    GoRoute(
      path: '/settings/help',
      builder: (context, state) => const HelpPage(),
    ),
    GoRoute(
      path: '/settings/about',
      builder: (context, state) => const AboutPage(),
    ),
    GoRoute(path: '/drafts', builder: (context, state) => const DraftsPage()),
    GoRoute(path: '/history', builder: (context, state) => const HistoryPage()),
    GoRoute(
      path: '/my-collections',
      builder: (context, state) => const MyCollectionsPage(),
    ),
  ],
);
