import React from 'react';
import {
  Field, Form, Formik, FormikHelpers,
} from 'formik';
import TextareaAutosize from 'react-textarea-autosize';
import Http from '@mortvola/http';
import { FormError, setFormErrors } from '@mortvola/forms';
import { CommentProps, CommentRequest, isErrorResponse } from '../../../../common/ResponseTypes';
import styles from './CommentForm.module.css';

type PropsType = {
  blogId: number,
  replyingTo?: string,
  replyingToId?: number,
  onCommentAdded: (comment: CommentProps) => void,
}

const CommentForm: React.FC<PropsType> = ({
  blogId,
  onCommentAdded,
  replyingTo,
  replyingToId,
}) => {
  type FormValues = {
    name: string,
    email: string,
    comment: string,
    notify: boolean,
  };

  const handleSubmit = async (values: FormValues, helpers: FormikHelpers<FormValues>) => {
    const response = await Http.post<CommentRequest, CommentProps>(`/api/blog/${blogId}/comment`, {
      ...values,
      replyToId: replyingToId,
    });

    if (response.ok) {
      helpers.resetForm();

      const body = await response.body();
      onCommentAdded(body);
    }
    else {
      const body = await response.body();

      if (isErrorResponse(body)) {
        setFormErrors(helpers.setErrors, body.errors);
      }
    }
  };

  return (
    <Formik<FormValues>
      initialValues={{
        name: '',
        email: '',
        comment: '',
        notify: true,
      }}
      onSubmit={handleSubmit}
    >
      <Form className={`${styles.comment} ${replyingTo ? styles.reply : ''}`}>
        <div>
          {
            replyingTo
              ? `Replying to ${replyingTo}`
              : 'Leave a Comment'
          }
        </div>
        <div>
          <Field className={styles.name} placeholder="Name" name="name" />
          <FormError name="name" />
        </div>
        <div>
          <Field className={styles.email} placeholder="e-mail" name="email" />
          (Your e-mail will not be published)
          <FormError name="email" />
        </div>
        <label>
          <Field type="checkbox" className={styles.notify} name="notify" />
          Notify me of replies to my comment via e-mail
        </label>
        <div>
          <Field as={TextareaAutosize} className={styles.commentText} placeholder="comment" name="comment" />
          <FormError name="comment" />
        </div>
        <button type="submit" className={styles.button}>Post</button>
      </Form>
    </Formik>
  );
};

export default CommentForm;
