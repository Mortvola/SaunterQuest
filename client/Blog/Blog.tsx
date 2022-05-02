import React from 'react';
import { DateTime } from 'luxon';
import { observer } from 'mobx-react-lite';
import { BlogInterface } from './state/Types';
import Markdown from './Markdown';
import styles from './Blog.module.css';
import Elevation from './Elevation';
import MapData from '../Hike/state/Map';
import Photo from './Photo';
import HikeLeg from '../Hike/state/HikeLeg';
import Map from './Map';
import Comments from './Comments/Comments';
import YouTube from './YouTube';
import SocialIcons from './SocialIcons';
import PleaseWait from '../Hikes/PleaseWait';
import PrevNextButtons from './PrevNextButtons';

type PropsType = {
  blog: BlogInterface,
  tileServerUrl: string,
}

const FormattedBlog: React.FC<PropsType> = observer(({ blog, tileServerUrl }) => {
  const [hikeLeg, setHikeLeg] = React.useState<HikeLeg | null>(null);
  const [showMapPleaseWait, setShowMapPleaseWait] = React.useState<boolean>(true);
  const blogRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (blog.hikeLegId !== null) {
      const h = new HikeLeg({ id: blog.hikeLegId, name: null, startDate: null, color: '#3174ad' }, new MapData());
      h.load();

      setHikeLeg(h);
    }
  }, [blog.hikeLegId]);

  const handleMapLoaded = () => {
    setShowMapPleaseWait(false);
  }

  return (
    <div className={styles.blogWrapper}>
      <div ref={blogRef} className={styles.blog}>
        {
        blog.titlePhoto.id
          ? <Photo
            photo={blog.titlePhoto}
            className="title-photo"
            blogId={blog.id}
            loading="eager"
          />
          : null
        }
        <SocialIcons blog={blog} />
        <div className={styles.title}>
          <div>{blog.title ?? ''}</div>
          {
            blog.publicationTime
              ? (
                <span className={styles.publishedDate}>
                  {
                    `Published ${blog.publicationTime.toLocaleString(DateTime.DATETIME_FULL)}`
                  }
                  {
                    blog.publicationUpdateTime
                      ? (
                        `, Updated ${blog.publicationUpdateTime.toLocaleString(DateTime.DATETIME_FULL)}`
                      )
                      : null
                  }
                </span>
              )
              : null
          }
        </div>
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
                      <Map
                        key={index}
                        tileServerUrl={tileServerUrl}
                        hikeLeg={hikeLeg}
                        onLoaded={handleMapLoaded}
                      />
                    )
                    : (
                      // eslint-disable-next-line react/no-array-index-key
                      <div key={index} className={styles.mapPlaceholder}>
                        <PleaseWait show={showMapPleaseWait} />
                      </div>
                    )
                );

              case 'photo':
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <Photo key={index} photo={s.photo} blogId={blog.id} />
                );

              case 'youTube': {
                const element = blogRef.current;

                if (element) {
                  return (
                    <YouTube
                      // eslint-disable-next-line react/no-array-index-key
                      key={index}
                      url={s.text}
                      width={element.clientWidth}
                      height={element.clientWidth * (9 / 16)}
                    />
                  );
                }

                return null;
              }

              case 'html':
                return (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    className={styles.html}
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: s.text ?? '' }}
                  />
                );

              default:
                return <div />;
            }
          })
        }
        <SocialIcons blog={blog} style={{ marginTop: '2rem' }} />
        <PrevNextButtons blog={blog} />
        <Comments blogId={blog.id} />
      </div>
    </div>
  );
});

export default FormattedBlog;
