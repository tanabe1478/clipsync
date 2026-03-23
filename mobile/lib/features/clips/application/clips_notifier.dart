import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:clipsync_mobile/features/clips/data/clips_repository.dart';
import 'package:clipsync_mobile/shared/models/clip.dart';

final clipsRepositoryProvider = Provider<ClipsRepository>((ref) {
  return ClipsRepository();
});

final clipsNotifierProvider =
    AsyncNotifierProvider<ClipsNotifier, List<Clip>>(() => ClipsNotifier());

class ClipsNotifier extends AsyncNotifier<List<Clip>> {
  late final ClipsRepository _repo;

  @override
  Future<List<Clip>> build() async {
    _repo = ref.read(clipsRepositoryProvider);
    return _repo.fetchClips();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = AsyncData(await _repo.fetchClips());
  }

  Future<Clip?> saveClip({
    required String content,
    required String deviceName,
  }) async {
    final currentClips = state.valueOrNull ?? [];

    if (ClipsRepository.isDuplicate(content, currentClips)) {
      return null;
    }

    final clip = await _repo.saveClip(
      content: content,
      deviceName: deviceName,
    );

    state = AsyncData([clip, ...currentClips]);
    return clip;
  }

  Future<void> togglePin(Clip clip) async {
    final updated = await _repo.togglePin(clip);
    final currentClips = state.valueOrNull ?? [];
    state = AsyncData(
      currentClips.map((c) => c.id == clip.id ? updated : c).toList(),
    );
  }

  Future<void> deleteClip(String clipId) async {
    await _repo.deleteClip(clipId);
    final currentClips = state.valueOrNull ?? [];
    state = AsyncData(
      currentClips.where((c) => c.id != clipId).toList(),
    );
  }

  /// Called by Realtime handler to update state from external events.
  void handleRealtimeInsert(Clip clip) {
    final currentClips = state.valueOrNull ?? [];
    if (currentClips.any((c) => c.id == clip.id)) return; // dedup
    state = AsyncData([clip, ...currentClips]);
  }

  void handleRealtimeUpdate(Clip clip) {
    final currentClips = state.valueOrNull ?? [];
    state = AsyncData(
      currentClips.map((c) => c.id == clip.id ? clip : c).toList(),
    );
  }

  void handleRealtimeDelete(String clipId) {
    final currentClips = state.valueOrNull ?? [];
    state = AsyncData(
      currentClips.where((c) => c.id != clipId).toList(),
    );
  }
}
