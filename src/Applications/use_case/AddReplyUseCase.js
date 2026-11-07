import NewReply from '../../Domains/replies/entities/NewReply.js';

class AddReplyUseCase {
  constructor({ replyRepository, commentRepository, threadRepository }) {
    this._replyRepository = replyRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, threadId, commentId, owner) {
    const newReply = new NewReply({ ...useCasePayload, commentId, owner });

    await this._threadRepository.verifyAvailableThread(threadId);
    await this._commentRepository.verifyAvailableComment(commentId, threadId);
    return this._replyRepository.addReply(newReply);
  }
}

export default AddReplyUseCase;