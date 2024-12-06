import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Box, Flex, useTheme } from '@chakra-ui/react';
import NextHead from '@/components/common/NextHead';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useMount } from 'ahooks';
import SliderApps from './components/SliderApps';

import { useUserStore } from '@/web/support/hengda/useUserStore';
import { useShareChatStore } from '@/web/core/chat/storeShareChat';
import { serviceSideProps } from '@/web/common/utils/i18n';
import { teacherWuPage } from '@/web/support/hengda/auth';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { useAppStore } from '@/web/core/chat/context/useAppStore';
import { getMyApps } from '@/web/core/app/hengda/api';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { useConfig } from '@/web/common/hooks/hengda/useConfig';
import json5 from 'json5';

const Auth = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { userInfo, initUserInfo, setUserInfo } = useUserStore();

  useQuery(
    [router.pathname, 'wu.tsx'],
    () => {
      // console.log('AAA >> Auth.ts >> router.pathname', router.pathname);
      // console.log('AAA >> Auth.ts >> userInfo', userInfo);

      if (userInfo) {
        return null;
      } else {
        return initUserInfo();
      }
    },
    {
      onError(error) {
        console.log('🦁 error->', error);
        setUserInfo(null);
        var lastRoute = ""
        if (teacherWuPage[location.pathname] === true) {
          lastRoute = `?lastRoute=${encodeURIComponent(location.pathname + location.search)}`;
        }
        router.push(`/teacher/login${lastRoute}`);
        toast({
          status: 'warning',
          title: t('common:support.user.Need to login')
        });
      }
    }
  );

  return !!userInfo ? <>{children}</> : null;
};

type Props = {
  appId: string;
  host: string;
};

const WuPage = (props: Props) => {//

  const { appId, host } = props;
  const { loaded } = useShareChatStore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isPc } = useSystem();
  const theme = useTheme();
  const { userInfo } = useUserStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');
  const router = useRouter();
  const { source, chatId, lastChatAppId, setSource, setAppId } = useChatStore();
  const { setMyApps } = useAppStore();
  const fileConfig = useConfig({ url: 'config.json' });
  // console.log("AAA >> wu.tsx >> WuPage >> 🐅 useMount fileConfig", fileConfig)

  var appIdMapToShareIdList: Record<string, string> = {
    '67527d561a317db018c0ee2a': 'b78lekvomw43r2fdxig0g3gb',// PDF翻译
    '67527c171a317db018c0ec7e': 'kkd9jccdcfacw5c5zkbz7abc',// try
    '673e8d8b9df291d63df29493': 'odxc7x4usv8ljt6pgoyc6ino',// TeacherWu/伍老师
    '6750fe3d6229b4b2aef74b54': '6atu1ld2lcofecvlcxf3yw2v',// 文件问答
    '67524b75c034e9cc64d6cd3e': 'nputuwms08t07nbut21hkj58',// 长字幕反思翻译机器人
    '67524b58c034e9cc64d6ccd6': 'ipeatrk6macex681tdb1v54m',// 长文翻译专家
    '67524b0cc034e9cc64d6cc2f': 'ljzxc5yt2nxz1op7uz5xshlh',// 多轮翻译机器人
    '674d1df444a12639b48b17a3': '70myokz9i1xukr3qg97evqjv',// DEMO
    '6743fa2c32e34ca6789e8b96': '5q0dvty595zbifyyersz1l5p',// 伍老师
  }

  if (fileConfig && fileConfig.data) {
    const list = json5.parse(fileConfig.data) as { appIdMapToShareIdList: { [key: string]: string } };
    // console.log("AAA >> wu.tsx >> WuPage >> 🐅 useMount list", list)
    appIdMapToShareIdList = list.appIdMapToShareIdList;
  }

  const { data: myApps = [], runAsync: loadMyApps } = useRequest2(
    () => getMyApps({ getRecentlyChat: true }),
    {
      manual: false,
      onSuccess: (data) => {
        setMyApps(data);
      }
    }
  );

  // 初始化聊天框
  useMount(async () => {
    // pc: redirect to latest model chat
    // console.log("AAA >> wu.tsx >> WuPage >> 🐅 useMount");
    // load config
    // const feConfigs = json5.parse(fileConfig)?.feConfigs as FastGPTFeConfigsType;
    // const appIdMapToShareId = feConfigs?.appIdMapToShareIdList ?? {};

    if (!appId && userInfo) {
      const apps = await loadMyApps();
      // console.log("AAA >> wu.tsx >> WuPage >> 🐅 apps", apps);
      // console.log("AAA >> wu.tsx >> WuPage >> 🐅 userInfo", userInfo);
      if (apps.length === 0) {
        toast({
          status: 'error',
          title: t('common:core.chat.You need to a chat app')
        });
        router.replace('/teacher/login');
      } else {
        router.replace({
          query: {
            ...router.query,
            appId: lastChatAppId || apps[0]._id
          }
        });
      }
    }
    setSource('online');
  });
  // Watch appId
  useEffect(() => {
    setAppId(appId);
  }, [appId, setAppId]);

  useMount(() => {
    setIsLoaded(true);
  });

  const shareId = useMemo(() => {
    return appIdMapToShareIdList[appId] || '';
  }, [appId]);

  useEffect(() => {
    // console.log("AAA >> wu.tsx >> WuPage >> userInfo", userInfo)
    // console.log("AAA >> wu.tsx >> WuPage >> host", host)
    // console.log("AAA >> wu.tsx >> WuPage >> appId", appId)
    // console.log("AAA >> wu.tsx >> WuPage >> shareId", shareId)
    if (userInfo?.uid && shareId) {
      router.basePath
      const customUid = userInfo.uid;
      const linkUrl = `http://${host}/chat/share?shareId=${shareId}&customUid=${customUid}`;
      // console.log("AAA >> wu.tsx >> WuPage >> linkUrl", linkUrl)
      setIframeSrc(linkUrl);
    }
  }, [userInfo, appId, shareId]);

  const systemLoaded = isLoaded && loaded && userInfo?.uid;

  // useEffect(() => {
  // }, [customUid, shareId]);

  return (
    <Auth>
      <Box position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100vh" // 使父容器占满整个屏幕
        margin={0}
        padding={0}>
        <Flex h={'100%'}>
          {/* pc show myself apps */}
          {isPc && (
            <Box borderRight={theme.borders.base} w={'220px'} flexShrink={0}>
              <SliderApps apps={myApps} activeAppId={appId} />
            </Box>
          )}

          {systemLoaded ? (
            <iframe
              src={iframeSrc}
              width="100%"
              height="100%"
              title="对话"
            />
          ) : (
            <NextHead title="Loading..." />
          )}
        </Flex>
      </Box>
    </Auth>
  );
};

export default React.memo(WuPage);

export async function getServerSideProps(context: any) {
  // const shareId = context?.query?.shareId || '';
  // const customUid = context?.query?.customUid || '';
  const host = ('' + context.req.headers.host) || '192.168.0.89:80';
  // const [hostname, port] = host.split(':'); // 分割主机名和端口
  console.log('AAA >> wu.tsx >> getServerSideProps >> host', host);
  return {
    props: {
      appId: context?.query?.appId || '',
      host,
      ...(await serviceSideProps(context, ['file', 'app', 'chat', 'workflow', 'user']))
    }
  };
}