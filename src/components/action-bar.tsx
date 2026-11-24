import { Bookmark, Heart, MessageCircle, Repeat2, Share2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, icon, space, type } from '@/constants/theme';
import { formatCount } from '@/lib/format';

export type ActionBarProps = {
  likes: number;
  replies: number;
  reposts: number;
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onReply: () => void;
  onRepost: () => void;
  onShare: () => void;
  onSave: () => void;
};

/** 五动作：点赞 / 评论 / 转发 / 分享 / 收藏（顺序与 Web 版一致） */
export function ActionBar({
  likes,
  replies,
  reposts,
  liked,
  saved,
  onLike,
  onReply,
  onRepost,
  onShare,
  onSave,
}: ActionBarProps) {
  const idle = colors.mutedForeground;
  return (
    <View style={styles.row}>
      <Action
        onPress={onLike}
        label={formatCount(likes)}
        tint={liked ? colors.destructive : idle}
        icon={
          <Heart
            size={icon.size}
            strokeWidth={icon.stroke}
            color={liked ? colors.destructive : idle}
            fill={liked ? colors.destructive : 'none'}
          />
        }
      />
      <Action
        onPress={onReply}
        label={formatCount(replies)}
        tint={idle}
        icon={<MessageCircle size={icon.size} strokeWidth={icon.stroke} color={idle} />}
      />
      <Action
        onPress={onRepost}
        label={reposts ? formatCount(reposts) : ''}
        tint={idle}
        icon={<Repeat2 size={icon.size} strokeWidth={icon.stroke} color={idle} />}
      />
      <Action
        onPress={onShare}
        tint={idle}
        icon={<Share2 size={icon.size} strokeWidth={icon.stroke} color={idle} />}
      />
      <Action
        onPress={onSave}
        tint={saved ? colors.primary : idle}
        icon={
          <Bookmark
            size={icon.size}
            strokeWidth={icon.stroke}
            color={saved ? colors.primary : idle}
            fill={saved ? colors.primary : 'none'}
          />
        }
      />
    </View>
  );
}

function Action({
  icon: node,
  label,
  tint,
  onPress,
}: {
  icon: React.ReactNode;
  label?: string;
  tint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      {node}
      {label ? <Text style={[styles.count, { color: tint }]}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 30, marginTop: space.md },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 24 },
  pressed: { opacity: 0.55 },
  count: { ...type.num },
});
