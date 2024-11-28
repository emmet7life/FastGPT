import { GET, POST } from '@/web/common/api/request';
import { hashStr } from '@fastgpt/global/common/string/tools';
const baseServerApi = process.env.NEXT_PUBLIC_BASE_SERVER_API;
import type { ResLogin } from '@/global/support/api/hengda/userRes';
import { HengdaDepartmentItemType } from '@fastgpt/global/core/hengda/user/type';

/**
 * 获取恒达-部门列表
 */
export const getHengdaDepartmentList = () =>
  GET<HengdaDepartmentItemType[]>(
    '/departments',
    {},
    {
      baseURL: baseServerApi
    }
  );

/**
 * 恒达-用户注册
 * @param data
 * @returns
 */
export const hengdaRegister = (data: {
  username: string;
  password: string;
  department_id: number;
}) =>
  POST<ResLogin>(
    '/register',
    {
      ...data,
      password: hashStr(data.password)
    },
    {
      baseURL: baseServerApi
    }
  );

/**
 * 恒达-用户登录
 * @param data
 * @returns
 */
export const hengdaLogin = (data: { username: string; password: string }) =>
  POST<ResLogin>(
    '/login',
    {
      ...data,
      password: hashStr(data.password)
    },
    {
      baseURL: baseServerApi
    }
  );

/**
 * 恒达-用户登出
 * @param data
 * @returns
 */
export const hengdaLogout = (data: any) =>
  POST('/logout', data, {
    baseURL: baseServerApi
  });
