import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:clipsync_mobile/features/auth/application/auth_notifier.dart';
import 'package:clipsync_mobile/features/auth/presentation/auth_screen.dart';
import 'package:clipsync_mobile/features/clips/presentation/clips_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authNotifierProvider);

  return GoRouter(
    initialLocation: '/clips',
    redirect: (context, state) {
      final isAuthenticated = authState.valueOrNull != null;
      final isOnAuth = state.matchedLocation == '/auth';

      if (!isAuthenticated && !isOnAuth) return '/auth';
      if (isAuthenticated && isOnAuth) return '/clips';
      return null;
    },
    routes: [
      GoRoute(
        path: '/auth',
        builder: (context, state) => const AuthScreen(),
      ),
      GoRoute(
        path: '/clips',
        builder: (context, state) => const ClipsScreen(),
      ),
    ],
  );
});
