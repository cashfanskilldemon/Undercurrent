import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius, space } from '@/constants/theme';
import { api } from '@/lib/api';
import { useComposer } from '@/lib/composer';
import { bumpRefresh } from '@/lib/refresh';
import { useResource } from '@/lib/use-paged';
import type { CreatePostPayload, CreateTrackPayload, Meta } from '@/lib/types';

const MAX_BODY = 280;
const COVERS = [null, 'cover-1.png', 'cover-2.png', 'cover-3.png', 'cover-4.png', 'cover-5.png', 'cover-6.png'];

/** 全局发帖 / 上传作品弹窗，由 useComposer().openComposer 唤起 */
export function ComposerDialog() {
  const { open, mode, preset, seq, closeComposer, openComposer } = useComposer();
  const meta = useResource<Meta>(open ? '/api/meta' : null);

  const [body, setBody] = useState('');
  const [channel, setChannel] = useState('闲聊');
  const [tags, setTags] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Boom Bap');
  const [bpm, setBpm] = useState('90');
  const [musicalKey, setMusicalKey] = useState('F 小调');
  const [blurb, setBlurb] = useState('');
  const [cover, setCover] = useState<string | null>('cover-1.png');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 每次打开重置表单，并应用预设频道/标签
  useEffect(() => {
    if (!open) return;
    setBody('');
    setChannel(preset.channel ?? '闲聊');
    setTags(preset.tag ? [preset.tag] : []);
    setImage(null);
    setTitle('');
    setGenre('Boom Bap');
    setBpm('90');
    setMusicalKey('F 小调');
    setBlurb('');
    setCover('cover-1.png');
    setError('');
  }, [open, seq, preset.channel, preset.tag]);

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length >= 3 ? prev : [...prev, tag],
    );
  }

  async function submitPost() {
    const text = body.trim();
    if (!text || saving) return;
    setSaving(true);
    setError('');
    try {
      const payload: CreatePostPayload = { channel, body: text, tags, image: image ?? undefined };
      await api.post('/api/posts', payload);
      bumpRefresh();
      closeComposer();
    } catch (e) {
      setError(e instanceof Error ? e.message : '发布失败');
    } finally {
      setSaving(false);
    }
  }

  async function submitTrack() {
    const name = title.trim();
    if (!name || saving) return;
    setSaving(true);
    setError('');
    try {
      const payload: CreateTrackPayload = {
        title: name,
        genre: genre === '全部' ? undefined : genre,
        bpm: Number(bpm) || 90,
        musicalKey: musicalKey.trim() || undefined,
        blurb: blurb.trim() || undefined,
        cover: cover ?? undefined,
        tags,
      };
      await api.post('/api/tracks', payload);
      bumpRefresh();
      closeComposer();
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败');
    } finally {
      setSaving(false);
    }
  }

  const channels = (meta.data?.channels ?? []).map((c) => c.name).filter((n) => n !== '全部');
  const genres = meta.data?.genres ?? [];
  const tagStats = meta.data?.tags ?? [];

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={closeComposer}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{mode === 'post' ? '发一条' : '上传作品'}</Text>
            <Pressable onPress={closeComposer} hitSlop={8} accessibilityLabel="关闭">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.tabs}>
            <Pressable
              onPress={() => openComposer('post', preset)}
              style={[styles.tab, mode === 'post' && styles.tabActive]}>
              <Text style={[styles.tabText, mode === 'post' && styles.tabTextActive]}>讨论帖</Text>
            </Pressable>
            <Pressable
              onPress={() => openComposer('upload', preset)}
              style={[styles.tab, mode === 'upload' && styles.tabActive]}>
              <Text style={[styles.tabText, mode === 'upload' && styles.tabTextActive]}>上传作品</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {mode === 'post' ? (
              <>
                <TextInput
                  style={styles.textarea}
                  value={body}
                  onChangeText={(t) => setBody(t.slice(0, MAX_BODY))}
                  placeholder="分享一段 beat、求个反馈，或者只是说点什么……"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  maxLength={MAX_BODY}
                  autoFocus={Platform.OS === 'web'}
                />
                <Text style={styles.count}>{body.length}/{MAX_BODY}</Text>

                <Text style={styles.section}>话题（最多 3 个）</Text>
                <View style={styles.chips}>
                  {tagStats.slice(0, 10).map((t) => (
                    <Pressable
                      key={t.tag}
                      onPress={() => toggleTag(t.tag)}
                      style={[styles.chip, tags.includes(t.tag) && styles.chipActive]}>
                      <Text style={[styles.chipText, tags.includes(t.tag) && styles.chipTextActive]}>
                        #{t.tag}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.section}>频道</Text>
                <ScrollView horizontal style={styles.chips} showsHorizontalScrollIndicator={false}>
                  {(channels.length ? channels : ['闲聊', '作品反馈', '混音母带']).map((c) => (
                    <Pressable key={c} onPress={() => setChannel(c)} style={[styles.chip, channel === c && styles.chipActive]}>
                      <Text style={[styles.chipText, channel === c && styles.chipTextActive]}>{c}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={styles.section}>配图（可选）</Text>
                <ScrollView horizontal style={styles.covers} showsHorizontalScrollIndicator={false}>
                  <Pressable onPress={() => setImage(null)} style={[styles.coverItem, image === null && styles.coverActive]}>
                    <Text style={styles.coverNone}>无图</Text>
                  </Pressable>
                  {COVERS.filter(Boolean).map((c) => (
                    <Pressable key={c!} onPress={() => setImage(c)} style={[styles.coverItem, image === c && styles.coverActive]}>
                      <Text style={styles.coverEmoji}>▦</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : (
              <>
                <Text style={styles.section}>作品名</Text>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="给作品起个名字" placeholderTextColor={colors.mutedForeground} />

                <Text style={styles.section}>流派</Text>
                <ScrollView horizontal style={styles.chips} showsHorizontalScrollIndicator={false}>
                  {(genres.length ? genres : ['Boom Bap', 'Trap', 'Phonk']).map((g) => (
                    <Pressable key={g} onPress={() => setGenre(g)} style={[styles.chip, genre === g && styles.chipActive]}>
                      <Text style={[styles.chipText, genre === g && styles.chipTextActive]}>{g}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.section}>BPM</Text>
                    <TextInput style={styles.input} value={bpm} onChangeText={setBpm} keyboardType="number-pad" placeholder="90" placeholderTextColor={colors.mutedForeground} />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.section}>调性</Text>
                    <TextInput style={styles.input} value={musicalKey} onChangeText={setMusicalKey} placeholder="F 小调" placeholderTextColor={colors.mutedForeground} />
                  </View>
                </View>

                <Text style={styles.section}>一句话简介</Text>
                <TextInput style={[styles.input, styles.blurb]} value={blurb} onChangeText={setBlurb} placeholder="说说这段作品的来历" placeholderTextColor={colors.mutedForeground} multiline />

                <Text style={styles.section}>封面</Text>
                <ScrollView horizontal style={styles.covers} showsHorizontalScrollIndicator={false}>
                  {COVERS.map((c, i) => (
                    <Pressable key={i} onPress={() => setCover(c)} style={[styles.coverItem, cover === c && styles.coverActive]}>
                      <Text style={c ? styles.coverEmoji : styles.coverNone}>{c ? '▦' : '无'}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <Pressable
            onPress={mode === 'post' ? submitPost : submitTrack}
            disabled={saving || !(mode === 'post' ? body.trim() : title.trim())}
            style={[styles.submit, (saving || !(mode === 'post' ? body.trim() : title.trim())) && styles.submitDisabled]}>
            {saving ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={styles.submitText}>{mode === 'post' ? '发布' : '提交'}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  close: { fontSize: 18, color: colors.mutedForeground },
  tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, backgroundColor: colors.input, borderRadius: radius.lg, padding: 3 },
  tab: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.mutedForeground },
  tabTextActive: { color: colors.primaryForeground, fontWeight: '700' },
  body: { paddingHorizontal: 20, maxHeight: 460 },
  textarea: { minHeight: 110, backgroundColor: colors.input, borderRadius: radius.lg, padding: 14, fontSize: 14, color: colors.foreground, textAlignVertical: 'top' },
  count: { alignSelf: 'flex-end', fontSize: 12, color: colors.mutedForeground, marginVertical: 6 },
  section: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, marginTop: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, height: 30, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.mutedForeground },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  covers: { flexDirection: 'row', gap: 8 },
  coverItem: { width: 56, height: 56, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  coverActive: { borderColor: colors.primary },
  coverNone: { fontSize: 12, color: colors.mutedForeground },
  coverEmoji: { fontSize: 26, color: colors.mutedForeground },
  input: { height: 42, backgroundColor: colors.input, borderRadius: radius.md, paddingHorizontal: 12, fontSize: 14, color: colors.foreground },
  blurb: { height: 70, textAlignVertical: 'top', paddingTop: 10 },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  error: { color: colors.destructive, fontSize: 13, marginTop: 12 },
  submit: { height: 46, margin: 20, marginTop: 16, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  submitDisabled: { backgroundColor: colors.accent },
  submitText: { fontSize: 16, fontWeight: '700', color: colors.primaryForeground },
});
