import { GET, POST } from '@/web/common/api/request';
import { UserType } from '@fastgpt/global/support/user/hengda/type.d';
const baseServerApi = process.env.NEXT_PUBLIC_BASE_SERVER_API;
export const getTokenLogin = (token: string) =>
  GET<UserType>(
    '/token_login',
    {},
    {
      headers: {
        Authorization: `${token}`
      },
      maxQuantity: 1,
      baseURL: baseServerApi
    }
  );

export const loginOut = (token: string) =>
  POST(
    '/logout',
    {},
    {
      headers: {
        Authorization: `${token}`
      },
      baseURL: baseServerApi
    }
  );
