import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:clipsync_mobile/features/auth/application/auth_notifier.dart';

class MockGoTrueClient extends Mock implements GoTrueClient {}

class MockSession extends Mock implements Session {}

class MockUser extends Mock implements User {}

class MockAuthResponse extends Mock implements AuthResponse {}

void main() {
  late MockGoTrueClient mockAuth;
  late ProviderContainer container;

  setUp(() {
    mockAuth = MockGoTrueClient();
    container = ProviderContainer(
      overrides: [
        goTrueClientProvider.overrideWithValue(mockAuth),
      ],
    );
  });

  tearDown(() {
    container.dispose();
  });

  group('AuthNotifier', () {
    test('initial state is loading', () {
      when(() => mockAuth.currentSession).thenReturn(null);
      when(() => mockAuth.onAuthStateChange).thenAnswer(
        (_) => const Stream.empty(),
      );

      final state = container.read(authNotifierProvider);
      expect(state, isA<AsyncLoading>());
    });

    test('emits authenticated when session exists', () async {
      final mockUser = MockUser();
      when(() => mockUser.id).thenReturn('user-123');
      when(() => mockUser.email).thenReturn('test@example.com');

      final mockSession = MockSession();
      when(() => mockSession.user).thenReturn(mockUser);

      when(() => mockAuth.currentSession).thenReturn(mockSession);
      when(() => mockAuth.onAuthStateChange).thenAnswer(
        (_) => Stream.value(AuthState(AuthChangeEvent.signedIn, mockSession)),
      );

      // Wait for the notifier to process
      await container.read(authNotifierProvider.future);

      final state = container.read(authNotifierProvider);
      expect(state.value, isNotNull);
      expect(state.value!.id, 'user-123');
    });

    test('emits null when no session', () async {
      when(() => mockAuth.currentSession).thenReturn(null);
      when(() => mockAuth.onAuthStateChange).thenAnswer(
        (_) => Stream.value(AuthState(AuthChangeEvent.signedOut, null)),
      );

      await container.read(authNotifierProvider.future);

      final state = container.read(authNotifierProvider);
      expect(state.value, isNull);
    });

    test('signOut calls auth.signOut', () async {
      when(() => mockAuth.currentSession).thenReturn(null);
      when(() => mockAuth.onAuthStateChange).thenAnswer(
        (_) => const Stream.empty(),
      );
      when(() => mockAuth.signOut()).thenAnswer((_) async {});

      final notifier = container.read(authNotifierProvider.notifier);
      await notifier.signOut();

      verify(() => mockAuth.signOut()).called(1);
    });
  });
}
