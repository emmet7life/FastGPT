import React, { Dispatch, useEffect, useState } from 'react';
import { FormControl, FormErrorMessage, Box, Input, Button } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { LoginPageTypeEnum } from '@/web/support/hengda/constants';
import { postRegister } from '@/web/support/user/api';
import type { ResLogin } from '@/global/support/api/hengda/userRes';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { postCreateApp } from '@/web/core/app/api';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useTranslation } from 'next-i18next';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import DepartmentSelector from '@/components/Select/DepartmentSelector';
import { getHengdaDepartmentList, hengdaRegister } from '@/web/support/hengda/user';
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';

interface Props {
  loginSuccess: (e: ResLogin) => void;
  setPageType: Dispatch<`${LoginPageTypeEnum}`>;
}

interface RegisterType {
  department: number; // 部门
  username: string;
  password: string;
  password2: string;
}

const RegisterForm = ({ setPageType, loginSuccess }: Props) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { openConfirm: openConfirmDel, ConfirmModal: DelConfirmModal } = useConfirm({
    type: 'common'
  });
  const [departmentList, setDepartmentList] = useState<{ label: string; value: number }[]>([]);
  const { feConfigs } = useSystemStore();
  const {
    register,
    handleSubmit,
    getValues,
    watch,
    setValue, // 用于设置表单值
    formState: { errors }
  } = useForm<RegisterType>({
    mode: 'onBlur'
    // defaultValues: {
    //   department: "1"// 默认值
    // }
  });
  const username = watch('username');

  const { runAsync: onclickRegister, loading: requesting } = useRequest2(
    async ({ username, password, department }: RegisterType) => {
      // const fastgpt_sem = (() => {
      //   try {
      //     return sessionStorage.getItem('fastgpt_sem')
      //       ? JSON.parse(sessionStorage.getItem('fastgpt_sem')!)
      //       : undefined;
      //   } catch {
      //     return undefined;
      //   }
      // })();

      console.log('onclickRegister username', username);
      console.log('onclickRegister password', password);
      console.log('onclickRegister department', department);

      const res = await hengdaRegister({
        username,
        password,
        department_id: department
      });
      console.log('onclickRegister res', res);

      loginSuccess(res);

      toast({
        status: 'success',
        title: t('user:register.success')
      });
    },
    {
      refreshDeps: [loginSuccess, t, toast]
    }
  );

  // const { mutate: getDepartmentList } = useRequest({
  //   mutationFn: async () => {
  //     try {
  //       const res = await getHengdaDepartmentList();
  //       console.log("getDepartmentList res", res);
  //       return res;
  //     } catch (error) {
  //       console.warn("getDepartmentList catch error", error);
  //       return [];
  //     }
  //   },
  //   onSuccess: (data) => {
  //     console.log("getDepartmentList onSuccess data", data);
  //   },
  //   errorToast: 'Failed to read the inform'
  // });

  // 在组件初始化时请求部门列表
  useEffect(() => {
    const fetchDepartmentList = async () => {
      try {
        const departments = await getHengdaDepartmentList();
        console.log('getDepartmentList departments', departments);
        const list = departments.map((item) => {
          return {
            label: item.name,
            value: item.id
          };
        });
        setDepartmentList(list);
        if (list.length > 0) {
          setValue('department', list[0].value);
        }
      } catch (error) {
        console.error('Failed to fetch department list', error);
        toast({
          title: '获取部门列表数据发生错误',
          // t('register.fetch_department_error')
          status: 'error'
        });
      }
    };

    fetchDepartmentList();
  }, [t, toast]);

  // console.log("feConfigs ", feConfigs);
  // const placeholder = feConfigs?.register_method?.map((item) => {
  //   switch (item) {
  //     case 'email':
  //       return t('common:support.user.login.Email');
  //     case 'phone':
  //       return t('common:support.user.login.Phone number');
  //   }
  // }).join('/');
  const placeholder = t('common:support.user.login.Username');

  return (
    <>
      <Box fontWeight={'medium'} fontSize={'lg'} textAlign={'center'} color={'myGray.900'}>
        {t('user:register.register_account', { account: feConfigs?.systemTitle })}
      </Box>
      <Box
        mt={9}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !requesting) {
            handleSubmit(onclickRegister)();
          }
        }}
      >
        <FormControl
          mt={6}
          isInvalid={!!errors.department}
          display={'flex'}
          alignItems={'center'}
          position={'relative'}
        >
          <Box flex={'1 0 0'}>
            <DepartmentSelector
              value={watch('department')}
              onchange={(val) => {
                setValue('department', val);
              }}
              list={departmentList}
            />
          </Box>
        </FormControl>
        <FormControl mt={6} isInvalid={!!errors.username}>
          <Input
            bg={'myGray.50'}
            size={'lg'}
            placeholder={placeholder}
            {...register('username', {
              required: t('user:password.username_required'),
              pattern: {
                value: /^[\u4e00-\u9fa5]+[0-9]*$/,
                message: t('user:password.username_error')
              }
            })}
          ></Input>
          <FormErrorMessage>{errors.username && errors.username.message}</FormErrorMessage>
        </FormControl>
        <FormControl mt={6} isInvalid={!!errors.password}>
          <Input
            bg={'myGray.50'}
            size={'lg'}
            type={'password'}
            placeholder={t('user:password.new_password')}
            {...register('password', {
              required: t('user:password.password_required'),
              pattern: {
                value: /^[^\u4e00-\u9fa5\uD83C-\uDBFF\uDC00-\uDFFF]{4,20}$/,
                message: t('user:password.password_condition')
              },
              minLength: {
                value: 4,
                message: t('user:password.password_condition')
              },
              maxLength: {
                value: 20,
                message: t('user:password.password_condition')
              }
            })}
          ></Input>
          <FormErrorMessage>{errors.password && errors.password.message}</FormErrorMessage>
        </FormControl>
        <FormControl mt={6} isInvalid={!!errors.password2}>
          <Input
            bg={'myGray.50'}
            size={'lg'}
            type={'password'}
            placeholder={t('user:password.confirm')}
            {...register('password2', {
              validate: (val) =>
                getValues('password') === val ? true : t('user:password.not_match')
            })}
          ></Input>
          <FormErrorMessage>{errors.password2 && errors.password2.message}</FormErrorMessage>
        </FormControl>
        <Button
          type="submit"
          mt={12}
          w={'100%'}
          size={['md', 'md']}
          rounded={['md', 'md']}
          h={[10, 10]}
          fontWeight={['medium', 'medium']}
          colorScheme="blue"
          isLoading={requesting}
          onClick={() => {
            openConfirmDel(
              () => {
                handleSubmit(onclickRegister)();
              },
              undefined,
              '请再次确认您选择的部门是否正确！'
            )();
          }}
        >
          {t('user:register.confirm')}
        </Button>
        <Box
          float={'right'}
          fontSize="mini"
          mt={3}
          mb={'50px'}
          fontWeight={'medium'}
          color={'primary.700'}
          cursor={'pointer'}
          _hover={{ textDecoration: 'underline' }}
          onClick={() => setPageType(LoginPageTypeEnum.passwordLogin)}
        >
          {t('user:register.to_login')}
        </Box>
      </Box>
      <DelConfirmModal />
    </>
  );
};

export default RegisterForm;
