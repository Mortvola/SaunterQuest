import { observer } from 'mobx-react-lite';
import React from 'react';
import { Offcanvas } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';
import { useStores } from '../state/store';
import BlogList from './BlogList';
import useMediaQuery from '../../MediaQuery';
import styles from './Blogs.module.css';

type PropsType = {
  showOffcanvas: boolean,
  onHideOffcanvas: () => void,
}

const Blogs: React.FC<PropsType> = observer(({ showOffcanvas, onHideOffcanvas }) => {
  const { blogManager } = useStores();
  const { isMobile, addMediaClass } = useMediaQuery();

  const handleSelection = () => {
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
            />
          )
          : (
            <Offcanvas show={showOffcanvas} onHide={onHideOffcanvas}>
              <Offcanvas.Header closeButton />
              <Offcanvas.Body>
                <BlogList
                  blogManager={blogManager}
                  onSelection={handleSelection}
                />
              </Offcanvas.Body>
            </Offcanvas>
          )
      }
      <div>
        <Outlet />
      </div>
    </div>
  );
});

export default Blogs;
