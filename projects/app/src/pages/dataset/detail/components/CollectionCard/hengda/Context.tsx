import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import { Dispatch, ReactNode, SetStateAction, useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { createContext, useContextSelector } from 'use-context-selector';
import { DatasetStatusEnum } from '@fastgpt/global/core/dataset/constants';
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import { DatasetSchemaType } from '@fastgpt/global/core/dataset/type';
import { useDisclosure } from '@chakra-ui/react';
import { checkTeamWebSyncLimit } from '@/web/support/user/team/api';
import { postCreateTrainingUsage } from '@/web/support/wallet/usage/api';
import { postWebsiteSync } from '@/web/core/dataset/api';
import { getDatasetCollectionsV2 } from '@/web/core/dataset/hengda/api';
import { usePagination } from '@fastgpt/web/hooks/hengda/usePagination';
import { DatasetCollectionsListItemTypeV2 } from '@/global/core/dataset/hengda/type';
import { useRouter } from 'next/router';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';

type CollectionPageContextTypeV2 = {
  openWebSyncConfirm: () => void;
  onOpenWebsiteModal: () => void;
  collections: DatasetCollectionsListItemTypeV2[];
  Pagination: () => JSX.Element;
  total: number;
  getData: (e: number) => void;
  isGetting: boolean;
  pageNum: number;
  pageSize: number;
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
  filterTags: string[];
  setFilterTags: Dispatch<SetStateAction<string[]>>;
};

export const CollectionPageContextV2 = createContext<CollectionPageContextTypeV2>({
  openWebSyncConfirm: function (): () => void {
    throw new Error('Function not implemented.');
  },
  onOpenWebsiteModal: function (): void {
    throw new Error('Function not implemented.');
  },
  collections: [],
  Pagination: function (): JSX.Element {
    throw new Error('Function not implemented.');
  },
  total: 0,
  getData: function (e: number): void {
    throw new Error('Function not implemented.');
  },
  isGetting: false,
  pageNum: 0,
  pageSize: 0,
  searchText: '',
  setSearchText: function (value: SetStateAction<string>): void {
    throw new Error('Function not implemented.');
  },
  filterTags: [],
  setFilterTags: function (value: SetStateAction<string[]>): void {
    throw new Error('Function not implemented.');
  }
});

const CollectionPageContextProviderV2 = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { parentId = '' } = router.query as { parentId: string };

  const { datasetDetail, datasetId, updateDataset } = useContextSelector(
    DatasetPageContext,
    (v) => v
  );

  // website config
  const { openConfirm: openWebSyncConfirm, ConfirmModal: ConfirmWebSyncModal } = useConfirm({
    content: t('common:core.dataset.collection.Start Sync Tip')
  });
  const {
    isOpen: isOpenWebsiteModal,
    onOpen: onOpenWebsiteModal,
    onClose: onCloseWebsiteModal
  } = useDisclosure();
  const { mutate: onUpdateDatasetWebsiteConfig } = useRequest({
    mutationFn: async (websiteConfig: DatasetSchemaType['websiteConfig']) => {
      onCloseWebsiteModal();
      await checkTeamWebSyncLimit();
      await updateDataset({
        id: datasetId,
        websiteConfig,
        status: DatasetStatusEnum.syncing
      });
      const billId = await postCreateTrainingUsage({
        name: t('common:core.dataset.training.Website Sync'),
        datasetId: datasetId
      });
      await postWebsiteSync({ datasetId: datasetId, billId });

      return;
    },
    errorToast: t('common:common.Update Failed')
  });

  // collection list
  const [searchText, setSearchText] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const {
    data: collections,
    Pagination,
    total,
    getData,
    isLoading: isGetting,
    pageNum,
    pageSize
  } = usePagination<DatasetCollectionsListItemTypeV2>({
    api: getDatasetCollectionsV2,
    pageSize: 20,
    params: {
      datasetId,
      parentId,
      searchText,
      filterTags
    },
    // defaultRequest: false,
    refreshDeps: [parentId, searchText, filterTags]
  });

  const contextValue: CollectionPageContextTypeV2 = {
    openWebSyncConfirm: openWebSyncConfirm(onUpdateDatasetWebsiteConfig),
    onOpenWebsiteModal,

    searchText,
    setSearchText,
    filterTags,
    setFilterTags,
    collections,
    Pagination,
    total,
    getData,
    isGetting,
    pageNum,
    pageSize
  };

  return (
    <CollectionPageContextV2.Provider value={contextValue}>
      {children}
    </CollectionPageContextV2.Provider>
  );
};
export default CollectionPageContextProviderV2;
