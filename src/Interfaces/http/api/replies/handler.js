import AddReplyUseCase from '../../../../Applications/use_case/AddReplyUseCase.js';
import DeleteReplyUseCase from '../../../../Applications/use_case/DeleteReplyUseCase.js';

class RepliesHandler {
  constructor(container) {
    this._container = container;

    this.postReplyHandler = this.postReplyHandler.bind(this);
    this.deleteReplyHandler = this.deleteReplyHandler.bind(this);
  }

  async postReplyHandler(req, res, next) {
    try {
      const addReplyUseCase = this._container.getInstance(AddReplyUseCase.name);
      const addedReply = await addReplyUseCase.execute(
        req.body,
        req.params.threadId,
        req.params.commentId,
        req.auth.credentials.id,
      );

      res.status(201).json({
        status: 'success',
        data: {
          addedReply,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReplyHandler(req, res, next) {
    try {
      const deleteReplyUseCase = this._container.getInstance(DeleteReplyUseCase.name);
      await deleteReplyUseCase.execute({
        threadId: req.params.threadId,
        commentId: req.params.commentId,
        replyId: req.params.replyId,
        owner: req.auth.credentials.id,
      });

      res.json({
        status: 'success',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default RepliesHandler;
