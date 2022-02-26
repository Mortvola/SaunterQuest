import { observer } from 'mobx-react-lite';
import React from 'react';
import { BlogListItemInterface } from '../../Blog/state/Types';

type PropsType = {
  blog: BlogListItemInterface,
  selected: boolean,
  onClick: (blog: BlogListItemInterface) => void,
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
