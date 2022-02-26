import { observer } from 'mobx-react-lite';
import React from 'react';
import { BlogInterface, BlogManagerInterface } from '../../Blog/state/Types';
import styles from './BlogList.module.css';
import BlogListItem from './BlogListItem';

type PropsType = {
  blogManager: BlogManagerInterface,
  onSelection: (blog: BlogInterface) => void,
  selectedBlog: BlogInterface | null,
}

const BlogList: React.FC<PropsType> = observer(({ blogManager, onSelection, selectedBlog }) => {
  const handleAddBlog = () => {
    blogManager.addBlog();
  };

  return (
    <div className={styles.listWrapper}>
      <button type="button" onClick={handleAddBlog}>Add Blog</button>
      <div className={styles.list}>
        {
          blogManager.blogs.map((b) => (
            <BlogListItem
              key={b.id}
              blog={b}
              onClick={onSelection}
              selected={b === selectedBlog}
            />
          ))
        }
      </div>
    </div>
  );
});

export default BlogList;
