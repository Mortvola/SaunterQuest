import { observer } from 'mobx-react-lite';
import React from 'react';
import { BlogListItemInterface } from '../../Blog/state/Types';
import IconButton from '../../IconButton';
import { useDeleteConfirmation } from '../../DeleteConfirmation';
import styles from './BlogListItem.module.css';

type PropsType = {
  blog: BlogListItemInterface,
  selected: boolean,
  onClick: (blog: BlogListItemInterface) => void,
}

const BlogListItem: React.FC<PropsType> = observer(({ blog, selected, onClick }) => {
  const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
    'Are you sure you want to delete this blog post?',
    () => {
      blog.delete();
    },
  );

  const handleClick = () => {
    onClick(blog);
  };

  return (
    <div className={styles.item}>
      <div onClick={handleClick}>
        {blog.title ?? `Untitled (${blog.id})`}
      </div>
      <IconButton icon="trash" onClick={handleDeleteClick} />
      <DeleteConfirmation />
    </div>
  );
});

export default BlogListItem;
