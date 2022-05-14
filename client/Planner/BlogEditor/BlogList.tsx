import { observer } from 'mobx-react-lite';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BlogListItemInterface } from '../../Blog/state/Types';
import styles from './BlogList.module.css';
import BlogListItem from './BlogListItem';

type PropsType = {
  blogManager: BlogManagerInterface,
  onSelection: (blog: BlogListItemInterface) => void,
}

const BlogList: React.FC<PropsType> = observer(({ blogManager, onSelection }) => {
  const navigate = useNavigate();

  const handleAddBlog = async () => {
    const id = await blogManager.addBlog();

    if (id !== null) {
      navigate(id.toString());
    }
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
            />
          ))
        }
      </div>
    </div>
  );
});

export default BlogList;
