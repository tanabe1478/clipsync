import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:clipsync_mobile/features/auth/application/auth_notifier.dart';
import 'package:clipsync_mobile/features/clips/application/clips_notifier.dart';
import 'package:clipsync_mobile/features/clips/presentation/clip_list.dart';

class ClipsScreen extends ConsumerWidget {
  const ClipsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clipsState = ref.watch(clipsNotifierProvider);
    final notifier = ref.read(clipsNotifierProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('ClipSync'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
            onPressed: () async {
              await ref.read(authNotifierProvider.notifier).signOut();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => notifier.refresh(),
        child: clipsState.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('Error: $error'),
                const SizedBox(height: 8),
                FilledButton(
                  onPressed: () => notifier.refresh(),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
          data: (clips) => ClipList(
            clips: clips,
            onTogglePin: (clip) => notifier.togglePin(clip),
            onDelete: (clipId) => notifier.deleteClip(clipId),
          ),
        ),
      ),
    );
  }
}
