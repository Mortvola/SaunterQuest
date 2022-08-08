import React from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import { useStores } from './state/store';
import Blog from '../Blog/Blog';

type PropsType = {
  tileServerUrl: string,
}

const BlogPost: React.FC<PropsType> = observer(({ tileServerUrl }) => {
  const { blogManager } = useStores();
  const params = useParams();

  React.useEffect(() => {
    if (params.postId === undefined) {
      blogManager.getBlog('latest');
    }
    else {
      blogManager.getBlog(parseInt(params.postId, 10));
    }
  }, [blogManager, params.postId]);

  if (blogManager.current) {
    return (
      <Blog
        blog={blogManager.current}
        tileServerUrl={tileServerUrl}
      />
    );
  }

  return null;
});

export default BlogPost;
