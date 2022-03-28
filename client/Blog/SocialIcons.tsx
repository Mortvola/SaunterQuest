import React from 'react';
import {
  FacebookShareButton, FacebookIcon,
  TwitterShareButton, TwitterIcon,
  EmailShareButton, EmailIcon,
} from 'react-share';
import styles from './SocialIcons.module.css';
import { BlogInterface } from './state/Types';

type PropsType = {
  blog: BlogInterface,
  style?: React.CSSProperties,
}

const SocialIcons: React.FC<PropsType> = ({ blog, style }) => {
  const blogUrl = `https://saunterquest.com/blog/${blog.id}`;
  const title = `SaunterQuest: ${blog.title}`;

  return (
    <div className={styles.socialIcons} style={style}>
      <FacebookShareButton url={blogUrl}>
        <FacebookIcon size={32} />
      </FacebookShareButton>
      <TwitterShareButton url={blogUrl} title={title} hashtags={['backpacking', 'hiking']}>
        <TwitterIcon size={32} />
      </TwitterShareButton>
      <EmailShareButton url={blogUrl} subject={title}>
        <EmailIcon size={32} />
      </EmailShareButton>
    </div>
  );
};

export default SocialIcons;
