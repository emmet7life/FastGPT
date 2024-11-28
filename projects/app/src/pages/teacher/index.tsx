import { GetServerSideProps } from 'next';

const TeacherRedirect = () => {
  return null; // 不需要渲染任何内容
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    redirect: {
      destination: '/teacher/wu', // 重定向目标
      permanent: false, // 设置为 false，表示不是永久重定向
    },
  };
};

export default TeacherRedirect;
