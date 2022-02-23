import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import Http from '@mortvola/http';
import TextareaAutosize from 'react-textarea-autosize';
import BlogSection from './BlogSection';
import styles from './Blog.module.css';
import { BlogInterface, BlogSectionInterface } from '../state/Types';
import FormattedBlog from './Formatted/Blog';
import Photo from './Photo';

type PropsType = {
  blog: BlogInterface,
}

const Blog: React.FC<PropsType> = observer(({ blog }) => {
  type HikeLeg = {
    id: number,
    name: string | null,
  }

  type Hike = {
    id: number,
    name: string,
    hikeLegs: HikeLeg[],
  }

  const [preview, setPreview] = React.useState<boolean>(false);
  const [hikes, setHikes] = React.useState<Hike[]>([]);
  const [hike, setHike] = React.useState<Hike | null>(null);

  useEffect(() => {
    console.log('mount');
    (async () => {
      const response = await Http.get<Hike[]>('/api/hikes?o=legs');

      if (response.ok) {
        const body = await response.body();

        setHikes(body);
      }
    })();

    return (() => {
      console.log('unmount');
    });
  }, []);

  const getHike = React.useCallback(() => {
    console.log('finding hike/hike leg');
    const selectedHike = hikes.find((h) => h.hikeLegs.some((l) => l.id === blog.hikeLegId));

    return selectedHike ?? null;
  }, [blog.hikeLegId, hikes]);

  useEffect(() => {
    console.log('mount: blog changed');
    console.log(`hike leg id: ${blog.hikeLegId}`);

    if (blog.hikeLegId == null) {
      setHike(null);
    }
    else {
      const h = getHike();
      setHike(h);
    }
    return (() => {
      console.log('unmount: blog changed');
    });
  }, [blog, getHike]);

  const handleAddSection = (afterSection: BlogSectionInterface) => {
    blog.addSectionAfter(afterSection);
  };

  const handleAddFirstSection = () => {
    blog.addSectionAfter(null);
  };

  const handleDeleteSection = (section: BlogSectionInterface) => {
    blog.deleteSection(section);
  };

  const handlePreviewChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setPreview(event.target.checked);
  };

  const handleSaveClick = () => {
    blog.save();
  };

  const handleHikeChange: React.ChangeEventHandler<HTMLSelectElement> = async (event) => {
    const hikeId = parseInt(event.target.value, 10);
    const selectedHike = hikes.find((h) => h.id === hikeId);

    setHike(selectedHike ?? null);
  };

  const handleHikeLegChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    if (!hike) {
      throw new Error('hike is null');
    }

    const hikLegId = parseInt(event.target.value, 10);
    const selectedHikeLeg = hike.hikeLegs.find((h) => h.id === hikLegId);

    blog.setHikeLegId(selectedHikeLeg?.id ?? null);
  };

  const handleTitleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    blog.setTitle(event.target.value);
  };

  const handlePublishedChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    blog.setPublished(event.target.checked);
  };

  let hikeId = -1;

  if (hike) {
    hikeId = hike.id;
  }

  return (
    <div className={styles.layout}>
      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label>
            <input className={styles.rightLabeledControl} type="checkbox" checked={blog.published} onChange={handlePublishedChange} />
            Published
          </label>
          <label>
            <input className={styles.rightLabeledControl} type="checkbox" checked={preview} onChange={handlePreviewChange} />
            Preview
          </label>
          <button type="button" onClick={handleSaveClick}>Save</button>
        </div>
        <label className={styles.legSelection}>
          Associated Hike/Leg:
          <select className={styles.leftLabeledControl} onChange={handleHikeChange} value={hikeId}>
            <option value={-1}>None</option>
            {
              hikes.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))
            }
          </select>
          <select onChange={handleHikeLegChange} value={blog.hikeLegId ?? -1}>
            <option key={-1} value={-1}>None</option>
            {
              hike
                ? (
                  hike.hikeLegs.map((l) => (
                    <option key={l.id} value={l.id}>{l.name ?? l.id}</option>
                  ))
                )
                : null
            }
          </select>
        </label>
      </div>
      {
        preview
          ? <FormattedBlog blog={blog} />
          : (
            <div className={styles.editor}>
              <TextareaAutosize className={styles.title} value={blog.title ?? ''} onChange={handleTitleChange} />
              <Photo photo={blog.titlePhoto} blogId={blog.id} />
              <button type="button" className={styles.addButton} onClick={handleAddFirstSection}>Add Section</button>
              {
                blog.sections.map((s, index) => (
                  <BlogSection
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    section={s}
                    blogId={blog.id}
                    onAddSection={handleAddSection}
                    onDeleteSection={handleDeleteSection}
                  />
                ))
              }
            </div>
          )
      }
    </div>
  );
});

export default Blog;
