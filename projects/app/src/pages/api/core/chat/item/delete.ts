import type { NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { authChatCrud } from '@/service/support/permission/auth/chat';
import type { DeleteChatItemProps } from '@/global/core/chat/api.d';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';

async function handler(req: ApiRequestProps<{}, DeleteChatItemProps>, res: NextApiResponse) {
  const { appId, chatId, contentId } = req.query;

  if (!contentId || !chatId) {
    return Promise.reject('contentId or chatId is empty');
  }

  await authChatCrud({
    req,
    authToken: true,
    authApiKey: true,
    ...req.query
  });

  // deleteOne 更改为 updateOne 实现假删除
  await MongoChatItem.updateOne(
    {
      appId,
      chatId,
      dataId: contentId
    },
    {
      $set: {
        deleteFlag: 1
      }
    }
  );

  return;
}

export default NextAPI(handler);
