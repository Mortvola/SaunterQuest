import { observer } from 'mobx-react-lite';
import React from 'react';
import { BlogInterface } from '../state/Types';

type PropsType = {
  blog: BlogInterface
  selected: boolean,
  onClick: (blog: BlogInterface) => void,
}

const BlogListItem: React.FC<PropsType> = observer(({ blog, selected, onClick }) => {
  const handleClick = () => {
    onClick(blog);
  };

  return (
    <div onClick={handleClick}>
      {blog.title ?? `Untitled (${blog.id})`}
    </div>
  );
});

export default BlogListItem;
