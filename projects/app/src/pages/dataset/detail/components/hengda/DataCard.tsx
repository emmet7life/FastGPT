import React, { useState, useMemo } from 'react';
import { Box, Card, IconButton, Flex, Button, useTheme } from '@chakra-ui/react';
import {
  getDatasetDataList,
  delOneDatasetDataById,
} from '@/web/core/dataset/api';
import {
  getCollectionChunkListById,
  getDatasetCollectionByIdV2,
  confirmDocumentChunkUpload,
  deleteCollectionChunkById
} from '@/web/core/dataset/hengda/api';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyInput from '@/components/MyInput';
import InputDataModal from './InputDataModal';
import RawSourceBox from '@/components/core/dataset/hengda/RawSourceBox';
import { getCollectionSourceData } from '@fastgpt/global/core/dataset/collection/utils';
import EmptyTip from '@fastgpt/web/components/common/EmptyTip';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';
import { useContextSelector } from 'use-context-selector';
import MyTag from '@fastgpt/web/components/common/Tag/index';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import TagsPopOver from '../CollectionCard/TagsPopOver';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import MyDivider from '@fastgpt/web/components/common/MyDivider';
import Markdown from '@/components/Markdown';
import { useMemoizedFn } from 'ahooks';
import { useScrollPagination } from '@fastgpt/web/hooks/hengda/useScrollPagination';
import { convertToCamelCase } from '@fastgpt/web/hooks/hengda/usePagination';

import { DatasetStateEnum } from '@fastgpt/global/core/hengda/dataset/constants';
import { DatasetCollectionsListItemTypeV2 } from '@/global/core/dataset/hengda/type.d';
import type {
  DatasetCollectionChunkType
} from '@fastgpt/global/core/hengda/dataset/type.d';
import { TabEnum } from '../../index';

const DataCard = () => {
  const theme = useTheme();
  const router = useRouter();
  const { isPc } = useSystem();
  const { collectionId = ''/** fileCode */, datasetId } = router.query as {
    collectionId: string;
    datasetId: string;
  };
  const datasetDetail = useContextSelector(DatasetPageContext, (v) => v.datasetDetail);
  const { feConfigs } = useSystemStore();

  const { state = DatasetStateEnum.completed } = (router.query || {}) as {
    state?: DatasetStateEnum;
  };

  console.log("OOO >> DataCard.tsx >> state", state);
  console.log("OOO >> DataCard.tsx >> state", typeof state);

  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const { toast } = useToast();

  const scrollParams = useMemo(
    () => ({
      fileCode: collectionId,
      searchText
    }),
    [collectionId, searchText]
  );
  const EmptyTipDom = useMemo(
    () => <EmptyTip text={t('common:core.dataset.data.Empty Tip')} />,
    [t]
  );
  const {
    data: chunkList,
    ScrollData,
    total,
    refreshList,
    setData: setDatasetDataList
  } = useScrollPagination(getCollectionChunkListById, {
    pageSize: 15,
    params: scrollParams,
    refreshDeps: [searchText, collectionId],
    EmptyTip: EmptyTipDom
  });

  const datasetDataList = useMemo<
    (DatasetCollectionChunkType & {
      chunkIndex: number;
    })[]
  >(() => {
    return chunkList.map((chunk, i) => ({
      ...chunk,
      chunkIndex: i + 1,
    }));
  }, [chunkList]);

  const [editDataId, setEditDataId] = useState<string>();

  // get file info
  const { data: collection } = useQuery(
    ['getDatasetCollectionByIdV2', collectionId],
    async () => {
      if (!collectionId) return false;
      const resp = await getDatasetCollectionByIdV2(collectionId);
      const convertResp = convertToCamelCase(resp) as DatasetCollectionsListItemTypeV2;
      return convertResp;
    },
    {
      onError: () => {
        // TODO CJL
        // router.replace({
        //   query: {
        //     datasetId
        //   }
        // });
      }
    }
  );

  // 提交嵌入
  const { mutate: startEmbedding, isLoading } = useRequest({
    mutationFn: async ({ collectionId }: { collectionId: string }) => {
      if (chunkList.length === 0) {
        return false;
      }

      // 检查上传列表是否为空
      if (!collectionId) throw new Error('collectionId is empty.');
      await confirmDocumentChunkUpload(collectionId);
      return true;
    },
    onSuccess(result) {
      if (result) {
        toast({
          title: t('common:core.dataset.import.Import success'),
          status: 'success'
        });
        router.replace({
          query: {
            ...router.query,
            currentTab: TabEnum.collectionCard
          }
        });
      }
    },
    errorToast: t('common:common.error.unKnow')
  });

  const canWrite = useMemo(() => datasetDetail.permission.hasWritePer, [datasetDetail]);

  const { openConfirm, ConfirmModal } = useConfirm({
    content: t('common:dataset.Confirm to delete the data'),
    type: 'delete'
  });
  const onDeleteOneData = useMemoizedFn((dataId: string) => {
    openConfirm(async () => {
      try {
        await deleteCollectionChunkById({
          id: dataId,
          state: state == DatasetStateEnum.completed ? 1 : 0
        });
        setDatasetDataList((prev) => {
          return prev.filter((data) => data.id !== dataId);
        });
        toast({
          title: t('common:common.Delete Success'),
          status: 'success'
        });
      } catch (error) {
        toast({
          title: getErrText(error),
          status: 'error'
        });
      }
    })();
  });

  return (
    <MyBox py={[1, 0]} h={'100%'}>
      <Flex flexDirection={'column'} h={'100%'}>
        {/* Header */}
        <Flex alignItems={'center'} px={6}>
          <Box flex={'1 0 0'} mr={[3, 5]} alignItems={'center'}>
            <Box
              className="textEllipsis"
              alignItems={'center'}
              gap={2}
              display={isPc ? 'flex' : ''}
            >
              {collection && collection.fileCode && (
                <RawSourceBox
                  collectionId={collection.id}
                  // {...getCollectionSourceData(collection)}
                  sourceId={collection.fileCode}
                  sourceName={collection.fileName}
                  sourcePath={collection.filePath}
                  fontSize={['sm', 'md']}
                  color={'black'}
                  textDecoration={'none'}
                />
              )}
            </Box>
            {/* {feConfigs?.isPlus && !!collection?.tags?.length && (
              <TagsPopOver currentCollection={collection} />
            )} */}
          </Box>
          {canWrite && (
            <Box>
              <Button
                ml={2}
                isDisabled={!datasetDataList.length}
                variant={state == DatasetStateEnum.chunked ? 'primary' : 'whitePrimary'}
                size={['sm', 'md']}
                onClick={() => {
                  if (!collection) return;
                  if (state == DatasetStateEnum.chunked) {
                    startEmbedding({ collectionId });
                  } else {
                    setEditDataId('');
                  }
                }}
              >
                {state == DatasetStateEnum.chunked ? t('common:dataset.Commit Embedding') : t('common:dataset.Insert Data')}
              </Button>
            </Box>
          )}
        </Flex>
        <Box justifyContent={'center'} px={6} pos={'relative'} w={'100%'}>
          <MyDivider my={'17px'} w={'100%'} />
        </Box>
        <Flex alignItems={'center'} px={6} pb={4}>
          <Flex align={'center'} color={'myGray.500'}>
            <MyIcon name="common/list" mr={2} w={'18px'} />
            <Box as={'span'} fontSize={['sm', '14px']} fontWeight={'500'}>
              {t('common:core.dataset.data.Total Amount', { total })}
            </Box>
          </Flex>
          <Box flex={1} mr={1} />
          <MyInput
            leftIcon={
              <MyIcon
                name="common/searchLight"
                position={'absolute'}
                w={'14px'}
                color={'myGray.600'}
              />
            }
            bg={'myGray.25'}
            borderColor={'myGray.200'}
            color={'myGray.500'}
            w={['200px', '300px']}
            placeholder={t('common:core.dataset.data.Search data placeholder')}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
            }}
          />
        </Flex>
        {/* data */}
        <ScrollData px={5} pb={5}>
          <Flex flexDir={'column'} gap={2}>
            {datasetDataList.map((item, index) => (
              <Card
                key={item.id}
                cursor={'pointer'}
                p={3}
                userSelect={'none'}
                boxShadow={'none'}
                bg={index % 2 === 1 ? 'myGray.50' : 'blue.50'}
                border={theme.borders.sm}
                position={'relative'}
                overflow={'hidden'}
                _hover={{
                  borderColor: 'blue.600',
                  boxShadow: 'lg',
                  '& .header': { visibility: 'visible' },
                  '& .footer': { visibility: 'visible' },
                  bg: index % 2 === 1 ? 'myGray.200' : 'blue.100'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditDataId(item.id);
                }}
              >
                {/* Data tag */}
                <Flex
                  position={'absolute'}
                  zIndex={1}
                  alignItems={'center'}
                  visibility={'hidden'}
                  className="header"
                >
                  <MyTag
                    px={2}
                    type="borderFill"
                    borderRadius={'sm'}
                    border={'1px'}
                    color={'myGray.200'}
                    bg={'white'}
                    fontWeight={'500'}
                  >
                    <Box color={'blue.600'}>#{item.chunkIndex ?? '-'} </Box>
                    <Box
                      ml={1.5}
                      className={'textEllipsis'}
                      fontSize={'mini'}
                      textAlign={'right'}
                      color={'myGray.500'}
                    >
                      ID:{item.id}
                    </Box>
                  </MyTag>
                </Flex>

                {/* Data content */}
                <Box wordBreak={'break-all'} fontSize={'sm'}>
                  <Markdown source={item.content} isDisabled />
                  {/* {!!item.a && (
                    <>
                      <MyDivider />
                      <Markdown source={item.a} isDisabled />
                    </>
                  )} */}
                </Box>

                {/* Mask */}
                <Flex
                  className="footer"
                  position={'absolute'}
                  bottom={2}
                  right={2}
                  overflow={'hidden'}
                  alignItems={'flex-end'}
                  visibility={'hidden'}
                  fontSize={'mini'}
                >
                  <Flex
                    alignItems={'center'}
                    bg={'white'}
                    color={'myGray.600'}
                    borderRadius={'sm'}
                    border={'1px'}
                    borderColor={'myGray.200'}
                    h={'24px'}
                    px={2}
                    fontSize={'mini'}
                    boxShadow={'1'}
                    py={1}
                    mr={2}
                  >
                    <MyIcon
                      bg={'white'}
                      color={'myGray.600'}
                      borderRadius={'sm'}
                      border={'1px'}
                      borderColor={'myGray.200'}
                      name="common/text/t"
                      w={'14px'}
                      mr={1}
                    />
                    {/* {item.q.length + (item.a?.length || 0)} */}
                    {item.content.length}
                  </Flex>
                  {canWrite && (
                    <IconButton
                      display={'flex'}
                      p={1}
                      boxShadow={'1'}
                      icon={<MyIcon name={'common/trash'} w={'14px'} color={'myGray.600'} />}
                      variant={'whiteDanger'}
                      size={'xsSquare'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteOneData(item.id);
                      }}
                      aria-label={''}
                    />
                  )}
                </Flex>
              </Card>
            ))}
          </Flex>
        </ScrollData>
      </Flex>

      {editDataId !== undefined && collection && (
        <InputDataModal
          dataId={editDataId}
          collectionId={collection.fileCode}
          fileName={collection.fileName}
          filePath={collection.filePath}
          defaultValue={{
            q: datasetDataList.find((item) => item.id === editDataId)?.content || '',
            state: state == DatasetStateEnum.completed ? 1 : 0,
          }}
          onClose={() => setEditDataId(undefined)}
          onSuccess={(data) => {
            if (editDataId === '') {
              refreshList();
              return;
            }
            setDatasetDataList((prev) => {
              return prev.map((item) => {
                if (item.id === editDataId) {
                  return {
                    ...item,
                    ...data
                  };
                }
                return item;
              });
            });
          }}
        />
      )}
      <ConfirmModal />
    </MyBox>
  );
};

export default React.memo(DataCard);
