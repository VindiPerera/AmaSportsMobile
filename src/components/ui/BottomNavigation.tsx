import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export type TabKey = 'home' | 'live-score' | 'player-profile' | 'analysis' | 'player-search' | 'contact-us';

interface BottomNavigationProps {
  activeTab?: TabKey;
}

const TABS: { key: TabKey; title: string; icon: keyof typeof Ionicons.glyphMap; iconOutline: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { key: 'home', title: 'Home', icon: 'home', iconOutline: 'home-outline', route: '/(protected)/(tabs)/home' },
  { key: 'live-score', title: 'Live Score', icon: 'radio', iconOutline: 'radio-outline', route: '/(protected)/(tabs)/live-score' },
  { key: 'player-profile', title: 'Player Profile', icon: 'person', iconOutline: 'person-outline', route: '/(protected)/(tabs)/player-profile' },
  { key: 'analysis', title: 'Analysis', icon: 'stats-chart', iconOutline: 'stats-chart-outline', route: '/(protected)/(tabs)/analysis' },
  { key: 'player-search', title: 'Search', icon: 'search', iconOutline: 'search-outline', route: '/(protected)/(tabs)/player-search' },
  { key: 'contact-us', title: 'Contact Us', icon: 'mail', iconOutline: 'mail-outline', route: '/(protected)/(tabs)/contact-us' },
];

export function BottomNavigation({ activeTab = 'live-score' }: BottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 14);
  const containerHeight = 54 + bottomInset;

  const handlePress = (route: string) => {
    router.replace(route as any);
  };

  return (
    <View style={[styles.container, { height: containerHeight, paddingBottom: bottomInset }]}>
      {TABS.map((tab) => {
        const isFocused = activeTab === tab.key;
        const color = isFocused ? colors.primary : colors.textMuted;
        const iconName = isFocused ? tab.icon : tab.iconOutline;

        return (
          <Pressable
            key={tab.key}
            onPress={() => handlePress(tab.route)}
            style={styles.tabItem}
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
          >
            <Ionicons name={iconName} size={22} color={color} />
            <Text style={[styles.tabLabel, { color }, isFocused && styles.tabLabelFocused]} numberOfLines={1}>
              {tab.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    elevation: 12,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.1,
  },
  tabLabelFocused: {
    fontWeight: '800',
  },
});
