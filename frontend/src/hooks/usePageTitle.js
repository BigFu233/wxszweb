import { useEffect } from 'react';

const usePageTitle = (title) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} - 无限摄制社团` : '无限摄制社团';
    
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};

export default usePageTitle;