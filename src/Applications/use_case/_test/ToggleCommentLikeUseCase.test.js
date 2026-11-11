import { vi } from 'vitest';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import LikeRepository from '../../../Domains/likes/LikeRepository.js';
import ToggleCommentLikeUseCase from '../ToggleCommentLikeUseCase.js';

describe('ToggleCommentLikeUseCase', () => {
  const useCasePayload = {
    threadId: 'thread-123',
    commentId: 'comment-123',
    owner: 'user-123',
  };

  const createUseCase = (isLiked) => {
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockLikeRepository = new LikeRepository();

    mockThreadRepository.verifyAvailableThread = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyAvailableComment = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockLikeRepository.isCommentLiked = vi.fn()
      .mockImplementation(() => Promise.resolve(isLiked));
    mockLikeRepository.addLike = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockLikeRepository.deleteLike = vi.fn()
      .mockImplementation(() => Promise.resolve());

    const useCase = new ToggleCommentLikeUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      likeRepository: mockLikeRepository,
    });

    return {
      useCase, mockThreadRepository, mockCommentRepository, mockLikeRepository,
    };
  };

  it('should add like when comment is not liked yet', async () => {
    // Arrange
    const {
      useCase, mockThreadRepository, mockCommentRepository, mockLikeRepository,
    } = createUseCase(false);

    // Action
    await useCase.execute(useCasePayload);

    // Assert
    expect(mockThreadRepository.verifyAvailableThread).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyAvailableComment).toBeCalledWith('comment-123', 'thread-123');
    expect(mockLikeRepository.isCommentLiked).toBeCalledWith('comment-123', 'user-123');
    expect(mockLikeRepository.addLike).toBeCalledWith('comment-123', 'user-123');
    expect(mockLikeRepository.deleteLike).not.toBeCalled();
  });

  it('should delete like when comment is already liked', async () => {
    // Arrange
    const { useCase, mockLikeRepository } = createUseCase(true);

    // Action
    await useCase.execute(useCasePayload);

    // Assert
    expect(mockLikeRepository.isCommentLiked).toBeCalledWith('comment-123', 'user-123');
    expect(mockLikeRepository.deleteLike).toBeCalledWith('comment-123', 'user-123');
    expect(mockLikeRepository.addLike).not.toBeCalled();
  });

  it('should not touch likes when comment is not found', async () => {
    // Arrange
    const { useCase, mockCommentRepository, mockLikeRepository } = createUseCase(false);
    mockCommentRepository.verifyAvailableComment = vi.fn()
      .mockImplementation(() => Promise.reject(new Error('komentar tidak ditemukan')));

    // Action & Assert
    await expect(useCase.execute(useCasePayload)).rejects.toThrowError('komentar tidak ditemukan');
    expect(mockLikeRepository.isCommentLiked).not.toBeCalled();
    expect(mockLikeRepository.addLike).not.toBeCalled();
    expect(mockLikeRepository.deleteLike).not.toBeCalled();
  });
});
