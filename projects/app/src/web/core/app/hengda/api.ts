import { GET, POST, DELETE, PUT } from '@/web/common/api/request';
import type { AppListItemType } from '@fastgpt/global/core/app/type.d';
import type { ListAppBody } from '@/pages/api/core/app/list';

/**
 * 获取模型列表
 */
export const getMyApps = (data?: ListAppBody) =>
  POST<AppListItemType[]>('/core/app/hengda/list', data, {
    maxQuantity: 1,
    headers: {
      rootkey: 'root_key',
      Authorization: 'Bearer fastgpt-tB8K1dp4LNgFeXSxrvg6exqQx0mjeLRxXMTKkRG1d90oKjIFrFED'
    }
  });
