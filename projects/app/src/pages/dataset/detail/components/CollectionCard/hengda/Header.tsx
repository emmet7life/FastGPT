import React from 'react';
import {
  Box,
  Flex,
  Link,
  useTheme,
  HStack
} from '@chakra-ui/react';
import {
  getDatasetCollectionPathById,
} from '@/web/core/dataset/api';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useRouter } from 'next/router';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import {
  DatasetTypeEnum,
  DatasetTypeMap,
} from '@fastgpt/global/core/dataset/constants';
import { TabEnum } from '../../../index';
import ParentPath from '@/components/common/ParentPaths';
import dynamic from 'next/dynamic';

import { ImportDataSourceEnum } from '@fastgpt/global/core/dataset/constants';
import { useContextSelector } from 'use-context-selector';
import { CollectionPageContext } from '../Context';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';
import { useSystem } from '@fastgpt/web/hooks/useSystem';

type Props = {
  onBatchCommitEmbbeding?: () => Promise<void>;
};

const Header = ({ onBatchCommitEmbbeding }: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const { feConfigs } = useSystemStore();
  const datasetDetail = useContextSelector(DatasetPageContext, (v) => v.datasetDetail);

  const router = useRouter();
  const { parentId = '' } = router.query as { parentId: string };
  const { isPc } = useSystem();

  const { searchText, setSearchText, total, getData, pageNum, onOpenWebsiteModal } =
    useContextSelector(CollectionPageContext, (v) => v);

  // const { data: paths = [] } = useQuery(['getDatasetCollectionPathById', parentId], () =>
  //   getDatasetCollectionPathById(parentId)
  // );

  const paths = [] as { parentId: string; parentName: string; }[];

  const isWebSite = datasetDetail?.type === DatasetTypeEnum.websiteDataset;

  return (
    <Box display={['block', 'flex']} alignItems={'center'} gap={2}>
      <HStack flex={1}>
        <Box flex={1} fontWeight={'500'} color={'myGray.900'} whiteSpace={'nowrap'}>
          <ParentPath
            paths={paths.map((path, i) => ({
              parentId: path.parentId,
              parentName: i === paths.length - 1 ? `${path.parentName}` : path.parentName
            }))}
            FirstPathDom={
              <Flex
                flexDir={'column'}
                justify={'center'}
                h={'100%'}
                fontSize={isWebSite ? 'sm' : 'md'}
                fontWeight={'500'}
                color={'myGray.600'}
              >
                <Flex align={'center'}>
                  {!isWebSite && <MyIcon name="common/list" mr={2} w={'20px'} color={'black'} />}
                  {t(DatasetTypeMap[datasetDetail?.type]?.collectionLabel as any)}
                  {/* ({total}) */}
                </Flex>
                {datasetDetail?.websiteConfig?.url && (
                  <Flex fontSize={'mini'}>
                    {t('common:core.dataset.website.Base Url')}:
                    <Link
                      href={datasetDetail.websiteConfig.url}
                      target="_blank"
                      mr={2}
                      color={'blue.700'}
                    >
                      {datasetDetail.websiteConfig.url}
                    </Link>
                  </Flex>
                )}
              </Flex>
            }
            onClick={(e) => {
              // router.replace({
              //   query: {
              //     ...router.query,
              //     parentId: e
              //   }
              // });
            }}
          />
        </Box>

        {/* search input */}
        {/* {isPc && (
          <MyInput
            maxW={'250px'}
            flex={1}
            size={'sm'}
            h={'36px'}
            placeholder={t('common:common.Search') || ''}
            value={searchText}
            leftIcon={
              <MyIcon
                name="common/searchLight"
                position={'absolute'}
                w={'16px'}
                color={'myGray.500'}
              />
            }
            onChange={(e) => {
              setSearchText(e.target.value);
            }}
          />
        )} */}

        {/* Tag */}
        {/* {datasetDetail.permission.hasWritePer && feConfigs?.isPlus && <HeaderTagPopOver />} */}
      </HStack>

      {/* diff collection button */}
      {datasetDetail.permission.hasWritePer && (
        <Box textAlign={'end'} mt={[3, 0]} display={'flex'}>
          <Box
            _hover={{
              color: 'primary.500'
            }}
            fontSize={['sm', 'md']}
            onClick={() => {
              router.replace({
                query: {
                  ...router.query,
                  currentTab: TabEnum.import,
                  source: ImportDataSourceEnum.fileUpload
                }
              })
            }}
          >
            <Flex
              px={3.5}
              py={2}
              borderRadius={'sm'}
              cursor={'pointer'}
              bg={'primary.500'}
              overflow={'hidden'}
              color={'white'}
            >
              <Flex h={'20px'} alignItems={'center'}>
                <MyIcon
                  name={'common/folderImport'}
                  mr={2}
                  w={'18px'}
                  h={'18px'}
                  color={'white'}
                />
              </Flex>
              <Box h={'20px'} fontSize={'sm'} fontWeight={'500'}>
                {t('common:dataset.collections.Create And Import')}
              </Box>
            </Flex>
          </Box>

          <Box
            ml={'16px'}
            _hover={{
              color: 'primary.500'
            }}
            fontSize={['sm', 'md']}
            onClick={() => {
              onBatchCommitEmbbeding && onBatchCommitEmbbeding();
            }}
          >
            <Flex
              px={3.5}
              py={2}
              borderRadius={'sm'}
              cursor={'pointer'}
              bg={'adora.500'}
              overflow={'hidden'}
              color={'white'}
            >
              <Flex h={'20px'} alignItems={'center'}>
                <MyIcon
                  name={'common/folderImport'}
                  mr={2}
                  w={'18px'}
                  h={'18px'}
                  color={'white'}
                />
              </Flex>
              <Box h={'20px'} fontSize={'sm'} fontWeight={'500'}>
                {t('common:dataset.collections.Batch Commit Embedding')}
              </Box>
            </Flex>
          </Box>
        </Box>
      )
      }
    </Box >
  );
};

export default Header;
