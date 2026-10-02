import React, { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';
import { colors, radius, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../../constants/config';
import { ApiError } from '../../types';

/**
 * Bottom-of-profile "Account" links. Google Play requires the privacy
 * policy to be reachable inside the app and an in-app way to delete the
 * account (User Data policy) — both live here.
 */
export function AccountSettingsSection() {
  const deleteAccount = useAuthStore((s) => s.deleteAccount);

  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const closeDelete = () => {
    if (isDeleting) return;
    setIsDeleteVisible(false);
    setPassword('');
    setError(null);
  };

  const handleDelete = async () => {
    if (!password) {
      setError('Enter your password to confirm.');
      return;
    }
    setError(null);
    setIsDeleting(true);
    try {
      await deleteAccount(password);
      setIsDeleteVisible(false);
      router.replace('/(auth)/login');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.firstFieldError ?? err.message : 'Could not delete your account. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Account</Text>

      <Pressable style={styles.row} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
        <Ionicons name="shield-outline" size={18} color={colors.textMuted} />
        <Text style={styles.rowText}>Privacy Policy</Text>
        <Ionicons name="open-outline" size={16} color={colors.textFaint} />
      </Pressable>

      <Pressable style={styles.row} onPress={() => Linking.openURL(TERMS_URL)}>
        <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
        <Text style={styles.rowText}>Terms of Service</Text>
        <Ionicons name="open-outline" size={16} color={colors.textFaint} />
      </Pressable>

      <Pressable style={[styles.row, styles.rowLast]} onPress={() => setIsDeleteVisible(true)}>
        <Ionicons name="trash-outline" size={18} color={colors.live} />
        <Text style={[styles.rowText, styles.dangerText]}>Delete account</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
      </Pressable>

      <Modal visible={isDeleteVisible} transparent animationType="fade" onRequestClose={closeDelete}>
        <Pressable style={styles.backdrop} onPress={closeDelete}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Delete your account?</Text>
            <Text style={styles.sheetBody}>
              This permanently deletes your account, player profile, every sport’s stats, your photos and your
              subscription. It can’t be undone.
            </Text>
            <TextField
              label="Password"
              placeholder="Enter your password to confirm"
              secureTextEntry
              secureToggle
              value={password}
              onChangeText={setPassword}
              error={error ?? undefined}
              editable={!isDeleting}
            />
            <View style={styles.actions}>
              <Button
                label="Permanently delete"
                variant="secondary"
                onPress={handleDelete}
                loading={isDeleting}
                style={styles.deleteBtn}
              />
              <Button label="Cancel" variant="outline" onPress={closeDelete} disabled={isDeleting} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  heading: {
    ...typography.overline,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowText: {
    ...typography.body,
    flex: 1,
  },
  dangerText: {
    color: colors.live,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  sheetTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  sheetBody: {
    ...typography.bodyMuted,
    marginBottom: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  deleteBtn: {
    backgroundColor: colors.live,
  },
});
