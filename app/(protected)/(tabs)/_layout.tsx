import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../src/theme';

/**
 * Bottom tab shell for the authenticated app. Add new modules (Teams,
 * Analytics, Live) as sibling screens + Tabs.Screen entries here later.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 10,
          elevation: 10,
          shadowColor: colors.navy,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="live-score"
        options={{
          title: 'Live Score',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'radio' : 'radio-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="player-profile"
        options={{
          title: 'Player Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'Analysis',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contact-us"
        options={{
          title: 'Contact Us',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'mail' : 'mail-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
