import Http from '@mortvola/http';
import React, { useEffect } from 'react';
import { BlogListItemProps } from '../../common/ResponseTypes';
import { BlogListItemInterface } from '../Blog/state/Types';
import styles from './BlogList.module.css';
import BlogListItem from './BlogListItem';

type PropsType = {
  onSelection: (blog: BlogListItemInterface) => void,
}

const BlogList: React.FC<PropsType> = ({ onSelection }) => {
  const [blogs, setBlogs] = React.useState<BlogListItemProps[] | null>(null);

  const load = async () => {
    const response = await Http.get<BlogListItemProps[]>('/api/blogs?o=published');

    if (response.ok) {
      const body = await response.body();

      setBlogs(body);
    }
  };

  useEffect(() => {
    if (blogs === null) {
      load();
    }
  }, [blogs]);

  return (
    <div>
      {
        blogs
          ? (
            blogs.map((b) => (
              <BlogListItem
                key={b.id}
                blog={b}
                onClick={onSelection}
                selected={false}
              />
            ))
          )
          : null
      }
    </div>
  );
};

export default BlogList;
