import React from 'react';
import { observer } from 'mobx-react-lite';
import TextareaAutosize from 'react-textarea-autosize';
import IconButton from '../IconButton';
import { BlogSectionInterface } from '../state/Types';
import styles from './BlogSection.module.css';

type PropsType = {
  section: BlogSectionInterface,
  onAddSection: (afterSection: BlogSectionInterface) => void,
  onDeleteSection: (section: BlogSectionInterface) => void,
}

const BlogSection: React.FC<PropsType> = observer(({ section, onAddSection, onDeleteSection }) => {
  const handleAddSectionClick = () => {
    onAddSection(section);
  };

  const handleDeleteClick = () => {
    onDeleteSection(section);
  };

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    section.setText(event.target.value);
  };

  const handleSelectChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    section.setType(event.target.value);
  };

  return (
    <div className={styles.section}>
      <select onChange={handleSelectChange} value={section.type}>
        <option value="markdown">Markdown</option>
        <option value="elevation">Elevation Chart</option>
        <option value="map">Map</option>
        <option value="photo">Photo</option>
      </select>
      <IconButton icon="trash" onClick={handleDeleteClick} />
      {
        section.type === 'markdown'
          ? <TextareaAutosize className={styles.text} value={section.text ?? ''} onChange={handleChange} />
          : <div />
      }
      <button type="button" onClick={handleAddSectionClick}>Add Section</button>
    </div>
  );
});

export default BlogSection;
