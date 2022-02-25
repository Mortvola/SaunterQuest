import React from 'react';
import { observer } from 'mobx-react-lite';
import TextareaAutosize from 'react-textarea-autosize';
import IconButton from '../IconButton';
import { BlogSectionInterface } from '../state/Types';
import styles from './BlogSection.module.css';
import Photo from './Photo';
import HTML from './HTML';

type PropsType = {
  section: BlogSectionInterface,
  blogId: number,
  onAddSection: (afterSection: BlogSectionInterface) => void,
  onDeleteSection: (section: BlogSectionInterface) => void,
}

const BlogSection: React.FC<PropsType> = observer(({
  section,
  blogId,
  onAddSection,
  onDeleteSection,
}) => {
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

  const renderSectionControls = () => {
    switch (section.type) {
      case 'elevation':
        return <div />;

      case 'map':
        return <div />;

      case 'markdown':
        return (
          <TextareaAutosize className={styles.text} value={section.text ?? ''} onChange={handleChange} />
        );

      case 'photo':
        return (
          <Photo photo={section.photo} blogId={blogId} />
        );

      case 'html':
        return (
          <HTML html={section.text} onChange={handleChange} />
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.section}>
      <select onChange={handleSelectChange} value={section.type}>
        <option value="markdown">Markdown</option>
        <option value="elevation">Elevation Chart</option>
        <option value="map">Map</option>
        <option value="photo">Photo</option>
        <option value="html">HTML</option>
      </select>
      <IconButton icon="trash" onClick={handleDeleteClick} />
      {
        renderSectionControls()
      }
      <button type="button" onClick={handleAddSectionClick}>Add Section</button>
    </div>
  );
});

export default BlogSection;
