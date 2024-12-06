import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { useQuery } from '@tanstack/react-query';

export const getConfig = async (url: string) => {
  const response = await fetch(getWebReqUrl(`/hengda/${url}`));
  const textContent = await response.text();
  return textContent;
};

export const useConfig = ({ url }: { url: string }) => {
  const { data = '' } = useQuery([url], () => getConfig(url));

  return {
    data
  };
};
