import { Tabs } from 'expo-router';
import { Bell, Disc3, Home, MessageSquare, Puzzle, Search, UserRound } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';
import { useBreakpoint } from '@/lib/use-breakpoint';

export default function TabsLayout() {
  // 宽屏 Web 用左侧导航，底部 tab 栏隐藏；窄屏/原生保持底部 tab
  const { wide } = useBreakpoint();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: wide
          ? { display: 'none' }
          : {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              borderTopWidth: StyleSheet.hairlineWidth,
              height: 58,
              paddingTop: 6,
            },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: '首页',
          tabBarIcon: ({ color, focused }) => (
            <Home size={21} strokeWidth={focused ? 2.1 : 1.7} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: '发现',
          tabBarIcon: ({ color, focused }) => (
            <Search size={21} strokeWidth={focused ? 2.1 : 1.7} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: '通知',
          tabBarIcon: ({ color, focused }) => (
            <Bell size={21} strokeWidth={focused ? 2.1 : 1.7} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: '讨论',
          tabBarIcon: ({ color, focused }) => (
            <MessageSquare size={21} strokeWidth={focused ? 2.1 : 1.7} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tracks"
        options={{
          title: '作品',
          tabBarIcon: ({ color, focused }) => (
            <Disc3 size={21} strokeWidth={focused ? 2.1 : 1.7} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plugins"
        options={{
          title: '插件',
          tabBarIcon: ({ color, focused }) => (
            <Puzzle size={21} strokeWidth={focused ? 2.1 : 1.7} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: '我的',
          tabBarIcon: ({ color, focused }) => (
            <UserRound size={21} strokeWidth={focused ? 2.1 : 1.7} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
