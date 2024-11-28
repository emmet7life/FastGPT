import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Center,
  Drawer,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  useDisclosure
} from '@chakra-ui/react';
import { LoginPageTypeEnum } from '@/web/support/hengda/constants';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import type { ResLogin } from '@/global/support/api/hengda/userRes.d';
import { useRouter } from 'next/router';
import { useUserStore } from '@/web/support/hengda/useUserStore';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import LoginForm from '@/pages/teacher/components/loginForm/LoginForm';
import dynamic from 'next/dynamic';
import { serviceSideProps } from '@/web/common/utils/i18n';
import { clearToken, setToken, teacherWuPage, getPathBeforeQuery } from '@/web/support/hengda/auth';
import Script from 'next/script';
import Loading from '@fastgpt/web/components/common/MyLoading';
import { useLocalStorageState, useMount } from 'ahooks';
import { useTranslation } from 'next-i18next';
// import I18nLngSelector from '@/components/Select/I18nLngSelector';
// import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { GET } from '@/web/common/api/request';
import { getDocPath } from '@/web/common/system/doc';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';

const RegisterForm = dynamic(() => import('@/pages/teacher/components/RegisterForm'));
const ForgetPasswordForm = dynamic(() => import('@/pages/teacher/components/ForgetPasswordForm'));
// const CommunityModal = dynamic(() => import('@/components/CommunityModal'));

const Login = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { lastRoute = '' } = router.query as { lastRoute: string };
  const { feConfigs } = useSystemStore();
  const [pageType, setPageType] = useState<`${LoginPageTypeEnum}`>(LoginPageTypeEnum.passwordLogin);
  const { setUserInfo } = useUserStore();
  const { setLastChatAppId } = useChatStore();
  // const { isOpen, onOpen, onClose } = useDisclosure();
  // const { isPc } = useSystem();

  // const {
  //   isOpen: isOpenCookiesDrawer,
  //   onOpen: onOpenCookiesDrawer,
  //   onClose: onCloseCookiesDrawer
  // } = useDisclosure();
  // const cookieVersion = '1';
  // const [localCookieVersion, setLocalCookieVersion] =
  //   useLocalStorageState<string>('localCookieVersion');

  const loginSuccess = useCallback(
    (res: ResLogin) => {
      // init store
      console.log('AAA >> loginSuccess, res', res);
      setUserInfo(res);
      setToken(res.token);

      setTimeout(() => {
        if (teacherWuPage[getPathBeforeQuery(lastRoute)] === true) {
          router.push(lastRoute ? decodeURIComponent(lastRoute) : '/teacher/wu');
        } else {
          // 忽略非TeacherWu界面的跳转
          router.push('/teacher/wu');
        }
      }, 500);
    },
    [lastRoute, router, setLastChatAppId, setUserInfo]
  );

  function DynamicComponent({ type }: { type: `${LoginPageTypeEnum}` }) {
    const TypeMap = {
      [LoginPageTypeEnum.passwordLogin]: LoginForm,
      [LoginPageTypeEnum.register]: RegisterForm,
      [LoginPageTypeEnum.forgetPassword]: ForgetPasswordForm
    };

    const Component = TypeMap[type];

    return <Component setPageType={setPageType} loginSuccess={loginSuccess} />;
  }

  /* default login type */
  useEffect(() => {
    // const bd_vid = sessionStorage.getItem('bd_vid');
    // if (bd_vid) {
    //   setPageType(LoginPageTypeEnum.passwordLogin);
    //   return;
    // }
    setPageType(LoginPageTypeEnum.passwordLogin);
    setLastChatAppId('');
  }, [feConfigs.oauth]);

  useMount(() => {
    clearToken();
    router.prefetch('/teacher/wu');
    // localCookieVersion !== cookieVersion && onOpenCookiesDrawer();
  });

  return (
    <>
      <Flex
        alignItems={'center'}
        justifyContent={'center'}
        bg={`url(${getWebReqUrl('/icon/login-bg.svg')}) no-repeat`}
        backgroundSize={'cover'}
        userSelect={'none'}
        h={'100%'}
      >
        <Flex
          flexDirection={'column'}
          w={['100%', '556px']}
          h={['100%', 'auto']}
          bg={'white'}
          px={['5vw', '88px']}
          py={['5vh', '64px']}
          borderRadius={[0, '16px']}
          boxShadow={[
            '',
            '0px 32px 64px -12px rgba(19, 51, 107, 0.20), 0px 0px 1px 0px rgba(19, 51, 107, 0.20)'
          ]}
        >
          <Box w={['100%', '380px']} flex={'1 0 0'}>
            {pageType ? (
              <DynamicComponent type={pageType} />
            ) : (
              <Center w={'full'} h={'full'} position={'relative'}>
                <Loading fixed={false} />
              </Center>
            )}
          </Box>
          {/* {feConfigs?.concatMd && (
            <Box
              mt={8}
              color={'primary.700'}
              fontSize={'mini'}
              fontWeight={'medium'}
              cursor={'pointer'}
              textAlign={'center'}
              onClick={onOpen}
            >
              {t('common:support.user.login.can_not_login')}
            </Box>
          )} */}
        </Flex>
        {/* {isOpen && <CommunityModal onClose={onClose} />} */}
      </Flex>
      {/* {isOpenCookiesDrawer && (
        <CookiesDrawer
          onAgree={() => {
            setLocalCookieVersion(cookieVersion);
            onCloseCookiesDrawer();
          }}
          onClose={onCloseCookiesDrawer}
        />
      )} */}
    </>
  );
};

// function RedirectDrawer({
//   isOpen,
//   onClose,
//   disableDrawer,
//   onRedirect
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   disableDrawer: () => void;
//   onRedirect: () => void;
// }) {
//   const { t } = useTranslation();
//   return (
//     <Drawer placement="bottom" size={'xs'} isOpen={isOpen} onClose={onClose}>
//       <DrawerOverlay backgroundColor={'rgba(0,0,0,0.2)'} />
//       <DrawerContent py={'1.75rem'} px={'3rem'}>
//         <DrawerCloseButton size={'sm'} />
//         <Flex align={'center'} justify={'space-between'}>
//           <Box>
//             <Box color={'myGray.900'} fontWeight={'500'} fontSize={'1rem'}>
//               {t('login:Chinese_ip_tip')}
//             </Box>
//             <Box
//               color={'primary.700'}
//               fontWeight={'500'}
//               fontSize={'1rem'}
//               textDecorationLine={'underline'}
//               cursor={'pointer'}
//               onClick={disableDrawer}
//             >
//               {t('login:no_remind')}
//             </Box>
//           </Box>
//           <Button ml={'0.75rem'} onClick={onRedirect}>
//             {t('login:redirect')}
//           </Button>
//         </Flex>
//       </DrawerContent>
//     </Drawer>
//   );
// }

// function CookiesDrawer({ onClose, onAgree }: { onClose: () => void; onAgree: () => void }) {
//   const { t } = useTranslation();

//   return (
//     <Drawer placement="bottom" size={'xs'} isOpen={true} onClose={onClose}>
//       <DrawerOverlay backgroundColor={'rgba(0,0,0,0.2)'} />
//       <DrawerContent py={'1.75rem'} px={'3rem'}>
//         <DrawerCloseButton size={'sm'} />
//         <Flex align={'center'} justify={'space-between'}>
//           <Box>
//             <Box color={'myGray.900'} fontWeight={'500'} fontSize={'1rem'}>
//               {t('login:cookies_tip')}
//             </Box>
//             <Box
//               color={'primary.700'}
//               fontWeight={'500'}
//               fontSize={'1rem'}
//               textDecorationLine={'underline'}
//               cursor={'pointer'}
//               w={'fit-content'}
//               onClick={() => window.open(getDocPath('/docs/agreement/privacy/'), '_blank')}
//             >
//               {t('login:privacy_policy')}
//             </Box>
//           </Box>
//           <Button ml={'0.75rem'} onClick={onAgree}>
//             {t('login:agree')}
//           </Button>
//         </Flex>
//       </DrawerContent>
//     </Drawer>
//   );
// }

export async function getServerSideProps(context: any) {
  return {
    props: {
      ...(await serviceSideProps(context, ['app', 'user', 'login']))
    }
  };
}

export default Login;
