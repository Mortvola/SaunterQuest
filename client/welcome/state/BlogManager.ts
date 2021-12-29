import Http from '@mortvola/http';
import { makeAutoObservable, runInAction } from 'mobx';
import { BlogProps } from '../../../common/ResponseTypes';
import Blog from './Blog';
import { BlogInterface } from './Types';

class BlogManager {
  blogs: Blog[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  // eslint-disable-next-line class-methods-use-this
  async load(): Promise<void> {
    const response = await Http.get<BlogProps[]>('/api/blogs');

    if (response.ok) {
      const body = await response.body();

      runInAction(() => {
        body.forEach((b) => {
          this.blogs.push(new Blog(b));
        });
      });
    }
  }

  static async getBlog(blogId: number): Promise<BlogInterface | null> {
    const response = await Http.get<BlogProps>(`/api/blog/${blogId}`);

    if (response.ok) {
      const body = await response.body();

      return new Blog(body);
    }

    return null;
  }
}

export default BlogManager;
