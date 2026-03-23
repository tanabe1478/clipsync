import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:clipsync_mobile/core/supabase_client.dart';

/// Provides the GoTrueClient for dependency injection in tests.
final goTrueClientProvider = Provider<GoTrueClient>((ref) {
  return supabase.auth;
});

/// Watches auth state and exposes the current user (or null).
final authNotifierProvider =
    AsyncNotifierProvider<AuthNotifier, User?>(() => AuthNotifier());

class AuthNotifier extends AsyncNotifier<User?> {
  late final GoTrueClient _auth;
  StreamSubscription<AuthState>? _subscription;

  @override
  Future<User?> build() async {
    _auth = ref.read(goTrueClientProvider);

    // Listen for auth state changes
    _subscription = _auth.onAuthStateChange.listen((authState) {
      state = AsyncData(authState.session?.user);
    });

    // Clean up on dispose
    ref.onDispose(() {
      _subscription?.cancel();
    });

    // Return current user (or null)
    return _auth.currentSession?.user;
  }

  Future<void> signInWithGoogle() async {
    await _auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: 'com.clipsync.app://auth/callback',
    );
  }

  Future<void> signOut() async {
    await _auth.signOut();
    state = const AsyncData(null);
  }
}
