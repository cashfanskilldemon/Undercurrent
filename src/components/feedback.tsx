import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '@/constants/theme';

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>加载失败</Text>
      <Text style={styles.desc}>{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [styles.retry, pressed && { opacity: 0.6 }]}>
          <Text style={styles.retryText}>重试</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyView({ text = '这里还没有内容' }: { text?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.desc}>{text}</Text>
    </View>
  );
}

export function FootLoading({ loading, hasMore, count }: { loading: boolean; hasMore: boolean; count: number }) {
  if (loading) {
    return (
      <View style={styles.foot}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <View style={styles.foot}>
      <Text style={styles.desc}>{hasMore ? '上拉加载更多' : count ? '到底了' : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { padding: space.xxl, alignItems: 'center', gap: space.sm },
  title: { ...type.label, color: colors.foreground },
  desc: { ...type.small, color: colors.mutedForeground, textAlign: 'center' },
  retry: {
    marginTop: space.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  retryText: { ...type.label, color: colors.foreground },
  foot: { paddingVertical: 18, alignItems: 'center' },
});
