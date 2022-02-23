import React from 'react';
import { BlogInterface } from '../../state/Types';
import Markdown from './Markdown';
import styles from './Blog.module.css';
import Elevation from './Elevation';
import MapData from '../../state/Map';
import Photo from './Photo';
import HikeLeg from '../../state/HikeLeg';
import Map from './Map';

type PropsType = {
  blog: BlogInterface,
}

const FormattedBlog: React.FC<PropsType> = ({ blog }) => {
  const [hikeLeg, setHikeLeg] = React.useState<HikeLeg | null>(null);

  React.useEffect(() => {
    if (blog.hikeLegId !== null) {
      const h = new HikeLeg({ id: blog.hikeLegId, name: null }, new MapData());
      h.load();

      setHikeLeg(h);
    }
  }, [blog.hikeLegId]);

  return (
    <div className={styles.blogWrapper}>
      <div className={styles.blog}>
        {
        blog.titlePhoto.id
          ? <Photo photo={blog.titlePhoto} className="title-photo" blogId={blog.id} />
          : null
        }
        <div className={styles.title}>{blog.title ?? ''}</div>
        {
          blog.sections.map((s, index) => {
            switch (s.type) {
              case 'markdown':
                return (
                  <Markdown
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    section={s}
                  />
                );

              case 'elevation':
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <Elevation key={index} section={s} hikeLeg={hikeLeg} />
                );

              case 'map':
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <Map key={index} section={s} />
                );

              case 'photo':
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <Photo key={index} photo={s.photo} blogId={blog.id} />
                );

              default:
                return <div />;
            }
          })
        }
      </div>
    </div>
  );
};

export default FormattedBlog;
