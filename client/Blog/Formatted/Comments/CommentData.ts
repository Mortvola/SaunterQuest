import { DateTime } from 'luxon';
import { makeAutoObservable, runInAction } from 'mobx';
import { CommentProps } from '../../../../common/ResponseTypes';

class CommentData {
  id: number;

  createdAt: DateTime;

  name: string;

  comment: string;

  replies: CommentData[];

  constructor(props: CommentProps) {
    this.id = props.id;
    this.createdAt = DateTime.fromISO(props.createdAt);
    this.name = props.name;
    this.comment = props.comment;
    this.replies = props.replies ? props.replies.map((r) => new CommentData(r)) : [];

    makeAutoObservable(this);
  }

  addReply(reply: CommentProps) {
    runInAction(() => {
      this.replies = [
        new CommentData(reply),
        ...this.replies,
      ];
    });
  }
}

export default CommentData;
