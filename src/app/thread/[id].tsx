import { useLocalSearchParams } from 'expo-router';
import { BadgeCheck, Heart, Play, Send } from 'lucide-react-native';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionBar } from '@/components/action-bar';
import { Avatar } from '@/components/avatar';
import { ErrorView } from '@/components/feedback';
import { colors, icon, radius, space, type } from '@/constants/theme';
import { formatCount, formatDuration, relativeTime } from '@/lib/format';
import type { Reply, ThreadDetail } from '@/lib/types';
import { useThreadActions } from '@/lib/use-thread-actions';
import { useResource } from '@/lib/use-paged';

export default function ThreadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data, loading, error, reload } = useResource<ThreadDetail>(id ? `/api/threads/${id}` : null);

  if (error) return <ErrorView message={error} onRetry={reload} />;
  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>{loading ? '加载中…' : '没有找到这条帖子'}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: space.xl }}>
        <ThreadBody thread={data} />

        <View style={styles.replyHead}>
          <Text style={styles.replyHeadText}>{data.replies.length} 条回复</Text>
        </View>

        {data.replies.length ? (
          data.replies.map((r) => <ReplyRow key={r.id} reply={r} />)
        ) : (
          <Text style={styles.empty}>还没有回复，说点什么</Text>
        )}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          style={styles.input}
          placeholder="写回复…"
          placeholderTextColor={colors.mutedForeground}
          editable={false}
          onPressIn={() => Alert.alert('回复接口待接入', '后端还没有 POST /api/threads/{id}/replies')}
        />
        <Pressable
          onPress={() => Alert.alert('回复接口待接入', '后端还没有 POST /api/threads/{id}/replies')}
          style={styles.send}>
          <Send size={16} strokeWidth={2} color={colors.primaryForeground} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function ThreadBody({ thread }: { thread: ThreadDetail }) {
  const { liked, likes, saved, toggleLike, toggleSave } = useThreadActions(thread);
  const track = thread.attachment?.track;

  return (
    <View style={styles.body}>
      <View style={styles.authorRow}>
        <Avatar name={thread.author.name} hue={thread.author.hue} size={44} />
        <View style={styles.authorMain}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{thread.author.name}</Text>
            {thread.author.verified ? (
              <BadgeCheck size={14} strokeWidth={2} color={colors.primary} />
            ) : null}
          </View>
          <Text style={styles.meta}>
            @{thread.author.handle}
            {thread.author.city ? ` · ${thread.author.city}` : ''}
          </Text>
        </View>
        <Text style={styles.meta}>{relativeTime(thread.createdAt)}</Text>
      </View>

      <Text style={styles.bodyText}>{thread.body}</Text>

      {thread.tags.length ? (
        <View style={styles.tags}>
          {thread.tags.map((t) => (
            <Text key={t} style={styles.tag}>
              #{t}
            </Text>
          ))}
        </View>
      ) : null}

      {track ? (
        <View style={styles.trackCard}>
          <View style={styles.trackCover}>
            <Play size={18} strokeWidth={2} color={colors.primary} fill={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {track.title}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {[track.bpm ? `${track.bpm} BPM` : null, formatDuration(track.durationSec)]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.stats}>
        <Text style={styles.meta}>
          {formatCount(likes)} 赞 · {formatCount(thread.reposts)} 转发 · {thread.channel}
        </Text>
      </View>

      <ActionBar
        likes={likes}
        replies={thread.repliesCount}
        reposts={thread.reposts}
        liked={liked}
        saved={saved}
        onLike={toggleLike}
        onReply={() => Alert.alert('写回复', '底部输入框还是占位，接口没做')}
        onRepost={() => Alert.alert('转发', '转发功能还没接')}
        onShare={() => Alert.alert('分享', '分享卡片待接')}
        onSave={toggleSave}
      />
    </View>
  );
}

function ReplyRow({ reply }: { reply: Reply }) {
  return (
    <View style={styles.reply}>
      <Avatar name={reply.author.name} hue={reply.author.hue} size={32} />
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.replyName}>{reply.author.name}</Text>
          <Text style={styles.meta}>@{reply.author.handle}</Text>
          <Text style={styles.meta}>· {relativeTime(reply.createdAt)}</Text>
        </View>
        <Text style={styles.replyBody}>{reply.body}</Text>
        <View style={styles.replyFoot}>
          <Heart size={13} strokeWidth={icon.stroke} color={colors.mutedForeground} />
          <Text style={styles.meta}>{formatCount(reply.likes)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  loading: { ...type.small, color: colors.mutedForeground },
  body: { padding: space.lg, gap: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorMain: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { ...type.title, color: colors.foreground },
  meta: { ...type.small, color: colors.mutedForeground },
  bodyText: { ...type.body, fontSize: 15, lineHeight: 24, color: colors.foreground },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { ...type.small, color: colors.primary },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  trackCover: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.elevated,
  },
  trackTitle: { ...type.label, color: colors.foreground },
  stats: { marginTop: 2 },
  replyHead: {
    paddingHorizontal: space.lg,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  replyHeadText: { ...type.label, color: colors.foreground },
  reply: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: space.lg,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  replyName: { ...type.label, color: colors.foreground },
  replyBody: { ...type.body, color: colors.foreground, marginTop: 2 },
  replyFoot: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  empty: { ...type.small, color: colors.mutedForeground, textAlign: 'center', paddingVertical: 28 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: space.lg,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    height: 38,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    backgroundColor: colors.input,
    color: colors.foreground,
    ...type.body,
  },
  send: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
