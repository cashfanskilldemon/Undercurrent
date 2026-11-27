import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { hueColor, hueText } from '@/constants/theme';
import { API_BASE } from '@/lib/api';

/**
 * 有 avatar 就显示图片，加载失败自动回退到色相色块 + 首字。
 * avatar 存的是相对路径 /avatars/{id}.png?t=xxx，Web/原生都拼 API_BASE 访问后端静态目录。
 */
export function Avatar({
  name,
  hue,
  avatar,
  size = 40,
}: {
  name: string;
  hue: number;
  avatar?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(avatar) && !failed;

  if (showImage) {
    const uri = avatar!.startsWith('http') ? avatar! : `${API_BASE}${avatar!}`;
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: hueColor(hue) }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: hueColor(hue) },
      ]}>
      <Text
        numberOfLines={1}
        style={[styles.text, { fontSize: Math.round(size * 0.42), color: hueText(hue) }]}>
        {name.slice(0, 1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '600' },
});
