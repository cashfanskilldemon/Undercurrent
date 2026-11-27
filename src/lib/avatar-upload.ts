import { Platform } from 'react-native';

import { api, getAuthToken } from './api';
import type { UserProfile } from './types';

export type UploadResult = { ok: boolean; error?: string };

/**
 * Web 端选图并上传头像：动态建 input[type=file]，避免 RN Web 不支持原生 DOM 标签。
 * 走 base64 JSON（不是 multipart），避开部分浏览器/文件下 multipart 解析失败的问题。
 */
export function pickAndUploadAvatar(userId: number): Promise<UploadResult> {
  if (Platform.OS !== 'web') {
    return Promise.resolve({ ok: false, error: '原生端暂不支持，请在 Web 端操作' });
  }
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/gif';
    // display:none 的 input 在部分浏览器里 click() 不弹选择器，改成移出视口
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.top = '-9999px';
    input.style.opacity = '0';

    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input);
    };
    const fail = (error: string) => {
      cleanup();
      resolve({ ok: false, error });
    };

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        fail('未选择图片');
        return;
      }
      const token = getAuthToken();
      if (!token) {
        fail('登录已失效，请重新登录');
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => fail('读取图片失败');
      reader.onload = async () => {
        try {
          const data = String(reader.result ?? '');
          await api.post<UserProfile>(`/api/users/${userId}/avatar`, { data });
          cleanup();
          resolve({ ok: true });
        } catch (e) {
          fail(e instanceof Error ? e.message : '上传失败');
        }
      };
      reader.readAsDataURL(file);
    };
    document.body.appendChild(input);
    input.click();
  });
}
