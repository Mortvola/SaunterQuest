import React from 'react';
import { observer } from 'mobx-react-lite';
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
  tileServerUrl: string,
}

const FormattedBlog: React.FC<PropsType> = observer(({ blog, tileServerUrl }) => {
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
                  hikeLeg && hikeLeg.route.bounds
                    ? (
                      // eslint-disable-next-line react/no-array-index-key
                      <Map key={index} tileServerUrl={tileServerUrl} hikeLeg={hikeLeg} />
                    )
                    : (
                      // eslint-disable-next-line react/no-array-index-key
                      <div key={index} />
                    )
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
});

export default FormattedBlog;
