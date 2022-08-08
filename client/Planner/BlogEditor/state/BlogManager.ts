import Http from '@mortvola/http';
import { makeAutoObservable, runInAction } from 'mobx';
import { BlogListItemProps, BlogProps } from '../../../../common/ResponseTypes';
import { BlogListItemInterface } from '../../../Blog/state/Types';
import Blog from '../../../Blog/state/Blog';
import BlogListItem from './BlogListItem';

class BlogManager implements BlogManagerInterface {
  blogs: BlogListItemInterface[] = [];

  blog: Blog | null = null;

  loadingBlog = false;

  constructor() {
    this.load();

    makeAutoObservable(this);
  }

  async load(): Promise<void> {
    const response = await Http.get<BlogListItemProps[]>('/api/blogs');

    if (response.ok) {
      const body = await response.body();

      runInAction(() => {
        this.blogs = body.map((b) => new BlogListItem(b, this));
      });
    }
  }

  async loadBlog(blogId: number): Promise<void> {
    runInAction(() => {
      this.loadingBlog = true;
    });

    const response = await Http.get<BlogProps>(`/api/blog/${blogId}?o=draft`);

    if (response.ok) {
      const body = await response.body();

      runInAction(() => {
        this.blog = new Blog(body);
        this.loadingBlog = false;
      });
    }
    else {
      runInAction(() => {
        this.loadingBlog = false;
      });
    }
  }

  async addBlog(): Promise<number | null> {
    const response = await Http.post<void, BlogProps>('/api/blog');

    if (response.ok) {
      const body = await response.body();

      runInAction(() => {
        this.blogs = [
          new BlogListItem({ id: body.id, title: `Unknown (${body.id})` }, this),
          ...this.blogs,
        ];
      });

      return body.id;
    }

    return null;
  }

  async deleteBlog(blog: BlogListItemInterface): Promise<void> {
    const response = await Http.delete(`/api/blog/${blog.id}`);

    if (response.ok) {
      const index = this.blogs.findIndex((b) => b.id === blog.id);

      if (index !== -1) {
        this.blogs = [
          ...this.blogs.slice(0, index),
          ...this.blogs.slice(index + 1),
        ];
      }
    }
  }
}

export default BlogManager;
