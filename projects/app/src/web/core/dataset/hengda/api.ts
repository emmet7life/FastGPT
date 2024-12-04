import { GET, POST, PUT, DELETE } from '@/web/common/api/request';
import { strIsLink } from '@fastgpt/global/common/string/tools';
import type {
  DatasetCollectionUploadFileType,
  DatasetCollectionChunkType
} from '@fastgpt/global/core/hengda/dataset/type.d';
import type { DatasetCollectionsListItemTypeV2 } from '@/global/core/dataset/hengda/type.d';
import type {
  GetDatasetChunkListProps,
  UpdateCollectionChunkParams,
  DeleteCollectionChunkParams,
  InsertOneDatasetDataPropsV2,
  GetDatasetCollectionsPropsV2
} from '@/global/core/api/hengda/datasetReq.d';
import { DocumentPagingData, PaginationResponse } from '@fastgpt/global/core/hengda/dataset/type.d';

const baseRAGServerAPI = process.env.NEXT_PUBLIC_BASE_SERVER_RAG_API;
const baseRAGServerFileAPI = process.env.NEXT_PUBLIC_BASE_SERVER_RAG_FILE_API;

export async function getFileAndOpen(filePath: string) {
  if (strIsLink(filePath)) {
    console.log('api.tsx >> getFileAndOpen filePath', filePath);
    return window.open(filePath, '_blank');
  }
  // const url = await getFileViewUrl(filePath);
  // const asPath = `${location.origin}${url}`;
  const asPath = `${baseRAGServerFileAPI}/${filePath}`;
  console.log('api.tsx >> getFileAndOpen asPath', asPath);
  window.open(asPath, '_blank');
}

// 知识库重构 - 批量提交嵌入请求
export const batchDocumentChunkEmbedding = (fileCodes: string[]) =>
  POST(
    '/document/batch_submit',
    { fileCodes },
    {
      timeout: 360,
      baseURL: baseRAGServerAPI
    }
  );

// 知识库重构 - 确认文档分块上传接口
export const confirmDocumentChunkUpload = (fileCode: string) =>
  POST(
    '/document/async_submit',
    { fileCode },
    {
      timeout: 360,
      baseURL: baseRAGServerAPI
    }
  );

// 知识库重构 - 异步上传(PDF)文档(不带同步解析)
export const uploadFileAsync = ({ file }: { file: File }) => {
  const form = new FormData();
  form.append('files', file);

  return POST<DatasetCollectionUploadFileType>(`/file/async_upload`, form, {
    timeout: 360,
    baseURL: baseRAGServerAPI,
    headers: {
      'Content-Type': 'multipart/form-data; charset=utf-8'
    }
  });
};

// 知识库重构 - 获取文档分块列表
export const getCollectionChunkListById = (
  data: GetDatasetChunkListProps,
  authorization?: string
) =>
  GET<PaginationResponse<DatasetCollectionChunkType>>(
    `/document/list`,
    data,
    authorization
      ? {
          baseURL: baseRAGServerAPI,
          headers: {
            authorization: authorization
          }
        }
      : {
          baseURL: baseRAGServerAPI
        }
  );

// 知识库重构 - 更新文档分块接口，区分嵌入完成前和完成后传递不同的state（嵌入完成后state传1）
export const updateCollectionChunkById = (
  data: UpdateCollectionChunkParams,
  authorization?: string
) =>
  POST<any>(
    `/document/update`,
    data,
    authorization
      ? {
          baseURL: baseRAGServerAPI,
          headers: {
            authorization: authorization
          }
        }
      : {
          baseURL: baseRAGServerAPI
        }
  );

// 知识库重构 - 删除文档分块
export const deleteCollectionChunkById = (
  data: DeleteCollectionChunkParams,
  authorization?: string
) =>
  POST<any>(
    `/document/deletebyid`,
    data,
    authorization
      ? {
          baseURL: baseRAGServerAPI,
          headers: {
            authorization: authorization
          }
        }
      : {
          baseURL: baseRAGServerAPI
        }
  );

// 知识库重构 - 插入新文档分块
export const postInsertData2DatasetV2 = (
  data: InsertOneDatasetDataPropsV2,
  authorization?: string
) =>
  POST<any>(
    `/document/insert`,
    data,
    authorization
      ? {
          baseURL: baseRAGServerAPI,
          headers: {
            authorization: authorization
          }
        }
      : {
          baseURL: baseRAGServerAPI
        }
  );

// 知识库重构 - 文档列表
export const getDatasetCollectionsV2 = (
  data: GetDatasetCollectionsPropsV2,
  authorization?: string
) =>
  GET<DocumentPagingData<DatasetCollectionsListItemTypeV2>>(
    `/file/list`,
    data,
    authorization
      ? {
          baseURL: baseRAGServerAPI,
          headers: {
            authorization: authorization
          }
        }
      : {
          baseURL: baseRAGServerAPI
        }
  );

// 知识库重构 - 删除某个文档
export const deleteDatasetCollectionsV2File = (fileCode: string, authorization?: string) =>
  POST<any>(
    `/file/delete`,
    { fileCode },
    authorization
      ? {
          baseURL: baseRAGServerAPI,
          headers: {
            authorization: authorization
          }
        }
      : {
          baseURL: baseRAGServerAPI
        }
  );

// 知识库重构 - 文档详情
export const getDatasetCollectionByIdV2 = (fileCode: string, authorization?: string) =>
  GET<any>(
    `/file/fileinfo`,
    { fileCode },
    authorization
      ? {
          baseURL: baseRAGServerAPI,
          headers: {
            authorization: authorization
          }
        }
      : {
          baseURL: baseRAGServerAPI
        }
  );
