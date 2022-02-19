import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { useStores } from '../state/store';
import { BlogInterface } from '../state/Types';
import Blog from './Blog';
import BlogListItem from './BlogListItem';
import styles from './Blogs.module.css';

const Blogs: React.FC = observer(() => {
  const { blogManager } = useStores();
  const [selectedBlog, setSelectedBlog] = useState<BlogInterface | null>(null);

  const handleAddBlog = () => {
    blogManager.addBlog();
  };

  const handleBlogListItemClick = (blog: BlogInterface) => {
    setSelectedBlog(blog);
  };

  return (
    <div className={styles.layout}>
      <div>
        <button type="button" onClick={handleAddBlog}>Add Blog</button>
        <div>
          {
            blogManager.blogs.map((b) => (
              <BlogListItem
                key={b.id}
                blog={b}
                onClick={handleBlogListItemClick}
                selected={b === selectedBlog}
              />
            ))
          }
        </div>
      </div>
      <div>
        {
          selectedBlog
            ? <Blog blog={selectedBlog} />
            : null
        }
      </div>
    </div>
  );
});

export default Blogs;
