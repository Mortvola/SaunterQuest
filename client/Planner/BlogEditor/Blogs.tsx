import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Offcanvas } from 'react-bootstrap';
import { useStores } from '../../state/store';
import { BlogInterface } from '../../state/Types';
import Blog from './Blog';
import BlogList from './Bloglist';
import useMediaQuery from '../../MediaQuery';
import styles from './Blogs.module.css';

type PropsType = {
  tileServerUrl: string,
  showOffcanvas: boolean,
  onHideOffcanvas: () => void,
}

const Blogs: React.FC<PropsType> = observer(({ tileServerUrl, showOffcanvas, onHideOffcanvas }) => {
  const { blogManager } = useStores();
  const [selectedBlog, setSelectedBlog] = useState<BlogInterface | null>(null);
  const { isMobile, addMediaClass } = useMediaQuery();

  const handleSelection = (blog: BlogInterface) => {
    setSelectedBlog(blog);
    onHideOffcanvas();
  };

  return (
    <div className={addMediaClass(styles.layout)}>
      {
        !isMobile
          ? (
            <BlogList
              blogManager={blogManager}
              onSelection={handleSelection}
              selectedBlog={selectedBlog}
            />
          )
          : (
            <Offcanvas show={showOffcanvas} onHide={onHideOffcanvas}>
              <Offcanvas.Header closeButton />
              <Offcanvas.Body>
                <BlogList
                  blogManager={blogManager}
                  onSelection={handleSelection}
                  selectedBlog={selectedBlog}
                />
              </Offcanvas.Body>
            </Offcanvas>
          )
      }
      <div>
        {
          selectedBlog
            ? <Blog blog={selectedBlog} tileServerUrl={tileServerUrl} />
            : null
        }
      </div>
    </div>
  );
});

export default Blogs;
