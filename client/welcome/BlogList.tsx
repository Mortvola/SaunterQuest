import Http from '@mortvola/http';
import React, { useEffect } from 'react';
import { BlogProps } from '../../common/ResponseTypes';

type BlogListItemProps = {
  id: number,
  name: string,
}

const BlogList: React.FC = () => {
  const [blogs, setBlogs] = React.useState<BlogListItemProps[] | null>(null);

  const load = async () => {
    const response = await Http.get<BlogListItemProps[]>('/api/blogs');

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
              <div key={b.id}>
                { b.name }
              </div>
            ))
          )
          : null
      }
    </div>
  );
};

export default BlogList;
