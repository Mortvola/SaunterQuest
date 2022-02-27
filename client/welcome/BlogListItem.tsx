import { DateTime } from 'luxon';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BlogListItemInterface } from '../Blog/state/Types';
import styles from './BlogListItem.module.css';

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
    <div onClick={handleClick} className={styles.listItem}>
      <div>
        {blog.title ?? `Untitled (${blog.id})`}
      </div>
      <div>
        {blog.publicationTime ? DateTime.fromISO(blog.publicationTime).toLocaleString() : null}
      </div>
    </div>
  );
});

export default BlogListItem;
