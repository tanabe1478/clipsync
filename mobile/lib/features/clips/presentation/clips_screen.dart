import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:clipsync_mobile/features/clips/application/clips_notifier.dart';
import 'package:clipsync_mobile/features/clips/application/realtime_clips.dart';
import 'package:clipsync_mobile/features/clips/presentation/clip_list.dart';

class ClipsScreen extends ConsumerStatefulWidget {
  const ClipsScreen({super.key});

  @override
  ConsumerState<ClipsScreen> createState() => _ClipsScreenState();
}

class _ClipsScreenState extends ConsumerState<ClipsScreen>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Auto-refresh when app comes to foreground
      ref.read(clipsNotifierProvider.notifier).refresh();
    }
  }

  Future<void> _saveFromClipboard() async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    final text = data?.text;

    if (text == null || text.trim().isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Clipboard is empty')),
        );
      }
      return;
    }

    final deviceInfo = DeviceInfoPlugin();
    final androidInfo = await deviceInfo.androidInfo;
    final deviceName = androidInfo.model;

    final notifier = ref.read(clipsNotifierProvider.notifier);
    final clip = await notifier.saveClip(
      content: text,
      deviceName: deviceName,
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(clip != null ? 'Clip saved' : 'Duplicate skipped'),
          duration: const Duration(milliseconds: 1500),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Activate Realtime subscription
    ref.watch(realtimeClipsProvider);

    final clipsState = ref.watch(clipsNotifierProvider);
    final notifier = ref.read(clipsNotifierProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('ClipSync'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            tooltip: 'Settings',
            onPressed: () => context.push('/settings'),
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
      floatingActionButton: FloatingActionButton(
        onPressed: _saveFromClipboard,
        tooltip: 'Save clipboard',
        child: const Icon(Icons.content_paste_go),
      ),
    );
  }
}
