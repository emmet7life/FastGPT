import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { OutLinkChatAuthProps } from '@fastgpt/global/support/permission/chat';
import { ChatSourceEnum } from '@fastgpt/global/core/chat/constants';
import type { AppListItemType } from '@fastgpt/global/core/app/type.d';

type State = {
  myApps: AppListItemType[];
  setMyApps: (e: AppListItemType[]) => any;
};

// const createCustomStorage = () => {
//   const sessionKeys = ['source', 'chatId', 'appId'];

//   return {
//     getItem: (name: string) => {
//       const sessionData = JSON.parse(sessionStorage.getItem(name) || '{}');
//       const localData = JSON.parse(localStorage.getItem(name) || '{}');
//       return JSON.stringify({ ...localData, ...sessionData });
//     },
//     setItem: (name: string, value: string) => {
//       const data = JSON.parse(value);

//       // 分离 session 和 local 数据
//       const sessionData = Object.fromEntries(
//         Object.entries(data.state).filter(([key]) => sessionKeys.includes(key))
//       );
//       const localData = Object.fromEntries(
//         Object.entries(data.state).filter(([key]) => !sessionKeys.includes(key))
//       );

//       // 分别存储
//       if (Object.keys(sessionData).length > 0) {
//         sessionStorage.setItem(name, JSON.stringify({ state: sessionData, version: 0 }));
//       }
//       if (Object.keys(localData).length > 0) {
//         localStorage.setItem(name, JSON.stringify({ state: localData, version: 0 }));
//       }
//     },
//     removeItem: (name: string) => {
//       sessionStorage.removeItem(name);
//       localStorage.removeItem(name);
//     }
//   };
// };
/* 
  appId chatId source 存在当前 tab 中，刷新浏览器不会丢失。
  lastChatId 和 lastChatAppId 全局存储，切换 tab 或浏览器也不会丢失。用于首次 tab 进入对话时，恢复上一次的 chat。(只恢复相同来源的)
*/
export const useAppStore = create<State>()(
  devtools(
    persist(
      immer((set, get) => ({
        myApps: [],
        setMyApps(e) {
          set((state) => {
            state.myApps = e;
          });
        }
      })),
      {
        name: 'appStore'
        // storage: createJSONStorage(createCustomStorage),
        // partialize: (state) => ({
        //   source: state.source,
        //   chatId: state.chatId,
        //   appId: state.appId,
        //   lastChatId: state.lastChatId,
        //   lastChatAppId: state.lastChatAppId
        // })
      }
    )
  )
);
