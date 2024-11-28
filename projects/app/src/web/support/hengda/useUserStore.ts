import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UserType } from '@fastgpt/global/support/user/hengda/type.d';
import { getTokenLogin } from './api';
import { tokenKey } from './auth';

type State = {
  userInfo: UserType | null;
  initUserInfo: () => Promise<UserType>;
  setUserInfo: (user: UserType | null) => void;
};

export const useUserStore = create<State>()(
  devtools(
    persist(
      immer((set, get) => ({
        userInfo: null,
        async initUserInfo() {
          // TODO CJL
          const token = localStorage.getItem(tokenKey) || '';
          console.log('AAA >> useUserStore >> initUserInfo, token', token);
          const res = await getTokenLogin(token);
          console.log('AAA >> useUserStore >> initUserInfo, res', res);
          get().setUserInfo(res);

          //设置html的fontsize
          const html = document?.querySelector('html');
          if (html) {
            // html.style.fontSize = '16px';
          }

          return res;
        },
        setUserInfo(user: UserType | null) {
          console.log('AAA >> useUserStore >> setUserInfo, user', user);
          set((state) => {
            state.userInfo = user ? user : null;
          });
        }
      })),
      {
        name: 'hengdaUserStore'
        // partialize: (state) => ({
        //   // uid: state.userInfo?.uid || ''
        //   userInfo: state.userInfo
        // })
      }
    )
  )
);
