import { DateTime } from 'luxon';
import { BlogListItemProps } from '../../../../common/ResponseTypes';
import BlogPhoto from '../../../Blog/state/BlogPhoto';
import { BlogListItemInterface } from '../../../Blog/state/Types';

class BlogListItem implements BlogListItemInterface {
  id: number;

  title: string | null;

  manager: BlogManagerInterface | null;

  publicationTime: DateTime | null = null;

  titlePhoto?: BlogPhoto;

  constructor(props: BlogListItemProps, manager: BlogManagerInterface | null) {
    this.id = props.id;
    this.title = props.title;
    if (props.publicationTime) {
      this.publicationTime = DateTime.fromISO(props.publicationTime);
    }

    if (props.titlePhoto) {
      this.titlePhoto = new BlogPhoto(props.titlePhoto);
    }

    this.manager = manager;
  }

  delete(): void {
    if (this.manager) {
      this.manager.deleteBlog(this);
    }
  }
}

export default BlogListItem;
