import type { RequestPaging } from '@/types';
import type { RequestPagingV2, PaginationProps } from '@fastgpt/global/core/hengda/dataset/type';

export type GetDatasetCollectionsPropsV2 = RequestPaging & {
  searchText?: string;
};

/* ======= chunks =========== */
export type GetDatasetChunkListProps = PaginationProps & {
  fileCode: string;
};

export type UpdateCollectionChunkParams = {
  document: string;
  id: string;
  state?: number /** 文档嵌入完成后，更新文档时必须传1 */;
};

export type DeleteCollectionChunkParams = {
  id: string;
  state?: number;
};

export type UpdateCollectionChunkParams = {
  document: string;
  id: string;
  state?: number;
};

export type DeleteCollectionChunkParams = {
  id: string;
  state?: number;
};

export type GetDatasetCollectionsPropsV2 = RequestPaging & {
  searchText?: string;
};

export type InsertOneDatasetDataPropsV2 = {
  fileCode: string;
  document: string;
  fileName: string;
  filePath: string;
};

export type GetDatasetCollectionsPropsV2 = RequestPaging & {
  searchText?: string;
};
