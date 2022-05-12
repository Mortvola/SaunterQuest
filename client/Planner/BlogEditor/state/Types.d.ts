interface BlogManagerInterface {
  blogs: BlogListItemInterface[];

  addBlog(): Promise<void>;

  deleteBlog(blog: BlogListItemInterface): Promise<void>;
}
