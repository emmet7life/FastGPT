import { ChatHistoryItemResType, ChatItemType } from '@fastgpt/global/core/chat/type';
import { FlowNodeTypeEnum } from '@fastgpt/global/core/workflow/node/constant';
import { SearchDataResponseItemType } from '@fastgpt/global/core/dataset/type';

function generateId(str: string) {
  // 定义一个较大的质数作为哈希因子
  const prime = 31;
  let hash = 0;

  // 使用多项式滚动哈希算法计算哈希值
  for (let i = 0; i < str.length; i++) {
    hash = (hash * prime + str.charCodeAt(i)) % 10000000000; // 10 位数的上限
  }

  // 如果哈希值不足 10 位数，前面补 0
  return String(hash).padStart(10, '0');
}

// 判断是否是“知识库引用”对象
const isKnowledgeBaseReference = (item: any): item is SearchDataResponseItemType => {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.id === 'string' &&
    typeof item.datasetId === 'string' &&
    typeof item.collectionId === 'string' &&
    typeof item.sourceName === 'string' &&
    typeof item.sourceId === 'string' &&
    typeof item.q === 'string' &&
    typeof item.a === 'string'
  );
};

// 转换为 SearchDataResponseItemType
const transformToSearchDataResponseItem = (
  item: any,
  index: number
): SearchDataResponseItemType => {
  if (isKnowledgeBaseReference(item)) {
    return {
      id: item.id,
      datasetId: item.datasetId,
      collectionId: generateId(item.sourceName),
      sourceName: item.sourceName,
      sourceId: item.sourceId,
      q: item.q,
      a: item.a,
      updateTime: new Date(),
      chunkIndex: index,
      score: [{ type: 'embedding', value: 1.0, index: 0 }]
    };
  }
  throw new Error('Invalid knowledge base reference object');
};

// 查找【代码运行】中可能存在的‘知识库引用’（通过HTTP获取回数据并经过代码运行节点封装成‘知识库引用’格式的数据）
export const findAndTransformToSearchDataResponseItem = (
  flatResData: ChatHistoryItemResType[]
): SearchDataResponseItemType[] => {
  // 提取知识库引用对象并转换
  return flatResData
    .filter(
      (item) =>
        item.moduleType === FlowNodeTypeEnum.code &&
        item.customOutputs &&
        Array.isArray(item.customOutputs['result']) &&
        item.customOutputs['result'].length > 0 &&
        item.customOutputs['result'].some(isKnowledgeBaseReference) // 检查是否有符合条件的知识库引用对象
    )
    .flatMap(
      (item) =>
        (item.customOutputs && item.customOutputs['result'])
          .filter(isKnowledgeBaseReference) // 筛选出知识库引用对象
          .map(transformToSearchDataResponseItem) // 转换为 SearchDataResponseItemType
    );
};
