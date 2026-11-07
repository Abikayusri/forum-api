import DetailComment from '../../Domains/comments/entities/DetailComment.js';
import DetailReply from '../../Domains/replies/entities/DetailReply.js';
import DetailThread from '../../Domains/threads/entities/DetailThread.js';

class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(threadId) {
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);
    const replies = await this._replyRepository.getRepliesByThreadId(threadId);

    return new DetailThread({
      ...thread,
      comments: comments.map((comment) => new DetailComment({
        id: comment.id,
        username: comment.username,
        date: comment.date,
        content: comment.content,
        isDelete: comment.isDelete,
        replies: replies
          .filter((reply) => reply.commentId === comment.id)
          .map((reply) => new DetailReply({
            id: reply.id,
            content: reply.content,
            date: reply.date,
            username: reply.username,
            isDelete: reply.isDelete,
          })),
      })),
    });
  }
}

export default GetThreadDetailUseCase;
