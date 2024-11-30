export type PaginationProps<T = {}> = T & {
  pageNum: number;
  pageSize: number;
};

export type PaginationResponse<T = any> = {
  documents: T[];
  total_records: number;
  pageNum?: number;
  pageSize?: number;
};

export type DatasetCollectionUploadFileType = {
  file_code: string;
  total_records: number;
};

export type DatasetCollectionChunkType = {
  addTime: Date;
  content: string;
  fileCode: string;
  fileName: string;
  filePath: string;
  id: string;
  state: number;
  updateTime: Date;
};

export type DocumentPagingData<T> = {
  pageNum?: number;
  pageSize?: number;
  documents: T[];
  total_records?: number;
};

export type RequestPagingV2 = { page_num: number; page_size: number; [key]: any };

export type GetDatasetDataListProps = PaginationProps & {
  searchText?: string;
  collectionId: string;
};

export type GetDatasetDataListRes = PaginationResponse<DatasetDataListItemType>;
