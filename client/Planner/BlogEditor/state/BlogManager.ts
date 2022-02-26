import Http from '@mortvola/http';
import { makeObservable, observable, runInAction } from 'mobx';
import { BlogProps } from '../../../../common/ResponseTypes';
import { BlogManagerInterface } from '../../../Blog/state/Types';
import Blog from '../../../Blog/state/Blog';

class BlogManager implements BlogManagerInterface {
  blogs: Blog[] = [];

  constructor() {
    this.load();

    makeObservable(this, {
      blogs: observable,
    });
  }

  async load(): Promise<void> {
    const response = await Http.get<BlogProps[]>('/api/blogs');

    if (response.ok) {
      const body = await response.body();

      runInAction(() => {
        this.blogs = body.map((b) => new Blog(b));
      });
    }
  }

  async addBlog(): Promise<void> {
    const response = await Http.post<void, BlogProps>('/api/blog');

    if (response.ok) {
      const body = await response.body();

      runInAction(() => {
        this.blogs = [
          ...this.blogs,
          new Blog(body),
        ];
      });
    }
  }
}

export default BlogManager;
