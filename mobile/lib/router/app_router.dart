import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:clipsync_mobile/features/auth/application/auth_notifier.dart';
import 'package:clipsync_mobile/features/auth/presentation/auth_screen.dart';

// Placeholder for clips screen (Phase 2c)
class ClipsScreen extends StatelessWidget {
  const ClipsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ClipSync')),
      body: const Center(child: Text('Clips will appear here')),
    );
  }
}

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
