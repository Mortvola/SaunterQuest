interface BlogManagerInterface {
  blogs: BlogListItemInterface[];

  addBlog(): Promise<number | null>;

  deleteBlog(blog: BlogListItemInterface): Promise<void>;
}
