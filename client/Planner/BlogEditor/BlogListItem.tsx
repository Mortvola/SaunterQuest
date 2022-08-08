import { observer } from 'mobx-react-lite';
import React from 'react';
import { useMatch, useNavigate, useResolvedPath } from 'react-router-dom';
import { BlogListItemInterface } from '../../Blog/state/Types';
import IconButton from '../../IconButton';
import { useConfirmation } from '../../Confirmation';
import styles from './BlogListItem.module.css';

type PropsType = {
  blog: BlogListItemInterface,
  onClick: (blog: BlogListItemInterface) => void,
}

const BlogListItem: React.FC<PropsType> = observer(({ blog, onClick }) => {
  const resolved = useResolvedPath(blog.id.toString());
  const match = useMatch({ path: resolved.pathname, end: true });
  const navigate = useNavigate();

  const [DeleteConfirmation, handleDeleteClick] = useConfirmation(
    'Delete',
    'Are you sure you want to delete this blog post?',
    () => {
      blog.delete();
      navigate('');
    },
  );

  const handleClick = () => {
    onClick(blog);
    navigate(blog.id.toString());
  };

  return (
    <div className={`${styles.item} ${match ? styles.selected : ''}`}>
      <div onClick={handleClick}>
        <div>
          {blog.title ?? `Untitled (${blog.id})`}
        </div>
        <div className={styles.publicationTime}>
          {blog.publicationTime?.toLocaleString() ?? 'Unpublished'}
        </div>
      </div>
      <IconButton icon="trash" onClick={handleDeleteClick} />
      <DeleteConfirmation />
    </div>
  );
});

export default BlogListItem;
