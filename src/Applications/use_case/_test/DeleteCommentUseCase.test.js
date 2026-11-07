import { vi } from 'vitest';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import DeleteCommentUseCase from '../DeleteCommentUseCase.js';

describe('DeleteCommentUseCase', () => {
  it('should orchestrate the delete comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyAvailableThread = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyAvailableComment = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentOwner = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.deleteComment = vi.fn()
      .mockImplementation(() => Promise.resolve());

    const deleteCommentUseCase = new DeleteCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    await deleteCommentUseCase.execute(useCasePayload);

    // Assert
    expect(mockThreadRepository.verifyAvailableThread).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyAvailableComment).toBeCalledWith('comment-123', 'thread-123');
    expect(mockCommentRepository.verifyCommentOwner).toBeCalledWith('comment-123', 'user-123');
    expect(mockCommentRepository.deleteComment).toBeCalledWith('comment-123');
  });

  it('should not delete comment when user is not the owner', async () => {
    // Arrange
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyAvailableThread = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyAvailableComment = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentOwner = vi.fn()
      .mockImplementation(() => Promise.reject(new Error('anda tidak berhak menghapus komentar ini')));
    mockCommentRepository.deleteComment = vi.fn();

    const deleteCommentUseCase = new DeleteCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(deleteCommentUseCase.execute({
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-456',
    })).rejects.toThrowError('anda tidak berhak menghapus komentar ini');
    expect(mockCommentRepository.verifyCommentOwner).toBeCalledWith('comment-123', 'user-456');
    expect(mockCommentRepository.deleteComment).not.toBeCalled();
  });
});
