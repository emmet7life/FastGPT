import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'next-i18next';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useRouter } from 'next/router';
import MySelect, { SelectProps } from '@fastgpt/web/components/common/MySelect';
import { HUGGING_FACE_ICON, LOGO_ICON } from '@fastgpt/global/common/system/constants';
import { Box, Flex } from '@chakra-ui/react';
import Avatar from '@fastgpt/web/components/common/Avatar';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';

type Props = SelectProps & {
  disableTip?: string;
};

const DepartmentSelector = ({ list, onchange, disableTip, ...props }: Props) => {
  // const { t } = useTranslation();
  // const { feConfigs } = useSystemStore();
  const router = useRouter();

  const avatarList = list.map((item) => {
    return {
      value: item.value,
      label: (
        <Flex alignItems={'center'} py={1}>
          <Avatar
            borderRadius={'0'}
            mr={2}
            src={LOGO_ICON}
            fallbackSrc={LOGO_ICON}
            w={'18px'}
          />
          <Box>{item.label}</Box>
        </Flex>
      )
    };
  });

  const onSelect = useCallback(
    (e: string) => {
      return onchange?.(e);
    },
    [onchange, router]
  );

  return (
    <MyTooltip label={disableTip}>
      <MySelect
        className="nowheel"
        isDisabled={!!disableTip}
        {...props}
        list={avatarList}
        onchange={onSelect}
      />
    </MyTooltip>
  );
};

export default DepartmentSelector;