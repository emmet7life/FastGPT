import React, { useState, useRef, useMemo } from 'react';
import {
  Box,
  Flex,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Tbody,
  MenuButton,
  Switch
} from '@chakra-ui/react';
import {
  delDatasetCollectionById,
  putDatasetCollectionById,
  postLinkCollectionSync
} from '@/web/core/dataset/api';
import {
  deleteDatasetCollectionsV2File
} from '@/web/core/dataset/hengda/api';
import { useQuery } from '@tanstack/react-query';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import { useTranslation } from 'next-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useRouter } from 'next/router';
import MyMenu from '@fastgpt/web/components/common/MyMenu';
import { useEditTitle } from '@/web/common/hooks/useEditTitle';
import {
  DatasetCollectionTypeEnum,
  DatasetStatusEnum,
  DatasetCollectionSyncResultMap
} from '@fastgpt/global/core/dataset/constants';
import { getCollectionIcon } from '@fastgpt/global/core/dataset/utils';
import { TabEnum } from '../../../index';
import dynamic from 'next/dynamic';
import SelectCollections from '@/web/core/dataset/components/SelectCollections';
import { useToast } from '@fastgpt/web/hooks/useToast';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { DatasetCollectionSyncResultEnum } from '@fastgpt/global/core/dataset/constants';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { useContextSelector } from 'use-context-selector';
import { CollectionPageContextV2 } from './Context';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';
import { useI18n } from '@/web/context/I18n';
import { formatTime2YMDHM } from '@fastgpt/global/common/string/time';
import MyTag from '@fastgpt/web/components/common/Tag/index';
import {
  getTrainingTypeLabel
} from '@fastgpt/global/core/dataset/collection/utils';
import { useFolderDrag } from '@/components/common/folder/useFolderDrag';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import {
  DatasetStateEnum,
  DatasetStateMap
} from '@fastgpt/global/core/hengda/dataset/constants';
import { ImportDataSourceEnum, TrainingModeEnum } from '@fastgpt/global/core/dataset/constants';
import {
  confirmDocumentChunkUpload,
  batchDocumentChunkEmbedding
} from '@/web/core/dataset/hengda/api';

const Header = dynamic(() => import('./Header'));
const EmptyCollectionTip = dynamic(() => import('../EmptyCollectionTip'));

const CollectionCard = () => {
  const BoxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { datasetT } = useI18n();
  const { datasetDetail, loadDatasetDetail } = useContextSelector(DatasetPageContext, (v) => v);

  const { openConfirm: openDeleteConfirm, ConfirmModal: ConfirmDeleteModal } = useConfirm({
    content: t('common:dataset.Confirm to delete the file'),
    type: 'delete'
  });
  const { openConfirm: openSyncConfirm, ConfirmModal: ConfirmSyncModal } = useConfirm({
    content: t('common:core.dataset.collection.Start Sync Tip')
  });

  const { onOpenModal: onOpenEditTitleModal, EditModal: EditTitleModal } = useEditTitle({
    title: t('common:Rename')
  });

  const [moveCollectionData, setMoveCollectionData] = useState<{ collectionId: string }>();

  const { collections, Pagination, total, getData, isGetting, pageNum, pageSize } =
    useContextSelector(CollectionPageContextV2, (v) => v);

  // Ad file status icon
  const formatCollections = useMemo(
    () =>
      collections.map((collection) => {
        const icon = getCollectionIcon(DatasetCollectionTypeEnum.file, collection.fileName);
        const status = (() => {
          const statusText = `${DatasetStateMap[collection.state as DatasetStateEnum]?.label || 'common:core.dataset.state.embedding'}`;
          // TODO CJL
          if (collection.state == DatasetStateEnum.uploaded) {
            return {
              statusText: statusText,
              colorSchema: 'gray'
            };
          } else if (collection.state == DatasetStateEnum.chunked) {
            return {
              statusText: statusText,
              colorSchema: 'yellow'
            };
          } else if (collection.state == DatasetStateEnum.embedding) {
            return {
              statusText: statusText,
              colorSchema: 'purple'
            };
          } else if (collection.state == DatasetStateEnum.completed) {
            return {
              statusText: statusText,
              colorSchema: 'green'
            };
          }

          return {
            statusText: t('common:core.dataset.collection.status.active'),
            colorSchema: 'green'
          };
        })();

        return {
          ...collection,
          icon,
          ...status
        };
      }),
    [collections, t]
  );
  const { runAsync: onBatchCommitEmbbeding, loading: isBatchEmbbeding } = useRequest2(
    async () => {
      const collectionIds = formatCollections.filter((item) => item.fileCode && item.state == DatasetStateEnum.chunked).map((item) => item.fileCode);
      if (collectionIds.length === 0) {
        toast({
          status: 'error',
          title: t('common:core.dataset.collection.No document to embedding')
        });
        return;
      }

      // for (const collectionId of collectionIds) {
      //   await confirmDocumentChunkUpload(collectionId);
      // }
      await batchDocumentChunkEmbedding([]);
    },
    {
      onSuccess() {
        getData(pageNum);
      },
      successToast: t('common:common.submit_success')
    }
  );
  const { runAsync: onUpdateCollection, loading: isUpdating } = useRequest2(
    putDatasetCollectionById,
    {
      onSuccess() {
        getData(pageNum);
      },
      successToast: t('common:common.Update Success')
    }
  );
  const { runAsync: onDelCollection, loading: isDeleting } = useRequest2(
    (collectionId: string) => {
      return deleteDatasetCollectionsV2File(collectionId);
    },
    {
      onSuccess() {
        getData(pageNum);
      },
      successToast: t('common:common.Delete Success'),
      errorToast: t('common:common.Delete Failed')
    }
  );

  const { runAsync: onclickStartSync, loading: isSyncing } = useRequest2(postLinkCollectionSync, {
    onSuccess(res: DatasetCollectionSyncResultEnum) {
      getData(pageNum);
      toast({
        status: 'success',
        title: t(DatasetCollectionSyncResultMap[res]?.label as any)
      });
    },
    errorToast: t('common:core.dataset.error.Start Sync Failed')
  });

  const hasTrainingData = useMemo(
    () => !!formatCollections.find((item) => item.state != DatasetStateEnum.completed),
    [formatCollections]
  );


  useQuery(
    ['refreshCollection'],
    () => {
      getData(pageNum);
      if (datasetDetail.status === DatasetStatusEnum.syncing) {
        loadDatasetDetail(datasetDetail._id);
      }
      return null;
    },
    {
      refetchInterval: 6000,
      enabled: hasTrainingData || datasetDetail.status === DatasetStatusEnum.syncing
    }
  );

  const isLoading = isUpdating || isDeleting || isSyncing || isBatchEmbbeding || (isGetting && collections.length === 0);

  return (
    <MyBox isLoading={isLoading} h={'100%'} py={[2, 4]}>
      <Flex ref={BoxRef} flexDirection={'column'} py={[1, 0]} h={'100%'} px={[2, 6]}>
        {/* header */}
        <Header onBatchCommitEmbbeding={onBatchCommitEmbbeding} />

        {/* collection table */}
        <TableContainer mt={3} overflowY={'auto'} fontSize={'sm'}>
          <Table variant={'simple'} draggable={false}>
            <Thead draggable={false}>
              <Tr>
                <Th py={4}>{t('common:common.Name')}</Th>
                <Th py={4}>{datasetT('collection.Training type')}</Th>
                <Th py={4}>{t('common:dataset.collections.Data Amount')}</Th>
                <Th py={4}>{datasetT('collection.Create update time')}</Th>
                <Th py={4}>{t('common:common.Status')}</Th>
                {/* <Th py={4}>{datasetT('Enable')}</Th> */}
                {/* <Th py={4} /> */}
                <Th py={4}>{datasetT('Action')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr h={'5px'} />
              {formatCollections.map((collection) => (
                <Tr
                  key={collection.id}
                  _hover={{ bg: 'myGray.50' }}
                  cursor={'pointer'}
                  // {...getBoxProps({
                  //   dataId: collection.id,
                  //   isFolder: false
                  // })}
                  draggable={false}
                  onClick={() => {
                    if (collection.state == DatasetStateEnum.uploaded) {
                      toast({
                        status: 'success',
                        title: t('common:core.dataset.collection.Tip Chunking')
                      });
                    } else if (collection.state == DatasetStateEnum.chunked) {
                      router.replace({
                        query: {
                          ...router.query,
                          collectionId: collection.fileCode,
                          currentTab: TabEnum.dataCard,
                          state: collection.state
                        }
                      });
                    } else if (collection.state == DatasetStateEnum.embedding) {
                      toast({
                        status: 'success',
                        title: t('common:core.dataset.collection.Tip Embedding')
                      });
                    } else if (collection.state == DatasetStateEnum.completed) {
                      router.replace({
                        query: {
                          ...router.query,
                          collectionId: collection.fileCode,
                          currentTab: TabEnum.dataCard,
                          state: collection.state
                        }
                      });
                    }
                  }}
                >
                  <Td minW={'150px'} maxW={['200px', '300px']} draggable py={2}>
                    <Flex alignItems={'center'}>
                      <MyIcon name={collection.icon as any} w={'1.25rem'} mr={2} />
                      <MyTooltip
                        // label={t('common:common.folder.Drag Tip')}
                        shouldWrapChildren={false}
                      >
                        <Box color={'myGray.900'} fontWeight={'500'} className="textEllipsis">
                          {collection.fileName}
                        </Box>
                      </MyTooltip>
                    </Flex>
                    {/* {feConfigs?.isPlus && !!collection.tags?.length && (
                      <TagsPopOver currentCollection={collection} />
                    )} */}
                  </Td>
                  <Td py={2}>
                    {<>{t((getTrainingTypeLabel(TrainingModeEnum.chunk) || '-') as any)}</>}
                  </Td>
                  <Td py={2}>{collection.totalRecords || '-'}</Td>
                  <Td fontSize={'xs'} py={2} color={'myGray.500'}>
                    <Box>{formatTime2YMDHM(collection.addTime)}</Box>
                    <Box>{formatTime2YMDHM(collection.addTime)}</Box>
                  </Td>
                  <Td py={2}>
                    <MyTag showDot colorSchema={collection.colorSchema as any} type={'borderFill'}>
                      {t(collection.statusText as any)}
                    </MyTag>
                  </Td>
                  {/* <Td py={2} onClick={(e) => e.stopPropagation()}>
                    <Switch
                      isDisabled={true}
                      isChecked={collection.state == DatasetStateEnum.completed}
                      // isChecked={!collection.forbid}
                      size={'sm'}
                    // onChange={(e) =>
                    //   onUpdateCollection({
                    //     id: collection._id,
                    //     forbid: !e.target.checked
                    //   })
                    // }
                    />
                  </Td> */}
                  <Td py={2} onClick={(e) => e.stopPropagation()}>
                    {(
                      <MyMenu
                        width={100}
                        offset={[-70, 5]}
                        Button={
                          <MenuButton
                            w={'1.5rem'}
                            h={'1.5rem'}
                            borderRadius={'md'}
                            _hover={{
                              color: 'primary.500',
                              '& .icon': {
                                bg: 'myGray.200'
                              }
                            }}
                          >
                            <MyIcon
                              className="icon"
                              name={'more'}
                              h={'1rem'}
                              w={'1rem'}
                              px={1}
                              py={1}
                              borderRadius={'md'}
                              cursor={'pointer'}
                            />
                          </MenuButton>
                        }
                        menuList={[
                          // {
                          //   children: [
                          //     ...(collection.type === DatasetCollectionTypeEnum.link
                          //       ? [
                          //         {
                          //           label: (
                          //             <Flex alignItems={'center'}>
                          //               <MyIcon
                          //                 name={'common/refreshLight'}
                          //                 w={'0.9rem'}
                          //                 mr={2}
                          //               />
                          //               {t('common:core.dataset.collection.Sync')}
                          //             </Flex>
                          //           ),
                          //           onClick: () =>
                          //             openSyncConfirm(() => {
                          //               onclickStartSync(collection._id);
                          //             })()
                          //         }
                          //       ]
                          //       : []),
                          //     {
                          //       label: (
                          //         <Flex alignItems={'center'}>
                          //           <MyIcon name={'common/file/move'} w={'0.9rem'} mr={2} />
                          //           {t('common:Move')}
                          //         </Flex>
                          //       ),
                          //       onClick: () =>
                          //         setMoveCollectionData({ collectionId: collection._id })
                          //     },
                          //     {
                          //       label: (
                          //         <Flex alignItems={'center'}>
                          //           <MyIcon name={'edit'} w={'0.9rem'} mr={2} />
                          //           {t('common:Rename')}
                          //         </Flex>
                          //       ),
                          //       onClick: () =>
                          //         onOpenEditTitleModal({
                          //           defaultVal: collection.name,
                          //           onSuccess: (newName) =>
                          //             onUpdateCollection({
                          //               id: collection._id,
                          //               name: newName
                          //             })
                          //         })
                          //     }
                          //   ]
                          // },
                          {
                            children: [
                              {
                                label: (
                                  <Flex alignItems={'center'}>
                                    <MyIcon
                                      mr={1}
                                      name={'delete'}
                                      w={'0.9rem'}
                                      _hover={{ color: 'red.600' }}
                                    />
                                    <Box>{t('common:common.Delete')}</Box>
                                  </Flex>
                                ),
                                type: 'danger',
                                onClick: () =>
                                  openDeleteConfirm(
                                    () => {
                                      onDelCollection(collection.fileCode);
                                    },
                                    undefined,
                                    t('common:dataset.Confirm to delete the file')
                                  )()
                              }
                            ]
                          }
                        ]}
                      />
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {total > pageSize && (
            <Flex mt={2} justifyContent={'center'}>
              <Pagination />
            </Flex>
          )}
          {total === 0 && <EmptyCollectionTip />}
        </TableContainer>

        <ConfirmDeleteModal />
        <ConfirmSyncModal />
        <EditTitleModal />

        {!!moveCollectionData && (
          <SelectCollections
            datasetId={datasetDetail._id}
            type="folder"
            defaultSelectedId={[moveCollectionData.collectionId]}
            onClose={() => setMoveCollectionData(undefined)}
            onSuccess={async ({ parentId }) => {
              await putDatasetCollectionById({
                id: moveCollectionData.collectionId,
                parentId
              });
              getData(pageNum);
              setMoveCollectionData(undefined);
              toast({
                status: 'success',
                title: t('common:common.folder.Move Success')
              });
            }}
          />
        )}
      </Flex>
    </MyBox>
  );
};

export default React.memo(CollectionCard);
