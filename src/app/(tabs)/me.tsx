import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  Disc3,
  Heart,
  LayoutGrid,
  Link2,
  MessageCircle,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { pickAndUploadAvatar } from '@/lib/avatar-upload';
import { useComposer } from '@/lib/composer';
import { colors, hueColor, hueText, radius, space, type } from '@/constants/theme';
import { API_BASE, api } from '@/lib/api';
import { assetUrl, formatCount } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { Paged, PostItem, TrackItem, UserLink, UserProfile } from '@/lib/types';
import { useResource } from '@/lib/use-paged';
import { useBreakpoint } from '@/lib/use-breakpoint';

type ProfileTab = 'posts' | 'tracks' | 'saved';

type Tile = {
  key: string;
  image: string | null;
  hue: number;
  glyph: string;
  likes: number;
  comments: number;
  onPress: () => void;
};

function imageUri(file?: string | null): string | null {
  const u = assetUrl(file);
  if (!u) return null;
  return Platform.OS === 'web' ? u : `${API_BASE}${u}`;
}

function GridTile({ tile, index }: { tile: Tile; index: number }) {
  const [failed, setFailed] = useState(false);
  const showImage = tile.image && !failed;
  return (
    <Pressable
      testID="profile-tile"
      onPress={tile.onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}>
      {showImage ? (
        <Image
          source={{ uri: tile.image! }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.tileFallback,
            { backgroundColor: hueColor(tile.hue, 32, 22 + (index % 4) * 5) },
          ]}>
          <Text style={[styles.tileGlyph, { color: hueText(tile.hue) }]}>{tile.glyph.slice(0, 1)}</Text>
        </View>
      )}
      {Platform.OS === 'web' ? (
        <View testID="profile-tile-overlay" style={styles.tileOverlay}>
          <View style={styles.tileStat}>
            <Heart size={15} color="#fff" strokeWidth={2} fill="#fff" />
            <Text style={styles.tileStatText}>{formatCount(tile.likes)}</Text>
          </View>
          <View style={styles.tileStat}>
            <MessageCircle size={15} color="#fff" strokeWidth={2} fill="#fff" />
            <Text style={styles.tileStatText}>{formatCount(tile.comments)}</Text>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

function Stat({
  num,
  label,
  onPress,
}: {
  num: number;
  label: string;
  onPress?: () => void;
}) {
  const body = (
    <>
      <Text style={styles.statNum}>{formatCount(num)}</Text>
      <Text style={styles.statLabel}>{' ' + label}</Text>
    </>
  );
  return onPress ? (
    <Pressable onPress={onPress} style={styles.stat} hitSlop={4}>
      {body}
    </Pressable>
  ) : (
    <View style={styles.stat}>{body}</View>
  );
}

function EditProfileModal({
  profile,
  onClose,
  onSaved,
  onAvatarChanged,
}: {
  profile: UserProfile;
  onClose: () => void;
  onSaved: () => void;
  onAvatarChanged: () => void;
}) {
  const [nickname, setNickname] = useState(profile.name ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarMenu, setAvatarMenu] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  // 二级填写层：点某一行弹出「编辑 XX」（参照 Threads 编辑页）
  const [field, setField] = useState<'name' | 'bio' | 'city' | null>(null);
  // 链接三级菜单：编辑主页 → 链接列表 → 添加链接
  const [links, setLinks] = useState<UserLink[]>(profile.links ?? []);
  const [linkView, setLinkView] = useState<'list' | 'add' | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);

  const openLinks = async () => {
    setError(null);
    setLinkView('list');
    try {
      setLinks(await api.get<UserLink[]>(`/api/users/${profile.id}/links`));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载链接失败');
    }
  };

  const addLink = async () => {
    if (!linkUrl.trim()) {
      setError('请输入网址');
      return;
    }
    setLinkBusy(true);
    setError(null);
    try {
      const created = await api.post<UserLink>(`/api/users/${profile.id}/links`, {
        url: linkUrl.trim(),
        title: linkTitle.trim() || null,
      });
      setLinks([...links, created]);
      setLinkUrl('');
      setLinkTitle('');
      setLinkView('list');
      onAvatarChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : '添加失败');
    } finally {
      setLinkBusy(false);
    }
  };

  const removeLink = async (id: number) => {
    setError(null);
    try {
      await api.delete(`/api/users/${profile.id}/links/${id}`);
      setLinks(links.filter((l) => l.id !== id));
      onAvatarChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败');
    }
  };
  // 四页横向滑动（照侧边菜单「外观」面板）：0 资料列表 / 1 字段填写 / 2 链接列表 / 3 添加链接
  const [page1H, setPage1H] = useState(0);
  const [page2H, setPage2H] = useState(0);
  const [page3H, setPage3H] = useState(0);
  const [page4H, setPage4H] = useState(0);
  const pageIndex = linkView === 'add' ? 3 : linkView === 'list' ? 2 : field ? 1 : 0;
  const pageH = [page1H, page2H, page3H, page4H][pageIndex];


  const uploadAvatar = async () => {
    setAvatarMenu(false);
    setAvatarBusy(true);
    setError(null);
    try {
      const result = await pickAndUploadAvatar(profile.id);
      if (result.ok) onAvatarChanged();
      else setError(`头像上传失败：${result.error ?? '未知错误'}`);
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarMenu(false);
    setAvatarBusy(true);
    setError(null);
    try {
      await api.delete(`/api/users/${profile.id}/avatar`);
      onAvatarChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : '移除失败');
    } finally {
      setAvatarBusy(false);
    }
  };

  const submit = async (close = true) => {
    if (!nickname.trim()) {
      setError('昵称不能为空');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.put(`/api/users/${profile.id}`, {
        nickname: nickname.trim(),
        bio: bio.trim() || null,
        city: city.trim() || null,
      });
      if (close) {
        onSaved();
      } else {
        // 二级弹层保存：回列表并刷新主页，主弹窗保持打开
        setField(null);
        onAvatarChanged();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 二级弹层的字段元数据
  const fieldMeta = field
    ? {
        name: { title: '编辑名字', value: nickname, set: setNickname, max: 40, multi: false, placeholder: '你的名字', hint: '14 天内可以更改名字两次。' },
        bio: { title: '编辑个性签名', value: bio, set: setBio, max: 200, multi: true, placeholder: '介绍一下自己', hint: '个性签名设为公开。' },
        city: { title: '编辑城市', value: city, set: setCity, max: 40, multi: false, placeholder: '所在的城市', hint: '城市会显示在你的主页上。' },
      }[field]
    : null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        testID="profile-edit-modal"
        style={[styles.modal, pageH ? { height: pageH } : null]}>
        <View testID="profile-edit-pages" style={styles.pages}>
          {/* 第一页：资料列表 */}
          <View
            testID="profile-edit-page-0"
            style={[styles.page, pageIndex !== 0 && styles.pageHidden]}
            onLayout={(e) => setPage1H(e.nativeEvent.layout.height)}>
            <View style={styles.editHead}>
              <Pressable onPress={onClose} hitSlop={8}>
                <Text style={styles.editCancel}>取消</Text>
              </Pressable>
              <View style={styles.avatarPicker}>
                <Pressable
                  testID="profile-avatar-trigger"
                  onPress={() => setAvatarMenu((v) => !v)}
                  disabled={avatarBusy}>
                  <Avatar name={profile.name} hue={profile.hue} avatar={profile.avatar} size={44} />
                </Pressable>
                {avatarBusy ? <ActivityIndicator style={styles.avatarBusy} color={colors.primary} /> : null}
              </View>
            </View>

            {avatarMenu ? (
              <View testID="profile-avatar-menu" style={styles.avatarMenu}>
                <Pressable onPress={uploadAvatar} style={styles.avatarMenuItem}>
                  <Text style={styles.avatarMenuText}>上传图片</Text>
                </Pressable>
                {profile.avatar ? (
                  <Pressable onPress={removeAvatar} style={[styles.avatarMenuItem, styles.avatarMenuRemoveItem]}>
                    <Text style={styles.avatarMenuRemove}>移除当前头像</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} style={styles.editScroll}>
              <Pressable testID="profile-edit-name" style={styles.editRow} onPress={() => setField('name')}>
                <Text style={styles.editLabel}>名字</Text>
                <Text style={styles.editValue}>{nickname || '未设置'}</Text>
              </Pressable>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>账号</Text>
                <Text style={styles.editReadonly}>@{profile.handle}</Text>
              </View>
              <Pressable testID="profile-edit-bio" style={styles.editRow} onPress={() => setField('bio')}>
                <Text style={styles.editLabel}>个性签名</Text>
                <Text style={styles.editValue}>{bio || '未设置'}</Text>
              </Pressable>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>兴趣</Text>
                <Text style={styles.editReadonly}>{profile.role ?? '未设置'}</Text>
              </View>
              <Pressable testID="profile-edit-links" style={styles.editRow} onPress={openLinks}>
                <Text style={styles.editLabel}>链接</Text>
                <Text style={styles.editValue} numberOfLines={1}>
                  {links.length ? (links[0].title || links[0].url) : `undercurrent.app/@${profile.handle}`}
                </Text>
              </Pressable>
              <Pressable testID="profile-edit-city" style={[styles.editRow, styles.editRowLast]} onPress={() => setField('city')}>
                <Text style={styles.editLabel}>城市</Text>
                <Text style={styles.editValue}>{city || '未设置'}</Text>
              </Pressable>
              {error ? <Text style={styles.modalError}>{error}</Text> : null}
            </ScrollView>

            <Pressable
              testID="profile-edit-save"
              onPress={() => submit()}
              disabled={saving}
              style={({ pressed }) => [styles.doneBtn, (pressed || saving) && styles.pressed]}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.doneText}>完成</Text>
              )}
            </Pressable>
          </View>

          {/* 第二页：单个字段填写层 */}
          <View
            testID="profile-edit-page-1"
            style={[styles.page, pageIndex !== 1 && styles.pageHidden]}
            onLayout={(e) => setPage2H(e.nativeEvent.layout.height)}>
            {fieldMeta ? (
              <>
                <View style={styles.fieldHead}>
                  <Pressable onPress={() => setField(null)} hitSlop={8} testID="field-back">
                    <ArrowLeft size={20} color={colors.foreground} strokeWidth={2} />
                  </Pressable>
                  <Text style={styles.fieldTitle}>{fieldMeta.title}</Text>
                  <Pressable onPress={() => submit(false)} hitSlop={8} disabled={saving} testID="field-done">
                    {saving ? (
                      <ActivityIndicator size="small" color={colors.foreground} />
                    ) : (
                      <Text style={styles.fieldDone}>完成</Text>
                    )}
                  </Pressable>
                </View>
                <TextInput
                  testID="field-input"
                  autoFocus
                  multiline={fieldMeta.multi}
                  style={[styles.fieldInput, fieldMeta.multi && styles.fieldInputMulti]}
                  value={fieldMeta.value}
                  onChangeText={fieldMeta.set}
                  placeholder={fieldMeta.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  maxLength={fieldMeta.max}
                />
                <Text style={styles.fieldHint}>{fieldMeta.hint}</Text>
                {error ? <Text style={styles.modalError}>{error}</Text> : null}
              </>
            ) : null}
          </View>

          {/* 第三页：链接列表 */}
          <View
            testID="profile-edit-page-2"
            style={[styles.page, pageIndex !== 2 && styles.pageHidden]}
            onLayout={(e) => setPage3H(e.nativeEvent.layout.height)}>
            <View style={styles.fieldHead}>
              <Pressable onPress={() => setLinkView(null)} hitSlop={8} testID="link-list-back">
                <ArrowLeft size={20} color={colors.foreground} strokeWidth={2} />
              </Pressable>
              <Text style={styles.fieldTitle}>链接</Text>
              <View style={styles.fieldHeadSpacer} />
            </View>
            <Pressable
              testID="link-add-entry"
              onPress={() => {
                setLinkUrl('');
                setLinkTitle('');
                setError(null);
                setLinkView('add');
              }}
              style={styles.linkAddRow}>
              <Text style={styles.linkAddText}>添加链接</Text>
              <Link2 size={18} color={colors.foreground} strokeWidth={1.9} />
            </Pressable>
            <ScrollView style={styles.linkList} showsVerticalScrollIndicator={false}>
              {links.map((link) => (
                <View key={link.id} style={styles.linkItem}>
                  <View style={styles.linkItemText}>
                    <Text style={styles.linkItemTitle} numberOfLines={1}>
                      {link.title || link.url}
                    </Text>
                    <Text style={styles.linkItemUrl} numberOfLines={1}>
                      {link.url}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeLink(link.id)} hitSlop={8}>
                    <Trash2 size={16} color={colors.destructive} strokeWidth={1.9} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
          </View>

          {/* 第四页：添加链接 */}
          <View
            testID="profile-edit-page-3"
            style={[styles.page, pageIndex !== 3 && styles.pageHidden]}
            onLayout={(e) => setPage4H(e.nativeEvent.layout.height)}>
            <View style={styles.fieldHead}>
              <Pressable onPress={() => setLinkView('list')} hitSlop={8} testID="link-add-back">
                <ArrowLeft size={20} color={colors.foreground} strokeWidth={2} />
              </Pressable>
              <Text style={styles.fieldTitle}>添加链接</Text>
              <Pressable onPress={addLink} hitSlop={8} disabled={linkBusy} testID="link-add-done">
                {linkBusy ? (
                  <ActivityIndicator size="small" color={colors.foreground} />
                ) : (
                  <Text style={styles.fieldDone}>完成</Text>
                )}
              </Pressable>
            </View>
            <TextInput
              testID="link-url"
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.fieldInput}
              value={linkUrl}
              onChangeText={setLinkUrl}
              placeholder="网址"
              placeholderTextColor={colors.mutedForeground}
            />
            <TextInput
              testID="link-title"
              style={styles.fieldInput}
              value={linkTitle}
              onChangeText={setLinkTitle}
              placeholder="标题（选填）"
              placeholderTextColor={colors.mutedForeground}
              maxLength={40}
            />
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wide } = useBreakpoint();
  const { userId } = useSession();
  const { openComposer } = useComposer();
  const [tab, setTab] = useState<ProfileTab>('posts');
  const [editing, setEditing] = useState(false);

  const profile = useResource<UserProfile>(userId == null ? null : `/api/users/${userId}`);
  // 后端暂无按作者过滤的参数，数据量小，拉全量在前端筛
  const posts = useResource<Paged<PostItem>>('/api/posts?size=100');
  const tracks = useResource<Paged<TrackItem>>('/api/tracks?size=100');

  if (userId == null) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: wide ? 20 : insets.top + 10 }]}>
          <Text style={styles.title}>我的</Text>
        </View>
        <View style={styles.guest}>
          <Text style={styles.guestTitle}>还没有登录</Text>
          <Text style={styles.guestHint}>
            登录后可以发帖、上传作品、点赞收藏，并收到回复和关注通知。
          </Text>
          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [styles.loginBtn, pressed && styles.pressed]}>
            <Text style={styles.loginText}>登录 / 注册</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const me = profile.data;
  const allPosts = posts.data?.list ?? [];
  const myPosts = allPosts.filter((t) => t.author.id === userId);
  const savedPosts = allPosts.filter((t) => t.saved);
  const myTracks = (tracks.data?.list ?? []).filter((t) => t.artist.id === userId);

  let tiles: Tile[] = [];
  if (tab === 'tracks') {
    tiles = myTracks.map((t, i) => ({
      key: `track-${t.id}`,
      image: imageUri(t.cover),
      hue: t.artist?.hue ?? 122,
      glyph: t.title || '作',
      likes: t.likes,
      comments: t.comments,
      onPress: () => router.push('/tracks'),
    }));
  } else {
    const source = tab === 'saved' ? savedPosts : myPosts;
    tiles = source.map((t) => ({
      key: `${tab}-${t.id}`,
      image: imageUri(t.image || t.attachment?.track?.cover),
      hue: t.author.hue,
      glyph: t.body || '贴',
      likes: t.likes,
      comments: t.repliesCount,
      onPress: () => router.push(`/post/${t.id}`),
    }));
  }

  const share = () =>
    Share.share({
      message: `${me?.name ?? '我'} 的主页 · @${me?.handle ?? ''} — UNDERCURRENT ${API_BASE}`,
    }).catch(() => {});

  const tabItems: { key: ProfileTab; label: string; Icon: typeof LayoutGrid }[] = [
    { key: 'posts', label: '帖子', Icon: LayoutGrid },
    { key: 'tracks', label: '作品', Icon: Disc3 },
    { key: 'saved', label: '收藏', Icon: Bookmark },
  ];

  return (
    <View style={styles.screen}>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={tiles}
        numColumns={3}
        keyExtractor={(item) => item.key}
        renderItem={({ item, index }) => <GridTile tile={item} index={index} />}
        columnWrapperStyle={styles.tileRow}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        ListHeaderComponent={
          <View>
            <View style={[styles.profile, { paddingTop: wide ? 40 : insets.top + 16 }]}>
              <View style={styles.identity}>
                <Avatar name={me?.name ?? '我'} hue={me?.hue ?? 122} avatar={me?.avatar} size={160} />
                <View style={styles.identityMain}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {me?.name ?? `用户 #${userId}`}
                    </Text>
                    {me?.verified ? (
                      <BadgeCheck size={22} color={colors.primary} strokeWidth={2} />
                    ) : null}
                  </View>
                  <Text style={styles.handle}>@{me?.handle ?? ''}</Text>
                  <View style={styles.stats}>
                    <Stat num={me?.posts ?? 0} label="帖子" onPress={() => setTab('posts')} />
                    <Stat num={me?.followers ?? 0} label="粉丝" />
                    <Stat num={me?.following ?? 0} label="关注" />
                  </View>
                  {me?.bio ? <Text style={styles.bio}>{me.bio}</Text> : null}
                  {me?.role || me?.city ? (
                    <Text style={styles.roleCity}>
                      {[me?.role, me?.city].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                  <Pressable onPress={share} style={styles.linkRow} hitSlop={4}>
                    <Link2 size={14} color={colors.mutedForeground} />
                    <Text style={styles.linkText}>undercurrent.app/@{me?.handle ?? ''}</Text>
                  </Pressable>
                  {me?.links?.map((link) => (
                    <Pressable
                      key={link.id}
                      onPress={() => Linking.openURL(link.url)}
                      style={styles.linkRow}
                      hitSlop={4}>
                      <Link2 size={14} color={colors.mutedForeground} />
                      <Text style={styles.linkText} numberOfLines={1}>
                        {link.title || link.url}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable
                  testID="profile-edit"
                  onPress={() => setEditing(true)}
                  disabled={!me}
                  style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
                  <Pencil size={16} color={colors.foreground} strokeWidth={1.9} />
                  <Text style={styles.actionText}>编辑主页</Text>
                </Pressable>
                <Pressable
                  testID="profile-share"
                  onPress={share}
                  style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
                  <Share2 size={16} color={colors.foreground} strokeWidth={1.9} />
                  <Text style={styles.actionText}>分享主页</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.highlights}
                contentContainerStyle={styles.highlightsContent}>
                <Pressable onPress={() => setTab('posts')} style={styles.highlight} hitSlop={4}>
                  <View style={styles.highlightRing}>
                    <Avatar name={me?.name ?? '我'} hue={me?.hue ?? 122} avatar={me?.avatar} size={70} />
                  </View>
                </Pressable>
                <Pressable onPress={() => openComposer('post')} style={styles.highlight} hitSlop={4}>
                  <View style={styles.highlightNew}>
                    <Plus size={26} color={colors.foreground} strokeWidth={1.6} />
                  </View>
                </Pressable>
              </ScrollView>
            </View>

            <View style={styles.tabs}>
              {tabItems.map(({ key, label, Icon }) => (
                <Pressable
                  key={key}
                  testID={`profile-tab-${key}`}
                  onPress={() => setTab(key)}
                  style={styles.tab}>
                  <Icon
                    size={19}
                    strokeWidth={tab === key ? 2.2 : 1.7}
                    color={tab === key ? colors.foreground : colors.mutedForeground}
                  />
                  <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
                  {tab === key ? <View style={styles.tabBar} /> : null}
                </Pressable>
              ))}
            </View>

            {tiles.length === 0 ? (
              <View style={styles.empty}>
                {profile.error || posts.error || tracks.error ? (
                  <Text style={styles.emptyText}>
                    {profile.error ?? posts.error ?? tracks.error ?? '加载失败'}
                  </Text>
                ) : profile.loading || posts.loading || tracks.loading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={styles.emptyText}>
                    {tab === 'posts' ? '还没有发过帖子' : tab === 'tracks' ? '还没有上传作品' : '还没有收藏帖子'}
                  </Text>
                )}
              </View>
            ) : null}
          </View>
        }
      />

      {editing && me ? (
        <EditProfileModal
          profile={me}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            profile.reload();
          }}
          onAvatarChanged={profile.reload}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { ...type.title, color: colors.foreground, fontSize: 16, fontWeight: '700' },
  profile: { paddingHorizontal: space.lg, paddingTop: 28, alignItems: 'center' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 40, justifyContent: 'center' },
  identityMain: { width: 360, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 26, lineHeight: 32, fontWeight: '700', color: colors.strong },
  handle: { fontSize: 15, color: colors.mutedForeground },
  stats: { flexDirection: 'row', gap: 22, marginTop: 12 },
  stat: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  statNum: { fontSize: 17, fontWeight: '700', color: colors.strong, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 15, color: colors.mutedForeground },
  bio: { marginTop: 14, fontSize: 16, lineHeight: 24, color: colors.strong },
  roleCity: { marginTop: 6, fontSize: 14, color: colors.mutedForeground },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  linkText: { fontSize: 14, color: colors.primary },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24, width: '100%', maxWidth: 660 },
  actionBtn: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  actionText: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  pressed: { opacity: 0.6 },
  highlights: { marginTop: 22 },
  highlightsContent: { justifyContent: 'center', paddingHorizontal: space.lg },
  highlight: { alignItems: 'center', gap: 8, marginRight: 20 },
  highlightRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  highlightNew: {
    width: 76,
    height: 76,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, marginTop: 22 },
  tab: { flex: 1, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, position: 'relative' },
  tabText: { fontSize: 13, color: colors.mutedForeground },
  tabTextActive: { color: colors.foreground, fontWeight: '700' },
  tabBar: { position: 'absolute', bottom: -1, left: '22%', width: '56%', height: 2, backgroundColor: colors.foreground },
  tileRow: { gap: 3, paddingHorizontal: 1 },
  tile: { flex: 1, aspectRatio: 1, marginBottom: 3, backgroundColor: colors.accent, overflow: 'hidden' },
  tilePressed: { opacity: 0.75 },
  tileFallback: { alignItems: 'center', justifyContent: 'center' },
  tileGlyph: { fontSize: 42, fontWeight: '700' },
  tileOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.42)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    opacity: 0,
  },
  tileStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tileStatText: { fontSize: 14, fontWeight: '700', color: '#fff', fontVariant: ['tabular-nums'] },
  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { fontSize: 13, color: colors.mutedForeground },
  overlay: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    inset: 0,
    zIndex: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '88%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
  },
  /** 两页横向排列，靠 translateX 滑动切换（同侧边菜单「外观」面板） */
  pages: { flexDirection: 'row', alignItems: 'flex-start' },
  page: { width: '100%', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 20 },
  pageHidden: { display: 'none' },
  editHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  editCancel: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  avatarPicker: { position: 'relative' },
  avatarBusy: { position: 'absolute', top: 12, left: 12 },
  /** 内联展开块：不依赖 zIndex，避免 RN Web 下被 ScrollView 盖住点不到 */
  avatarMenu: {
    alignSelf: 'flex-end',
    minWidth: 150,
    backgroundColor: colors.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingVertical: 4,
    marginBottom: 8,
  },
  avatarMenuItem: { paddingHorizontal: 14, paddingVertical: 10 },
  avatarMenuRemoveItem: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  avatarMenuText: { fontSize: 13, color: colors.foreground },
  avatarMenuRemove: { fontSize: 13, color: colors.destructive },
  editScroll: { maxHeight: 500 },
  /** 每行：上标签、下值，底部分隔线（参照 Threads 编辑页） */
  editRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 4,
  },
  editRowLast: { borderBottomWidth: 0 },
  editLabel: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  editValue: { fontSize: 16, lineHeight: 22, color: colors.foreground },
  editReadonly: { fontSize: 16, lineHeight: 22, color: colors.foreground },
  /** 二级填写层（参照 Threads「编辑个性签名」） */
  fieldHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  fieldTitle: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  fieldDone: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  fieldInput: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.foreground,
    padding: 0,
    marginTop: 16,
    minHeight: 40,
  },
  fieldInputMulti: { minHeight: 150, textAlignVertical: 'top' },
  fieldHint: { fontSize: 13, color: colors.mutedForeground, marginTop: 18 },
  fieldHeadSpacer: { width: 20 },
  linkAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    marginTop: 6,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.elevated,
  },
  linkAddText: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  linkList: { marginTop: 12, maxHeight: 260 },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  linkItemText: { flex: 1 },
  linkItemTitle: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  linkItemUrl: { fontSize: 12, color: colors.mutedForeground, marginTop: 3 },
  modalError: { fontSize: 12, color: colors.destructive, paddingTop: 10 },
  doneBtn: {
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  doneText: { fontSize: 14, fontWeight: '700', color: colors.background },
  guest: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: 10 },
  guestTitle: { fontSize: 17, fontWeight: '700', color: colors.foreground },
  guestHint: { fontSize: 12.5, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  loginBtn: {
    marginTop: space.sm,
    height: 40,
    paddingHorizontal: 22,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: { fontSize: 14, fontWeight: '700', color: colors.primaryForeground },
});
