import { DateTime } from 'luxon';
import { BlogListItemProps } from '../../../../common/ResponseTypes';
import { BlogListItemInterface, BlogManagerInterface } from '../../../Blog/state/Types';

class BlogListItem implements BlogListItemInterface {
  id: number;

  title: string | null;

  manager: BlogManagerInterface | null;

  publicationTime: DateTime | null = null;

  constructor(props: BlogListItemProps, manager: BlogManagerInterface | null) {
    this.id = props.id;
    this.title = props.title;
    if (props.publicationTime) {
      this.publicationTime = DateTime.fromISO(props.publicationTime);
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
