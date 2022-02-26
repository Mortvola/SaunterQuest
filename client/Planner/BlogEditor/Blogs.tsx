import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Offcanvas } from 'react-bootstrap';
import { useStores } from '../state/store';
import { BlogListItemInterface } from '../../Blog/state/Types';
import Blog from './Blog';
import BlogList from './BlogList';
import useMediaQuery from '../../MediaQuery';
import styles from './Blogs.module.css';

type PropsType = {
  tileServerUrl: string,
  showOffcanvas: boolean,
  onHideOffcanvas: () => void,
}

const Blogs: React.FC<PropsType> = observer(({ tileServerUrl, showOffcanvas, onHideOffcanvas }) => {
  const { blogManager } = useStores();
  const { isMobile, addMediaClass } = useMediaQuery();

  const handleSelection = (blog: BlogListItemInterface) => {
    blogManager.setSelectedBlog(blog);
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
              selectedBlog={blogManager.selectedBlog}
            />
          )
          : (
            <Offcanvas show={showOffcanvas} onHide={onHideOffcanvas}>
              <Offcanvas.Header closeButton />
              <Offcanvas.Body>
                <BlogList
                  blogManager={blogManager}
                  onSelection={handleSelection}
                  selectedBlog={blogManager.selectedBlog}
                />
              </Offcanvas.Body>
            </Offcanvas>
          )
      }
      <div>
        {
          blogManager.blog
            ? <Blog blog={blogManager.blog} tileServerUrl={tileServerUrl} />
            : null
        }
      </div>
    </div>
  );
});

export default Blogs;
