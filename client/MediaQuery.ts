import * as responsive from 'react-responsive';

type MediaQueryType = {
  isDesktop: boolean,
  isMobile: boolean,
  addMediaClass: (className: string) => string;
}

const useMediaQuery = (): MediaQueryType => {
  const isDesktop = responsive.useMediaQuery({ query: '(min-width: 800px)' });
  const isMobile = responsive.useMediaQuery({ query: '(max-width: 800px)' });

  const addMediaClass = (className: string) => {
    if (isMobile) {
      return `mobile ${className}`;
    }

    return className;
  };

  return { isDesktop, isMobile, addMediaClass };
};

export default useMediaQuery;
