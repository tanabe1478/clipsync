import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:clipsync_mobile/core/supabase_client.dart';
import 'package:clipsync_mobile/features/auth/application/auth_notifier.dart';
import 'package:clipsync_mobile/features/clips/application/clips_notifier.dart';
import 'package:clipsync_mobile/shared/models/clip.dart';

/// Subscribes to Realtime Postgres changes on the clips table.
/// Mirrors desktop's useRealtimeClips.ts behavior.
final realtimeClipsProvider = Provider<void>((ref) {
  final user = ref.watch(authNotifierProvider).valueOrNull;
  if (user == null) return;

  final userId = user.id;
  final notifier = ref.read(clipsNotifierProvider.notifier);

  final channel = supabase
      .channel('clips:$userId')
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'clips',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'user_id',
          value: userId,
        ),
        callback: (payload) {
          final eventType = payload.eventType;

          if (eventType == PostgresChangeEvent.insert) {
            final clip = Clip.fromJson(payload.newRecord);
            notifier.handleRealtimeInsert(clip);
          } else if (eventType == PostgresChangeEvent.update) {
            final clip = Clip.fromJson(payload.newRecord);
            notifier.handleRealtimeUpdate(clip);
          } else if (eventType == PostgresChangeEvent.delete) {
            final oldId = payload.oldRecord['id'] as String?;
            if (oldId != null) {
              notifier.handleRealtimeDelete(oldId);
            }
          }
        },
      )
      .subscribe();

  ref.onDispose(() {
    supabase.removeChannel(channel);
  });
});
