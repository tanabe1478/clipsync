import 'package:flutter/material.dart';
import 'package:clipsync_mobile/shared/models/clip.dart';
import 'package:clipsync_mobile/features/clips/presentation/clip_item.dart';

class ClipList extends StatelessWidget {
  final List<Clip> clips;
  final void Function(Clip clip) onTogglePin;
  final void Function(String clipId) onDelete;

  const ClipList({
    super.key,
    required this.clips,
    required this.onTogglePin,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    if (clips.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.content_paste_off,
              size: 48,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text(
              'No clips yet',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Share text from other apps or use the desktop shortcut',
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: clips.length,
      itemBuilder: (context, index) {
        final clip = clips[index];
        return ClipItem(
          clip: clip,
          onTogglePin: () => onTogglePin(clip),
          onDelete: () => onDelete(clip.id),
        );
      },
    );
  }
}
