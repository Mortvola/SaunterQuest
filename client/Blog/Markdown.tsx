import React from 'react';
import MarkdownIt from 'react-markdown';
import { BlogSectionInterface } from '../state/Types';
import styles from './Markdown.module.css';

type PropsType = {
  section: BlogSectionInterface,
}

const Markdown: React.FC<PropsType> = ({ section }) => (
  <div className={styles.section}>
    {
      section.text
        ? (
          <MarkdownIt>
            {
              section.text
            }
          </MarkdownIt>
        )
        : null
    }
  </div>
);

export default Markdown;
