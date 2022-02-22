import Http from '@mortvola/http';
import { makeAutoObservable, runInAction } from 'mobx';
import { BlogProps } from '../../../common/ResponseTypes';
import Blog from '../../state/Blog/Blog';
import { BlogInterface } from '../../state/Types';

class BlogManager {
  blogs: Blog[] = [];

  current: Blog | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // eslint-disable-next-line class-methods-use-this
  async load(): Promise<void> {
    const response = await Http.get<BlogProps[]>('/api/blogs');

    if (response.ok) {
      const body = await response.body();

      runInAction(() => {
        this.blogs = body.map((b) => new Blog(b));
      });
    }
  }

  async getBlog(blogId: number | 'latest'): Promise<BlogInterface | null> {
    const response = await Http.get<BlogProps>(`/api/blog/${blogId}`);

    if (response.ok) {
      const body = await response.body();

      const blog = new Blog(body);

      runInAction(() => {
        this.current = blog;
      });

      return blog;
    }

    return null;
  }
}

export default BlogManager;
