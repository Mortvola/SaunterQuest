import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import Http from '@mortvola/http';
import TextareaAutosize from 'react-textarea-autosize';
import { useParams } from 'react-router-dom';
import BlogSection from './BlogSection';
import styles from './Blog.module.css';
import { BlogSectionInterface } from '../../Blog/state/Types';
import FormattedBlog from '../../Blog/Blog';
import Photo from './Photo';
import { useStores } from '../state/store';
import PleaseWait from '../../Hikes/PleaseWait';
import ScrollWrapper from '../../ScrollWrapper';

type PropsType = {
  tileServerUrl: string,
}

const Blog: React.FC<PropsType> = observer(({ tileServerUrl }) => {
  type HikeLeg = {
    id: number,
    name: string | null,
  }

  type Hike = {
    id: number,
    name: string,
    hikeLegs: HikeLeg[],
  }

  const params = useParams();
  const { blogManager } = useStores();
  const [preview, setPreview] = React.useState<boolean>(false);
  const [hikes, setHikes] = React.useState<Hike[]>([]);
  const [hike, setHike] = React.useState<Hike | null>(null);

  useEffect(() => {
    if (params.blogId !== undefined) {
      blogManager.loadBlog(parseInt(params.blogId, 10));
    }
  }, [blogManager, params.blogId]);

  // Load the hikes with legs for the select drop downs
  useEffect(() => {
    (async () => {
      const response = await Http.get<Hike[]>('/api/hikes?o=legs');

      if (response.ok) {
        const body = await response.body();

        setHikes(body);
      }
    })();
  }, []);

  const getHike = React.useCallback(() => {
    const selectedHike = hikes.find(
      (h) => h.hikeLegs.some((l) => l.id === blogManager.blog?.hikeLegId),
    );

    return selectedHike ?? null;
  }, [blogManager.blog?.hikeLegId, hikes]);

  useEffect(() => {
    if (blogManager.blog?.hikeLegId == null) {
      setHike(null);
    }
    else {
      const h = getHike();
      setHike(h);
    }
  }, [blogManager.blog?.hikeLegId, getHike]);

  const handleAddSection = (afterSection: BlogSectionInterface) => {
    blogManager.blog?.addSectionAfter(afterSection);
  };

  const handleAddFirstSection = () => {
    blogManager.blog?.addSectionAfter(null);
  };

  const handleDeleteSection = (section: BlogSectionInterface) => {
    blogManager.blog?.deleteSection(section);
  };

  const handlePreviewChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setPreview(event.target.checked);
  };

  const handleSaveClick = () => {
    blogManager.blog?.save();
  };

  const handlePublishClick = () => {
    blogManager.blog?.publish();
  };

  const handleUnpublishClick = () => {
    blogManager.blog?.unpublish();
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

    blogManager.blog?.setHikeLegId(selectedHikeLeg?.id ?? null);
  };

  const handleTitleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    blogManager.blog?.setTitle(event.target.value);
  };

  let hikeId = -1;

  if (hike) {
    hikeId = hike.id;
  }

  if (blogManager.loadingBlog) {
    return <PleaseWait show />;
  }

  if (blogManager.blog) {
    const { blog } = blogManager;

    return (
      <div className={styles.layout}>
        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <label>
              <input className={styles.rightLabeledControl} type="checkbox" checked={preview} onChange={handlePreviewChange} />
              Preview
            </label>
            <button type="button" onClick={handleSaveClick} disabled={!blog.modified}>Save</button>
            <button
              type="button"
              onClick={handlePublishClick}
            >
              { blog.published ? 'Republish' : 'Publish' }
            </button>
            <button
              type="button"
              onClick={handleUnpublishClick}
              disabled={!blog.published}
            >
              Unpublish
            </button>
          </div>
          <label className={styles.legSelection}>
            Associated Hike/Leg:
            <select
              className={styles.leftLabeledControl}
              onChange={handleHikeChange}
              value={hikeId}
            >
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
            ? (
              <ScrollWrapper>
                <FormattedBlog blog={blogManager.blog} tileServerUrl={tileServerUrl} />
              </ScrollWrapper>
            )
            : (
              <div className={styles.editor}>
                <TextareaAutosize className={styles.title} value={blog.title ?? ''} onChange={handleTitleChange} />
                <Photo section={blog} blogId={blog.id} />
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
  }

  return null;
});

export default Blog;
