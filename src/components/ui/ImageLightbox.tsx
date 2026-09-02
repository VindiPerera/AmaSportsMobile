import React from 'react';
import { Image, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';

/**
 * Full-screen photo viewer (dark backdrop, image scaled to fit, X to close
 * or tap anywhere) — the "tap a cover/profile photo to see it large" pattern
 * used across the player profile screens. One shared component so every
 * screen that shows a cover/avatar photo gets the same behavior instead of
 * reimplementing its own Modal.
 *
 * Usage: `const [lightboxUri, setLightboxUri] = useState<string | null>(null);`
 * then wrap a tappable photo with `onPress={() => setLightboxUri(url)}` and
 * render `<ImageLightbox uri={lightboxUri} onClose={() => setLightboxUri(null)} />`
 * once per screen.
 */
export function ImageLightbox({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {uri ? <Image source={{ uri }} style={styles.image} resizeMode="contain" /> : null}
        <Pressable
          onPress={onClose}
          style={styles.closeButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={26} color={colors.white} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '75%',
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
