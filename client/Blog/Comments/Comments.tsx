import Http from '@mortvola/http';
import React from 'react';
import { CommentProps } from '../../../common/ResponseTypes';
import Comment from './Comment';
import CommentData from './CommentData';
import CommentForm from './CommentForm';
import styles from './Comments.module.css';

type PropsType = {
  blogId: number,
}

const Comments: React.FC<PropsType> = ({ blogId }) => {
  const [comments, setComments] = React.useState<CommentData[]>([]);
  const [replyCommentId, setReplyCommentId] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      const response = await Http.get<CommentProps[]>(`/api/blog/${blogId}/comments`);

      if (response.ok) {
        const body = await response.body();

        setComments(body.map((c) => new CommentData(c)));
      }
    })();
  }, [blogId]);

  const handleCommentAdded = (comment: CommentProps) => {
    setComments([
      new CommentData(comment),
      ...comments,
    ]);
  };

  const handleReply = (id: number | null) => {
    setReplyCommentId(id);
  };

  return (
    <>
      <CommentForm blogId={blogId} onCommentAdded={handleCommentAdded} />
      {
        comments.length > 0
          ? (
            <div className={styles.commentList}>
              {
                comments.map((c) => (
                  <Comment
                    key={c.id}
                    comment={c}
                    replyCommentId={replyCommentId}
                    blogId={blogId}
                    onReply={handleReply}
                  />
                ))
              }
            </div>
          )
          : null
      }
    </>
  );
};

export default Comments;
