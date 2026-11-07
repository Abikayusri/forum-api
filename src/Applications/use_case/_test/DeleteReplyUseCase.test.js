import { vi } from 'vitest';
import ReplyRepository from '../../../Domains/replies/ReplyRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import DeleteReplyUseCase from '../DeleteReplyUseCase.js';

describe('DeleteReplyUseCase', () => {
  const createMocks = () => {
    const mockReplyRepository = new ReplyRepository();
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyAvailableThread = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyAvailableComment = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.verifyAvailableReply = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.verifyReplyOwner = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.deleteReply = vi.fn()
      .mockImplementation(() => Promise.resolve());

    return { mockReplyRepository, mockCommentRepository, mockThreadRepository };
  };

  it('should orchestrate the delete reply action correctly', async () => {
    // Arrange
    const { mockReplyRepository, mockCommentRepository, mockThreadRepository } = createMocks();
    const deleteReplyUseCase = new DeleteReplyUseCase({
      replyRepository: mockReplyRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    await deleteReplyUseCase.execute({
      threadId: 'thread-123',
      commentId: 'comment-123',
      replyId: 'reply-123',
      owner: 'user-123',
    });

    // Assert
    expect(mockThreadRepository.verifyAvailableThread).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyAvailableComment).toBeCalledWith('comment-123', 'thread-123');
    expect(mockReplyRepository.verifyAvailableReply).toBeCalledWith('reply-123', 'comment-123');
    expect(mockReplyRepository.verifyReplyOwner).toBeCalledWith('reply-123', 'user-123');
    expect(mockReplyRepository.deleteReply).toBeCalledWith('reply-123');
  });

  it('should not delete reply when user is not the owner', async () => {
    // Arrange
    const { mockReplyRepository, mockCommentRepository, mockThreadRepository } = createMocks();
    mockReplyRepository.verifyReplyOwner = vi.fn()
      .mockImplementation(() => Promise.reject(new Error('anda tidak berhak menghapus balasan ini')));
    const deleteReplyUseCase = new DeleteReplyUseCase({
      replyRepository: mockReplyRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(deleteReplyUseCase.execute({
      threadId: 'thread-123',
      commentId: 'comment-123',
      replyId: 'reply-123',
      owner: 'user-456',
    })).rejects.toThrowError('anda tidak berhak menghapus balasan ini');
    expect(mockReplyRepository.verifyReplyOwner).toBeCalledWith('reply-123', 'user-456');
    expect(mockReplyRepository.deleteReply).not.toBeCalled();
  });
});
