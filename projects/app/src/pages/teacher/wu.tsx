import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box } from '@chakra-ui/react';
import NextHead from '@/components/common/NextHead';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useMount } from 'ahooks';

import { useUserStore } from '@/web/support/hengda/useUserStore';
import { useShareChatStore } from '@/web/core/chat/storeShareChat';
import { serviceSideProps } from '@/web/common/utils/i18n';
import { teacherWuPage } from '@/web/support/hengda/auth';

type Props = {
  host: string;
};

const Auth = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { userInfo, initUserInfo, setUserInfo } = useUserStore();

  useQuery(
    [router.pathname, 'wu.tsx'],
    () => {

      console.log('AAA >> Auth.ts >> router.pathname', router.pathname);
      console.log('AAA >> Auth.ts >> userInfo', userInfo);

      if (userInfo) {
        return null;
      } else {
        return initUserInfo();
      }
    },
    {
      onError(error) {
        console.log('AAA >> wu.tsx >> Auth.ts >> error->', error);
        setUserInfo(null);
        var lastRoute = ""
        if (teacherWuPage[location.pathname] === true) {
          lastRoute = `?lastRoute=${encodeURIComponent(location.pathname + location.search)}`;
        }
        router.replace(`/teacher/login${lastRoute}`);
        toast({
          status: 'warning',
          title: t('common:support.user.Need to login')
        });
      }
    }
  );

  return !!userInfo ? <>{children}</> : null;
};

const SharePage = (props: Props) => {//

  const { host } = props;
  const { loaded } = useShareChatStore();
  const { userInfo } = useUserStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');
  const router = useRouter();

  useMount(() => {
    setIsLoaded(true);
  });

  useEffect(() => {
    console.log("AAA >> wu.tsx >> SharePage >> userInfo", userInfo)
    console.log("AAA >> wu.tsx >> SharePage >> host", host)
    if (userInfo?.uid) {
      router.basePath
      const customUid = userInfo.uid;
      const linkUrl = `http://${host}/chat/share?shareId=odxc7x4usv8ljt6pgoyc6ino&customUid=${customUid}`;
      console.log("AAA >> wu.tsx >> SharePage >> linkUrl", linkUrl)
      setIframeSrc(linkUrl);
    }
  }, [userInfo]);

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
      </Box>
    </Auth>
  );
};

export default React.memo(SharePage);

export async function getServerSideProps(context: any) {
  // const shareId = context?.query?.shareId || '';
  // const customUid = context?.query?.customUid || '';
  const host = ('' + context.req.headers.host) || '192.168.0.89:80';
  // const [hostname, port] = host.split(':'); // 分割主机名和端口
  console.log('AAA >> wu.tsx >> getServerSideProps >> host', host);
  return {
    props: {
      // shareId: shareId ?? '',
      // customUid,
      host,
      ...(await serviceSideProps(context, ['file', 'app', 'chat', 'workflow', 'user']))
    }
  };
}