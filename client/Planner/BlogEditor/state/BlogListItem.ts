import { BlogListItemProps } from "../../../../common/ResponseTypes";
import { BlogListItemInterface, BlogManagerInterface } from "../../../Blog/state/Types";

class BlogListItem implements BlogListItemInterface {
    id: number;

    title: string | null;

    manager: BlogManagerInterface | null;

    constructor(props: BlogListItemProps, manager: BlogManagerInterface | null) {
        this.id = props.id;
        this.title = props.title;

        this.manager = manager;
    }

    delete(): void {
        if (this.manager) {
            this.manager.deleteBlog(this);
        }
    }
}

export default BlogListItem;
