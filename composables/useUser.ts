import { nanoid } from 'nanoid';
import { z } from 'zod';

const userSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
});

export const useUser = () => {
  const user = useState<{ id: string; name: string }>('user', () => ({
    id: '',
    name: '',
  }));

  if (!user.value.id || !user.value.name) {
    try {
      user.value = userSchema.parse(
        JSON.parse(localStorage.getItem('liars-dice-user') ?? '{}'),
      );
    } catch {
      while (!user.value.name) {
        const userName = globalThis
          .prompt('プレイヤー名を入力してください:')
          ?.trim();

        if (userName != null) {
          user.value.id = `${userName}@${nanoid(4)}`;
          user.value.name = userName;
          localStorage.setItem('liars-dice-user', JSON.stringify(user.value));
        }
      }
    }
  }

  return {
    user,
  };
};
