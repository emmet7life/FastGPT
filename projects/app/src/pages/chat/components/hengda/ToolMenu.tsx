import React, { useMemo } from 'react';
import { useChatBox } from '@/components/core/chat/ChatContainer/ChatBox/hooks/useChatBox';
import type { ChatItemType } from '@fastgpt/global/core/chat/type.d';
import { Box, IconButton } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useRouter } from 'next/router';
// import MyMenu from '@fastgpt/web/components/common/MyMenu';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { useUserStore } from '@/web/support/hengda/useUserStore';
import { useConfig } from '@/web/common/hooks/hengda/useConfig';
import json5 from 'json5';

const ToolMenu = ({
  history,
  onRouteToAppDetail
}: {
  history: ChatItemType[];
  onRouteToAppDetail?: () => void;
}) => {
  const { t } = useTranslation();
  const { onExportChat } = useChatBox();
  const { userInfo } = useUserStore();
  // console.log('AAA >> wu.tsx >> WuPage >> 🐅 useMount userInfo', userInfo);
  const router = useRouter();
  const fileConfig = useConfig({ url: 'SeeStatisticsPeoples.json' });
  var canSeeStatisticsPeopleList: Array<string> = [
    '0325218116151499',
    '4926739259891129',
    '6776839900832519',
    '8780134205313102',
    '1772522207331829',
    '6366963720544494',
    '7493359365474034',
    '3783430610078758',
    '5786438149416044',
    '1339194423132277'
  ];

  var canStatisticButtonVisible = false;
  if (fileConfig && fileConfig.data && userInfo) {
    const list = json5.parse(fileConfig.data) as Array<string>;
    // console.log('AAA >> wu.tsx >> WuPage >> 🐅 useMount list', list);
    if (list && list.length > 0) {
      canSeeStatisticsPeopleList = list;
    }
    if (canSeeStatisticsPeopleList.includes(userInfo.uid)) {
      // console.log('AAA >> wu.tsx >> WuPage >> 🐅 useMount list', list);
      canStatisticButtonVisible = true;
    }
  }

  return (
    <>
      {canStatisticButtonVisible ? (
        <MyTooltip h="100%" label={t('app:statistics_log')}>
          <IconButton
            icon={<MyIcon name={'common/statisticsLogo'} w={'16px'} p={2} />}
            aria-label={''}
            size={'sm'}
            variant={'whitePrimary'}
            onClick={() => {
              // router.push('http://49.51.37.154:3050/');
              window.open('http://49.51.37.154:3050/', '_blank');
            }}
          />
        </MyTooltip>
      ) : null}
    </>
  );
};

export default ToolMenu;
