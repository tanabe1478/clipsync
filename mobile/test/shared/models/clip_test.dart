import 'package:flutter_test/flutter_test.dart';
import 'package:clipsync_mobile/shared/models/clip.dart';

void main() {
  group('Clip', () {
    final jsonMap = {
      'id': '550e8400-e29b-41d4-a716-446655440000',
      'user_id': 'user-123',
      'content': 'Hello World',
      'device_name': 'Pixel 8',
      'pinned': false,
      'created_at': '2026-03-24T00:00:00Z',
    };

    test('fromJson creates Clip from Supabase JSON', () {
      final clip = Clip.fromJson(jsonMap);

      expect(clip.id, '550e8400-e29b-41d4-a716-446655440000');
      expect(clip.userId, 'user-123');
      expect(clip.content, 'Hello World');
      expect(clip.deviceName, 'Pixel 8');
      expect(clip.pinned, false);
      expect(clip.createdAt, '2026-03-24T00:00:00Z');
    });

    test('toJson produces Supabase-compatible JSON', () {
      final clip = Clip(
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'user-123',
        content: 'Hello World',
        deviceName: 'Pixel 8',
        pinned: false,
        createdAt: '2026-03-24T00:00:00Z',
      );

      final json = clip.toJson();
      expect(json['id'], '550e8400-e29b-41d4-a716-446655440000');
      expect(json['user_id'], 'user-123');
      expect(json['device_name'], 'Pixel 8');
      expect(json['created_at'], '2026-03-24T00:00:00Z');
    });

    test('equality works (value type)', () {
      final a = Clip.fromJson(jsonMap);
      final b = Clip.fromJson(jsonMap);
      expect(a, equals(b));
    });

    test('copyWith creates modified copy', () {
      final clip = Clip.fromJson(jsonMap);
      final pinned = clip.copyWith(pinned: true);

      expect(pinned.pinned, true);
      expect(pinned.content, clip.content);
      expect(clip.pinned, false); // original unchanged
    });
  });
}
