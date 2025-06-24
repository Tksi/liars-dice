import { nanoid } from 'nanoid';
import { z } from 'zod';

const localUserSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
});

export type LocalUser = z.infer<typeof localUserSchema>;

/**
 *  ローカルユーザー情報を管理するカスタムフック
 * @returns localUser - ユーザー情報を保持する状態
 */
export const useLocalUser = () => {
  const localUser = useState<{ id: string; name: string }>('localUser', () => ({
    id: '',
    name: '',
  }));

  if (!localUser.value.id || !localUser.value.name) {
    try {
      localUser.value = localUserSchema.parse(
        JSON.parse(localStorage.getItem('liars-dice-user') ?? '{}'),
      );
    } catch {
      while (!localUser.value.name) {
        const userName = globalThis
          .prompt('プレイヤー名を入力してください:')
          ?.trim();

        if (userName != null) {
          localUser.value.id = `${userName}@${nanoid(4)}`;
          localUser.value.name = userName;
          localStorage.setItem(
            'liars-dice-user',
            JSON.stringify(localUser.value),
          );
        }
      }
    }
  }

  return { localUser };
};
