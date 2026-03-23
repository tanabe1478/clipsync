import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:clipsync_mobile/shared/models/clip.dart';

class ClipItem extends StatelessWidget {
  final Clip clip;
  final VoidCallback onTogglePin;
  final VoidCallback onDelete;

  const ClipItem({
    super.key,
    required this.clip,
    required this.onTogglePin,
    required this.onDelete,
  });

  String _timeAgo(String dateStr) {
    final now = DateTime.now();
    final then = DateTime.parse(dateStr);
    final diff = now.difference(then);

    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Dismissible(
      key: Key(clip.id),
      direction: DismissDirection.endToStart,
      confirmDismiss: (direction) async {
        return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Delete clip?'),
            content: Text(
              clip.content.length > 50
                  ? '${clip.content.substring(0, 50)}...'
                  : clip.content,
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                child: const Text('Delete'),
              ),
            ],
          ),
        );
      },
      onDismissed: (_) => onDelete(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        color: theme.colorScheme.error,
        child: Icon(Icons.delete, color: theme.colorScheme.onError),
      ),
      child: ListTile(
        title: Text(
          clip.content,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontFamily: 'monospace', fontSize: 14),
        ),
        subtitle: Text(
          '${clip.deviceName} · ${_timeAgo(clip.createdAt)}',
          style: theme.textTheme.bodySmall,
        ),
        trailing: IconButton(
          icon: Icon(
            clip.pinned ? Icons.push_pin : Icons.push_pin_outlined,
            color: clip.pinned ? theme.colorScheme.primary : null,
          ),
          onPressed: onTogglePin,
        ),
        onTap: () {
          Clipboard.setData(ClipboardData(text: clip.content));
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Copied to clipboard'),
              duration: Duration(milliseconds: 1500),
            ),
          );
        },
      ),
    );
  }
}
