import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { TextField } from '../../../src/components/ui/TextField';
import { Button } from '../../../src/components/ui/Button';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/authStore';
import { contactService } from '../../../src/services/contactService';
import { isValidEmail } from '../../../src/utils/validation';

interface OfficeInfo {
  id: 'colombo' | 'moradabad';
  countryCode: string;
  flag: string;
  badge: string;
  city: string;
  title: string;
  name: string;
  addressLines: string[];
  fullAddress: string;
  phone: string;
  email: string;
  hours: string;
}

const OFFICES: OfficeInfo[] = [
  {
    id: 'colombo',
    countryCode: 'LK',
    flag: '🇱🇰',
    badge: 'Global HQ',
    city: 'Colombo',
    title: 'Head Office',
    name: 'AmaX Headquarters',
    addressLines: [
      'AmaX · Sutton Indoor Cricket Center',
      '29 Maitland Place',
      'Colombo 07, Sri Lanka',
    ],
    fullAddress: 'AmaX, Sutton Indoor Cricket Center, 29 Maitland Place, Colombo 07, Sri Lanka',
    phone: '+94 75 220 6006',
    email: 'alex@amaxlk.com',
    hours: 'Mon – Sat · 9:00 AM – 6:00 PM',
  },
  {
    id: 'moradabad',
    countryCode: 'IN',
    flag: '🇮🇳',
    badge: 'India Hub',
    city: 'Moradabad',
    title: 'India Office',
    name: 'AmaX India Regional Hub',
    addressLines: [
      'AmaX · Modern Public School',
      'Delhi Road, Near Circuit House',
      'Moradabad - 244001, Uttar Pradesh, India',
    ],
    fullAddress: 'AmaX, Modern Public School, Delhi Road, Near Circuit House, Moradabad 244001, India',
    phone: '+91 95289 43413',
    email: 'alex@amaxlk.com',
    hours: 'Mon – Sat · 9:00 AM – 6:00 PM',
  },
];

const INQUIRY_TOPICS = [
  { id: 'general', label: 'General Inquiry', icon: 'chatbubbles-outline' as const },
  { id: 'player_profile', label: 'Player Profile', icon: 'person-outline' as const },
  { id: 'live_scoring', label: 'Live Scoring', icon: 'radio-outline' as const },
  { id: 'academy_partner', label: 'Academy / Clubs', icon: 'business-outline' as const },
  { id: 'support', label: 'Technical Help', icon: 'build-outline' as const },
];

export default function ContactUsScreen() {
  const user = useAuthStore((s) => s.user);

  const [activeOfficeId, setActiveOfficeId] = useState<'colombo' | 'moradabad'>('colombo');
  const [selectedTopic, setSelectedTopic] = useState<string>('general');

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeOffice = OFFICES.find((o) => o.id === activeOfficeId) ?? OFFICES[0];

  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert('Unable to Call', `Please dial ${phoneNumber} directly from your phone.`);
    });
  };

  const handleEmail = (emailAddress: string) => {
    const subject = encodeURIComponent('AmaX Sports Inquiry');
    Linking.openURL(`mailto:${emailAddress}?subject=${subject}`).catch(() => {
      Alert.alert('Unable to Open Mail', `Please send your email to ${emailAddress}.`);
    });
  };

  const handleDirections = (fullAddress: string) => {
    const encoded = encodeURIComponent(fullAddress);
    const url = Platform.select({
      ios: `maps:0,0?q=${encoded}`,
      android: `geo:0,0?q=${encoded}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`).catch(() => {
        Alert.alert('Unable to Open Maps', 'Please search for the address in your maps app.');
      });
    });
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage(null);

    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Name is required';
    if (!email.trim()) nextErrors.email = 'Email is required';
    else if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address';
    if (!message.trim()) nextErrors.message = 'Message is required';
    else if (message.trim().length < 10) nextErrors.message = 'Please provide a bit more detail (min 10 characters)';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    const topicLabel = INQUIRY_TOPICS.find((t) => t.id === selectedTopic)?.label ?? 'General Inquiry';
    const payloadMessage = `[${topicLabel}] ${message.trim()}`;

    try {
      const responseMessage = await contactService.submit({
        name: name.trim(),
        email: email.trim(),
        message: payloadMessage,
      });
      setSuccessMessage(responseMessage || 'Your message has been sent successfully. We will get back to you soon!');
      setMessage('');
    } catch {
      setError('Could not send your message. Please verify your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessMessage(null);
    setError(null);
    setMessage('');
    setErrors({});
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} scroll backgroundColor={colors.background}>
      <View style={styles.container}>
        {/* TOP STATUS PILL & HEADER */}
        <View style={styles.header}>
          <View style={styles.statusPill}>
            <View style={styles.pulseDotOuter}>
              <View style={styles.pulseDotInner} />
            </View>
            <Text style={styles.statusPillText}>SUPPORT DESK ACTIVE</Text>
          </View>
          <Text style={styles.title}>Contact Us</Text>
          <Text style={styles.subtitle}>
            Have questions about your profile, tournaments, or partnerships? Our team is here to support you.
          </Text>
        </View>

        {/* QUICK CONNECT ACTION TILES */}
        <View style={styles.quickTilesRow}>
          <Pressable
            style={({ pressed }) => [styles.quickTile, pressed && styles.tilePressed]}
            onPress={() => handleCall(activeOffice.phone)}
          >
            <View style={[styles.tileIconWrapper, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.tileTitle}>Call Support</Text>
            <Text style={styles.tileSub}>Direct Line</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.quickTile, pressed && styles.tilePressed]}
            onPress={() => handleEmail(activeOffice.email)}
          >
            <View style={[styles.tileIconWrapper, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.tileTitle}>Email Us</Text>
            <Text style={styles.tileSub}>alex@amaxlk.com</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.quickTile, pressed && styles.tilePressed]}
            onPress={() => handleDirections(activeOffice.fullAddress)}
          >
            <View style={[styles.tileIconWrapper, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="navigate-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.tileTitle}>Visit Office</Text>
            <Text style={styles.tileSub}>{activeOffice.city}</Text>
          </Pressable>
        </View>

        {/* GLOBAL OFFICES SECTION */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTagRow}>
            <Ionicons name="globe-outline" size={14} color={colors.primary} />
            <Text style={styles.sectionOverline}>GLOBAL LOCATIONS</Text>
          </View>
        </View>

        {/* OFFICE SWITCHER TABS */}
        <View style={styles.officeSwitcher}>
          {OFFICES.map((office) => {
            const isActive = office.id === activeOfficeId;
            return (
              <Pressable
                key={office.id}
                onPress={() => setActiveOfficeId(office.id)}
                style={[styles.switcherTab, isActive && styles.switcherTabActive]}
              >
                <Text style={styles.switcherFlag}>{office.flag}</Text>
                <Text style={[styles.switcherTabText, isActive && styles.switcherTabTextActive]}>
                  {office.city}
                </Text>
                {isActive ? <View style={styles.activeTabDot} /> : null}
              </Pressable>
            );
          })}
        </View>

        {/* ACTIVE OFFICE DETAILS CARD */}
        <View style={styles.officeCard}>
          <View style={styles.officeCardHeader}>
            <View style={styles.officeTitleBlock}>
              <View style={styles.officeBadgeRow}>
                <Text style={styles.officeName}>{activeOffice.name}</Text>
                <View style={styles.officePill}>
                  <Text style={styles.officePillText}>{activeOffice.badge}</Text>
                </View>
              </View>
              <Text style={styles.officeCity}>{activeOffice.title} · {activeOffice.city}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Address row */}
          <View style={styles.metaRow}>
            <View style={styles.metaIconCircle}>
              <Ionicons name="location-sharp" size={15} color={colors.primary} />
            </View>
            <View style={styles.metaTextBlock}>
              <Text style={styles.metaLabel}>ADDRESS</Text>
              {activeOffice.addressLines.map((line, idx) => (
                <Text key={idx} style={styles.metaValue}>{line}</Text>
              ))}
            </View>
          </View>

          {/* Phone row */}
          <View style={styles.metaRow}>
            <View style={styles.metaIconCircle}>
              <Ionicons name="call" size={14} color={colors.primary} />
            </View>
            <View style={styles.metaTextBlock}>
              <Text style={styles.metaLabel}>PHONE NUMBER</Text>
              <Text style={styles.metaValue}>{activeOffice.phone}</Text>
            </View>
          </View>

          {/* Hours row */}
          <View style={styles.metaRow}>
            <View style={styles.metaIconCircle}>
              <Ionicons name="time-outline" size={15} color={colors.textMuted} />
            </View>
            <View style={styles.metaTextBlock}>
              <Text style={styles.metaLabel}>OPERATING HOURS</Text>
              <Text style={styles.metaValueSubtle}>{activeOffice.hours}</Text>
            </View>
          </View>

          {/* Office Action Buttons */}
          <View style={styles.cardActionRow}>
            <Pressable
              style={({ pressed }) => [styles.officeActionButton, pressed && styles.buttonPressed]}
              onPress={() => handleCall(activeOffice.phone)}
            >
              <Ionicons name="call" size={14} color={colors.white} />
              <Text style={styles.officeActionTextPrimary}>Call Office</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.officeSecondaryButton, pressed && styles.buttonPressed]}
              onPress={() => handleDirections(activeOffice.fullAddress)}
            >
              <Ionicons name="map-outline" size={14} color={colors.text} />
              <Text style={styles.officeActionTextSecondary}>Directions</Text>
            </Pressable>
          </View>
        </View>

        {/* SEND MESSAGE SECTION */}
        <View style={styles.formCard}>
          <View style={styles.formHeaderBlock}>
            <View style={styles.sectionTagRow}>
              <Ionicons name="paper-plane-outline" size={14} color={colors.primary} />
              <Text style={styles.sectionOverline}>DIRECT INQUIRY</Text>
            </View>
            <Text style={styles.formTitle}>Send Us a Message</Text>
            <Text style={styles.formSubtitle}>
              Leave your inquiry below and an AmaX sports specialist will reach out directly.
            </Text>
          </View>

          {/* SUCCESS BANNER OR FORM */}
          {successMessage ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-sharp" size={28} color={colors.primary} />
              </View>
              <Text style={styles.successHeading}>Message Dispatched</Text>
              <Text style={styles.successBody}>{successMessage}</Text>
              <Text style={styles.successSub}>
                We have also sent a confirmation to <Text style={styles.boldText}>{email}</Text>.
              </Text>
              <Button
                label="Send Another Message"
                variant="outline"
                onPress={handleResetForm}
                style={styles.resetButton}
              />
            </View>
          ) : (
            <View style={styles.formFields}>
              <ErrorBanner message={error} />

              {/* TOPIC SELECTOR */}
              <View style={styles.topicSection}>
                <Text style={styles.topicSectionLabel}>SELECT TOPIC</Text>
                <View style={styles.topicPillsContainer}>
                  {INQUIRY_TOPICS.map((topic) => {
                    const isSelected = selectedTopic === topic.id;
                    return (
                      <Pressable
                        key={topic.id}
                        onPress={() => setSelectedTopic(topic.id)}
                        style={[
                          styles.topicPill,
                          isSelected && styles.topicPillSelected,
                        ]}
                      >
                        <Ionicons
                          name={topic.icon}
                          size={13}
                          color={isSelected ? colors.white : colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.topicPillText,
                            isSelected && styles.topicPillTextSelected,
                          ]}
                        >
                          {topic.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* INPUT FIELDS */}
              <TextField
                label="Full Name"
                placeholder="e.g. Johnathan Smith"
                value={name}
                onChangeText={setName}
                leftIcon="person-outline"
                error={errors.name}
              />

              <TextField
                label="Email Address"
                placeholder="athlete@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
                error={errors.email}
              />

              <View style={styles.messageFieldWrapper}>
                <TextField
                  label="Message"
                  placeholder="How can our team help you today? Describe your request..."
                  value={message}
                  onChangeText={setMessage}
                  error={errors.message}
                  multiline
                  numberOfLines={4}
                  maxLength={2000}
                />
                <View style={styles.messageFooterRow}>
                  <Text style={styles.charCount}>
                    {message.length} / 2000
                  </Text>
                </View>
              </View>

              <Button
                label={isSubmitting ? 'Sending Message...' : 'Send Message'}
                variant="primary"
                onPress={handleSubmit}
                loading={isSubmitting}
                style={styles.submitButton}
              />

              <View style={styles.privacyNoteRow}>
                <Ionicons name="shield-checkmark-outline" size={13} color={colors.textFaint} />
                <Text style={styles.privacyNoteText}>
                  Your data is protected. We will never share your contact details.
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl + 20,
  },

  /* HEADER */
  header: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EDFDF5',
    borderWidth: 1,
    borderColor: '#C6F6D5',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: spacing.sm,
    gap: 6,
  },
  pulseDotOuter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDotInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.8,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 20,
    fontSize: 14,
  },

  /* QUICK TILES ROW */
  quickTilesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  quickTile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  tilePressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  tileIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tileTitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  tileSub: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },

  /* SECTION LABELS */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 4,
  },
  sectionTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionOverline: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.primary,
  },

  /* OFFICE SWITCHER */
  officeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#EBEBE4',
    padding: 4,
    borderRadius: radius.full,
    marginBottom: spacing.md,
    gap: 4,
  },
  switcherTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    gap: 6,
  },
  switcherTabActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  switcherFlag: {
    fontSize: 14,
  },
  switcherTabText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: colors.textMuted,
  },
  switcherTabTextActive: {
    color: colors.white,
  },
  activeTabDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.energy,
    marginLeft: 2,
  },

  /* OFFICE CARD */
  officeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  officeCardHeader: {
    marginBottom: spacing.xs,
  },
  officeTitleBlock: {
    gap: 3,
  },
  officeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  officeName: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: colors.text,
  },
  officePill: {
    backgroundColor: colors.energyLight,
    borderWidth: 1,
    borderColor: '#D0F060',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  officePillText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#365314',
    letterSpacing: 0.5,
  },
  officeCity: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: colors.textMuted,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: spacing.md,
  },
  metaIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  metaTextBlock: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textFaint,
  },
  metaValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  metaValueSubtle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: colors.textMuted,
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.xs,
  },
  officeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    gap: 8,
  },
  officeSecondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    gap: 8,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  officeActionTextPrimary: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: colors.white,
  },
  officeActionTextSecondary: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: colors.text,
  },

  /* FORM CARD */
  formCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.sm,
  },
  formHeaderBlock: {
    marginBottom: spacing.md,
  },
  formTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    lineHeight: 18,
  },
  formFields: {
    marginTop: spacing.xs,
  },

  /* TOPIC PILLS */
  topicSection: {
    marginBottom: spacing.md,
  },
  topicSectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  topicPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
  },
  topicPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  topicPillText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: colors.textMuted,
  },
  topicPillTextSelected: {
    color: colors.white,
  },

  messageFieldWrapper: {
    marginBottom: spacing.xs,
  },
  messageFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
  },
  charCount: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.textFaint,
  },

  submitButton: {
    marginTop: spacing.md + 4,
  },
  privacyNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  privacyNoteText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.textFaint,
    textAlign: 'center',
  },

  /* SUCCESS STATE */
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.energy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  successHeading: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  successBody: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  successSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textFaint,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  boldText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: colors.text,
  },
  resetButton: {
    minWidth: 200,
  },
});
