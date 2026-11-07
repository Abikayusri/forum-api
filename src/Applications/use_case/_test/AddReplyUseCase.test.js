import { vi } from 'vitest';
import NewReply from '../../../Domains/replies/entities/NewReply.js';
import AddedReply from '../../../Domains/replies/entities/AddedReply.js';
import ReplyRepository from '../../../Domains/replies/ReplyRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import AddReplyUseCase from '../AddReplyUseCase.js';

describe('AddReplyUseCase', () => {
  it('should orchestrate the add reply action correctly', async () => {
    // Arrange
    const mockReplyRepository = new ReplyRepository();
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyAvailableThread = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyAvailableComment = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.addReply = vi.fn()
      .mockImplementation(() => Promise.resolve(new AddedReply({
        id: 'reply-123',
        content: 'sebuah balasan',
        owner: 'user-123',
      })));

    const addReplyUseCase = new AddReplyUseCase({
      replyRepository: mockReplyRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedReply = await addReplyUseCase.execute(
      { content: 'sebuah balasan' },
      'thread-123',
      'comment-123',
      'user-123',
    );

    // Assert
    expect(addedReply).toStrictEqual(new AddedReply({
      id: 'reply-123',
      content: 'sebuah balasan',
      owner: 'user-123',
    }));
    expect(mockThreadRepository.verifyAvailableThread).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyAvailableComment).toBeCalledWith('comment-123', 'thread-123');
    expect(mockReplyRepository.addReply).toBeCalledWith(new NewReply({
      content: 'sebuah balasan',
      commentId: 'comment-123',
      owner: 'user-123',
    }));
  });

  it('should not add reply when comment is not available', async () => {
    // Arrange
    const mockReplyRepository = new ReplyRepository();
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyAvailableThread = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyAvailableComment = vi.fn()
      .mockImplementation(() => Promise.reject(new Error('komentar tidak ditemukan')));
    mockReplyRepository.addReply = vi.fn();

    const addReplyUseCase = new AddReplyUseCase({
      replyRepository: mockReplyRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(addReplyUseCase.execute({ content: 'sebuah balasan' }, 'thread-123', 'comment-xxx', 'user-123'))
      .rejects.toThrowError('komentar tidak ditemukan');
    expect(mockCommentRepository.verifyAvailableComment).toBeCalledWith('comment-xxx', 'thread-123');
    expect(mockReplyRepository.addReply).not.toBeCalled();
  });
});
