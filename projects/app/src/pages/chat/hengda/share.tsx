// pages/chat/hengda/share.tsx
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import { useToast } from '@fastgpt/web/hooks/useToast';

import { useUserStore } from '@/web/support/user/hengda/useUserStore';
import { serviceSideProps } from '@/web/common/utils/i18n';

const Auth = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { userInfo, initUserInfo } = useUserStore();
  // useEffect(() => {
  // const token = localStorage.getItem('hd_token');
  // if (!token) {
  //   router.push('/chat/hengda/login');
  // }
  // }, [router]);

  useQuery(
    [router.pathname],
    () => {
      if (userInfo) {
        return null;
      } else {
        return initUserInfo();
      }
    },
    {
      onError(error) {
        console.log('error->', error);
        router.replace(
          `/chat/hengda/login?lastRoute=${encodeURIComponent(location.pathname + location.search)}`
        );
        toast({
          status: 'warning',
          title: t('common:support.user.Need to login')
        });
      }
    }
  );

  return !!userInfo ? <>{children}</> : null;
};

const SharePage = () => {
  return (
    <Auth>
      <Box position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100vh" // 使父容器占满整个屏幕
        margin={0}
        padding={0}>
        <iframe
          src="http://127.0.0.1:3000/chat/share?shareId=odxc7x4usv8ljt6pgoyc6ino"
          width="100%"
          height="100%"
          title="对话"
        />
      </Box>
    </Auth>
  );
};

export default React.memo(SharePage);

export async function getServerSideProps(context: any) {
  const shareId = context?.query?.shareId || '';
  const authToken = context?.query?.authToken || '';
  const customUid = context?.query?.customUid || '';

  return {
    props: {
      shareId: shareId ?? '',
      authToken: authToken ?? '',
      customUid,
      ...(await serviceSideProps(context, ['file', 'app', 'chat', 'workflow']))
    }
  };
}