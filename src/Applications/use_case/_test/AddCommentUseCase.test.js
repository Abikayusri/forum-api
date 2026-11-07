import { vi } from 'vitest';
import NewComment from '../../../Domains/comments/entities/NewComment.js';
import AddedComment from '../../../Domains/comments/entities/AddedComment.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import AddCommentUseCase from '../AddCommentUseCase.js';

describe('AddCommentUseCase', () => {
  it('should orchestrate the add comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      content: 'sebuah comment',
    };
    const threadId = 'thread-123';
    const owner = 'user-123';

    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyAvailableThread = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.addComment = vi.fn()
      .mockImplementation(() => Promise.resolve(new AddedComment({
        id: 'comment-123',
        content: 'sebuah comment',
        owner: 'user-123',
      })));

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedComment = await addCommentUseCase.execute(useCasePayload, threadId, owner);

    // Assert
    expect(addedComment).toStrictEqual(new AddedComment({
      id: 'comment-123',
      content: 'sebuah comment',
      owner: 'user-123',
    }));
    expect(mockThreadRepository.verifyAvailableThread).toBeCalledWith('thread-123');
    expect(mockCommentRepository.addComment).toBeCalledWith(new NewComment({
      content: 'sebuah comment',
      threadId: 'thread-123',
      owner: 'user-123',
    }));
  });

  it('should not add comment when thread is not available', async () => {
    // Arrange
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyAvailableThread = vi.fn()
      .mockImplementation(() => Promise.reject(new Error('thread tidak ditemukan')));
    mockCommentRepository.addComment = vi.fn();

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(addCommentUseCase.execute({ content: 'sebuah comment' }, 'thread-xxx', 'user-123'))
      .rejects.toThrowError('thread tidak ditemukan');
    expect(mockThreadRepository.verifyAvailableThread).toBeCalledWith('thread-xxx');
    expect(mockCommentRepository.addComment).not.toBeCalled();
  });
});
