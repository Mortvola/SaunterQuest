import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { useHistory, matchPath } from 'react-router-dom';
import L from 'leaflet';
import BlogManager from './state/BlogManager';
import { BlogInterface, PhotoInterface } from './state/Types';
import styles from './Blog.module.css';
import Photo from './Photo';
import Terrain from '../Hike/Terrain/Terrain';

type PropsType = {
  pathFinderUrl: string,
}

const Blog: React.FC<PropsType> = observer(({ pathFinderUrl }) => {
  const history = useHistory();
  const [blog, setBlog] = useState<BlogInterface | null>(null);
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [photoId, setPhotoId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const match = matchPath<{ id: string }>(history.location.pathname, { path: '/blog/:id', exact: true });
      if (match) {
        const blogId = parseInt(match.params.id, 10);
        const b = await BlogManager.getBlog(blogId);
        if (b) {
          b.loadPhotos();
        }

        setBlog(b);
      }
    })();
  }, [history.location.pathname]);

  const handlePhotoClick = (photo: PhotoInterface) => {
    setPhotoId(photo.id);
    setPosition(new L.LatLng(photo.location[1], photo.location[0]));
  };

  if (blog) {
    if (position) {
      const handleClose = () => {
        setPosition(null);
      };

      return (
        <Terrain
          photoUrl={`/api/blog/${blog.id}/photo`}
          photoId={photoId}
          editPhoto={false}
          pathFinderUrl={pathFinderUrl}
          position={position}
          onClose={handleClose}
        />
      );
    }

    return (
      <div className={styles.blog}>
        <div className={styles.title}>
          {
            blog
              ? blog.title
              : null
          }
        </div>
        <div className={styles.pictures}>
          {
            blog
              ? blog.photos.map((p) => (
                <Photo key={p.id} blogId={blog.id} photo={p} onClick={handlePhotoClick} />
              ))
              : null
          }
        </div>
      </div>
    );
  }

  return null;
});

export default Blog;