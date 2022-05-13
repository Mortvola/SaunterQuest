import { observer } from 'mobx-react-lite';
import React from 'react';
import { BlogListItemInterface } from '../Blog/state/Types';
import Image from '../Image/Image';
import styles from './BlogListItem.module.css';

type PropsType = {
  blog: BlogListItemInterface,
  onClick: (blog: BlogListItemInterface) => void,
}

const BlogListItem: React.FC<PropsType> = observer(({ blog, onClick }) => {
  const handleClick = () => {
    onClick(blog);
  };

  return (
    <div onClick={handleClick} className={styles.listItem}>
      <div className={styles.title}>
        {blog.title ?? `Untitled (${blog.id})`}
      </div>
      <div className={styles.date}>
        {blog.publicationTime ? blog.publicationTime.toLocaleString() : null}
      </div>
      <Image
        blogId={blog.id}
        photoId={blog.titlePhoto.id}
        width={blog.titlePhoto.width}
        height={blog.titlePhoto.height}
      />
    </div>
  );
});

export default BlogListItem;
