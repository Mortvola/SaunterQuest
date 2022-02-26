import Http from '@mortvola/http';
import { makeAutoObservable, runInAction } from 'mobx';
import { BlogListItemProps, BlogProps } from '../../../../common/ResponseTypes';
import { BlogListItemInterface, BlogManagerInterface } from '../../../Blog/state/Types';
import Blog from '../../../Blog/state/Blog';

class BlogManager implements BlogManagerInterface {
  blogs: BlogListItemInterface[] = [];

  selectedBlog: BlogListItemInterface | null = null;

  blog: Blog | null = null;

  constructor() {
    this.load();

    makeAutoObservable(this);
  }

  async load(): Promise<void> {
    const response = await Http.get<BlogListItemProps[]>('/api/blogs');

    if (response.ok) {
      const body = await response.body();

      runInAction(() => {
        this.blogs = body;
      });
    }
  }

  async loadBlog(blog: BlogListItemInterface): Promise<void> {
    const response = await Http.get<BlogProps>(`/api/blog/${blog.id}?o=draft`);

    if (response.ok) {
      const body = await response.body();

      runInAction(() => {
        this.blog = new Blog(body);
      });
    }
  }

  setSelectedBlog(blog: BlogListItemInterface | null): void {
    runInAction(() => {
      if (this.selectedBlog !== blog && blog !== null) {
        this.loadBlog(blog);
      }

      this.selectedBlog = blog;
    });
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
