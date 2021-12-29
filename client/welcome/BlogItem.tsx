import React from 'react';
import { useHistory } from 'react-router-dom';
import Blog from './state/Blog';
import styles from './BlogItem.module.css';

type PropsType = {
  blog: Blog,
}

const BlogItem: React.FC<PropsType> = ({ blog }) => {
  const history = useHistory();

  const handleClick = () => {
    history.push(`/blog/${blog.id}`);
  };

  return (
    <div key={blog.id} className={styles.item} onClick={handleClick}>{blog.title}</div>
  );
};

export default BlogItem;
