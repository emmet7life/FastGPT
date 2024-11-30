export enum DatasetStateEnum {
  uploaded = 0, // 文档上传成功，文档正在解析和分块中
  chunked = 1, // 文档分块完成，等待提交嵌入请求
  embedding = 2, // 文档分块完成，已提交嵌入请求，正在嵌入中
  completed = 3 // 文档已完成嵌入
}

export const DatasetStateMap = {
  [DatasetStateEnum.uploaded]: {
    label: 'common:core.dataset.state.uploaded'
  },
  [DatasetStateEnum.chunked]: {
    label: 'common:core.dataset.state.chunked'
  },
  [DatasetStateEnum.embedding]: {
    label: 'common:core.dataset.state.embedding'
  },
  [DatasetStateEnum.completed]: {
    label: 'common:core.dataset.state.completed'
  }
};
