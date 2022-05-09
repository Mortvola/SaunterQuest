import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BlogSectionInterface } from './state/Types';
import 'github-markdown-css/github-markdown-light.css';
import styles from './Markdown.module.css';

type PropsType = {
  section: BlogSectionInterface,
}

const Markdown: React.FC<PropsType> = ({ section }) => (
  <div className={`${styles.section} markdown-body`}>
    {
      section.text
        ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {
              section.text
            }
          </ReactMarkdown>
        )
        : null
    }
  </div>
);

export default Markdown;
