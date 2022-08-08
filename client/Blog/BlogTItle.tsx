import { DateTime } from 'luxon';
import React from 'react';
import styles from './BlogTitle.module.css';
import { BlogInterface } from './state/Types';

type PropsType = {
  blog: BlogInterface,
  style?: React.CSSProperties,
  smallTitle?: boolean,
};

const BlogTitle: React.FC<PropsType> = ({ blog, style, smallTitle = false }) => (
  <div className={`${styles.title} ${smallTitle ? styles.small : ''}`} style={style}>
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
);

export default BlogTitle;
