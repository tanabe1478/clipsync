import 'package:flutter_test/flutter_test.dart';
import 'package:clipsync_mobile/features/clips/data/clips_repository.dart';
import 'package:clipsync_mobile/shared/models/clip.dart';
import 'package:clipsync_mobile/core/constants.dart';

void main() {
  group('ClipsRepository validation', () {
    test('validateContent rejects empty string', () {
      expect(
        () => ClipsRepository.validateContent(''),
        throwsA(isA<ArgumentError>()),
      );
    });

    test('validateContent rejects whitespace-only string', () {
      expect(
        () => ClipsRepository.validateContent('   '),
        throwsA(isA<ArgumentError>()),
      );
    });

    test('validateContent truncates content over max length', () {
      final longContent = 'a' * (maxContentLength + 100);
      final result = ClipsRepository.validateContent(longContent);
      expect(result.length, maxContentLength);
    });

    test('validateContent passes valid content unchanged', () {
      const content = 'Hello World';
      final result = ClipsRepository.validateContent(content);
      expect(result, content);
    });
  });

  group('ClipsRepository duplicate detection', () {
    final existingClips = [
      const Clip(
        id: '1',
        userId: 'user-1',
        content: 'Existing content',
        deviceName: 'Pixel',
        pinned: false,
        createdAt: '2026-03-24T00:00:00Z',
      ),
    ];

    test('isDuplicate returns true for same content as most recent', () {
      final result = ClipsRepository.isDuplicate('Existing content', existingClips);
      expect(result, true);
    });

    test('isDuplicate returns false for different content', () {
      final result = ClipsRepository.isDuplicate('New content', existingClips);
      expect(result, false);
    });

    test('isDuplicate returns false for empty list', () {
      final result = ClipsRepository.isDuplicate('Any content', []);
      expect(result, false);
    });
  });
}
