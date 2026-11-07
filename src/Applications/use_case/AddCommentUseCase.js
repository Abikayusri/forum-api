import NewComment from '../../Domains/comments/entities/NewComment.js';

class AddCommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, threadId, owner) {
    const newComment = new NewComment({ ...useCasePayload, threadId, owner });
    await this._threadRepository.verifyAvailableThread(threadId);
    return this._commentRepository.addComment(newComment);
  }
}

export default AddCommentUseCase;
