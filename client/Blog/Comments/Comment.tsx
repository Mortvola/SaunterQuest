import { observer } from 'mobx-react-lite';
import React from 'react';
import { CommentProps } from '../../../common/ResponseTypes';
import styles from './Comment.module.css';
import CommentData from './CommentData';
import CommentForm from './CommentForm';

type PropsType = {
  comment: CommentData,
  replyCommentId: number | null,
  blogId: number,
  onReply: (id: number | null) => void,
}

const Comment: React.FC<PropsType> = observer(({
  comment,
  replyCommentId,
  blogId,
  onReply,
}) => {
  const handleReplyAdded = (reply: CommentProps) => {
    comment.addReply(reply);
    onReply(null);
  };

  return (
    <div key={comment.id} className={styles.comment}>
      <div className={styles.body}>
        <div className={styles.row}>
          <div>{comment.name}</div>
          <div className={styles.date}>{comment.createdAt.toLocaleString()}</div>
        </div>
        <div>{comment.comment}</div>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            if (comment.id === replyCommentId) {
              onReply(null);
            }
            else {
              onReply(comment.id);
            }
          }}
        >
          {
            comment.id === replyCommentId
              ? 'Cancel Reply'
              : 'Reply'
          }
        </button>
      </div>
      {
        comment.id === replyCommentId
          ? (
            <CommentForm
              blogId={blogId}
              onCommentAdded={handleReplyAdded}
              replyingTo={comment.name}
              replyingToId={comment.id}
            />
          )
          : null
      }
      <div className={styles.commentReplies}>
        {
          comment.replies.map((c) => (
            <Comment
              key={c.id}
              comment={c}
              replyCommentId={replyCommentId}
              blogId={blogId}
              onReply={onReply}
            />
          ))
        }
      </div>
    </div>
  );
});

export default Comment;
