import { useRouter } from 'expo-router';
import { BadgeCheck, Play } from 'lucide-react-native';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { ActionBar } from '@/components/action-bar';
import { Avatar } from '@/components/avatar';
import { colors, icon, radius, space, type } from '@/constants/theme';
import { formatDuration, relativeTime } from '@/lib/format';
import type { PostItem } from '@/lib/types';
import { usePostActions } from '@/lib/use-post-actions';

export function PostCard({ post }: { post: PostItem }) {
  const router = useRouter();
  const { liked, likes, saved, toggleLike, toggleSave } = usePostActions(post);
  const track = post.attachment?.track;

  const open = () => router.push(`/post/${post.id}`);

  const onShare = async () => {
    try {
      await Share.share({ message: `${post.author.name}：${post.body.slice(0, 60)}` });
    } catch {
      // 用户取消分享，不处理
    }
  };

  return (
    <Pressable onPress={open} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Avatar name={post.author.name} hue={post.author.hue} size={40} />

      <View style={styles.main}>
        <View style={styles.head}>
          <Text style={styles.name} numberOfLines={1}>
            {post.author.name}
          </Text>
          {post.author.verified ? (
            <BadgeCheck size={14} strokeWidth={2} color={colors.primary} />
          ) : null}
          <Text style={styles.meta} numberOfLines={1}>
            @{post.author.handle}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{relativeTime(post.createdAt)}</Text>
          {post.pinned ? (
            <View style={styles.pin}>
              <Text style={styles.pinText}>置顶</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.body} numberOfLines={12}>
          {post.body}
        </Text>

        {post.tags.length ? (
          <View style={styles.tags}>
            {post.tags.map((t) => (
              <Text key={t} style={styles.tag}>
                #{t}
              </Text>
            ))}
          </View>
        ) : null}

        {track ? (
          <View style={styles.attach}>
            <View style={styles.cover}>
              <Play size={16} strokeWidth={2} color={colors.primary} fill={colors.primary} />
            </View>
            <View style={styles.attachMain}>
              <Text style={styles.attachTitle} numberOfLines={1}>
                {track.title}
              </Text>
              <Text style={styles.attachMeta} numberOfLines={1}>
                {[track.bpm ? `${track.bpm} BPM` : null, formatDuration(track.durationSec)]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          </View>
        ) : null}

        <ActionBar
          likes={likes}
          replies={post.repliesCount}
          reposts={post.reposts}
          liked={liked}
          saved={saved}
          onLike={toggleLike}
          onReply={open}
          onRepost={() => Alert.alert('转发', '转发功能还没接，先占个位')}
          onShare={onShare}
          onSave={toggleSave}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.card },
  main: { flex: 1, gap: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  /** 名称：参照 X 的观感，白色半粗且比正文略大 */
  name: { fontSize: 16, lineHeight: 21, fontWeight: '600', color: colors.strong, maxWidth: 160 },
  meta: { fontSize: 13, lineHeight: 18, color: colors.mutedForeground },
  dot: { fontSize: 13, lineHeight: 18, color: colors.mutedForeground },
  pin: {
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  pinText: { ...type.caption, color: colors.mutedForeground },
  /** 正文：14px / 细体，行高收紧 */
  body: { ...type.body, fontSize: 14, lineHeight: 20, fontWeight: '300', color: colors.strong, marginTop: 3 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  tag: { fontSize: 13, lineHeight: 18, color: colors.primary },
  attach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
    padding: 8,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cover: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.elevated,
  },
  attachMain: { flex: 1 },
  attachTitle: { ...type.label, color: colors.foreground },
  attachMeta: { ...type.caption, color: colors.mutedForeground },
});
