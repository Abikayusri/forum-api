import { vi } from 'vitest';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ReplyRepository from '../../../Domains/replies/ReplyRepository.js';
import DetailThread from '../../../Domains/threads/entities/DetailThread.js';
import DetailComment from '../../../Domains/comments/entities/DetailComment.js';
import DetailReply from '../../../Domains/replies/entities/DetailReply.js';
import GetThreadDetailUseCase from '../GetThreadDetailUseCase.js';

describe('GetThreadDetailUseCase', () => {
  it('should orchestrate the get thread detail action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.getThreadById = vi.fn()
      .mockImplementation(() => Promise.resolve({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
      }));
    mockCommentRepository.getCommentsByThreadId = vi.fn()
      .mockImplementation(() => Promise.resolve([
        {
          id: 'comment-123',
          username: 'johndoe',
          date: '2021-08-08T07:22:33.555Z',
          content: 'sebuah comment',
          isDelete: false,
        },
        {
          id: 'comment-456',
          username: 'dicoding',
          date: '2021-08-08T07:26:21.338Z',
          content: 'komentar rahasia',
          isDelete: true,
        },
      ]));
    mockReplyRepository.getRepliesByThreadId = vi.fn()
      .mockImplementation(() => Promise.resolve([
        {
          id: 'reply-123',
          commentId: 'comment-123',
          content: 'balasan rahasia',
          date: '2021-08-08T07:59:48.766Z',
          username: 'johndoe',
          isDelete: true,
        },
        {
          id: 'reply-456',
          commentId: 'comment-123',
          content: 'sebuah balasan',
          date: '2021-08-08T08:07:01.522Z',
          username: 'dicoding',
          isDelete: false,
        },
      ]));

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    const detailThread = await getThreadDetailUseCase.execute(threadId);

    // Assert
    expect(detailThread).toStrictEqual(new DetailThread({
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        new DetailComment({
          id: 'comment-123',
          username: 'johndoe',
          date: '2021-08-08T07:22:33.555Z',
          content: 'sebuah comment',
          isDelete: false,
          replies: [
            new DetailReply({
              id: 'reply-123',
              content: 'balasan rahasia',
              date: '2021-08-08T07:59:48.766Z',
              username: 'johndoe',
              isDelete: true,
            }),
            new DetailReply({
              id: 'reply-456',
              content: 'sebuah balasan',
              date: '2021-08-08T08:07:01.522Z',
              username: 'dicoding',
              isDelete: false,
            }),
          ],
        }),
        new DetailComment({
          id: 'comment-456',
          username: 'dicoding',
          date: '2021-08-08T07:26:21.338Z',
          content: 'komentar rahasia',
          isDelete: true,
          replies: [],
        }),
      ],
    }));
    expect(detailThread.comments[0].replies[0].content).toEqual('**balasan telah dihapus**');
    expect(detailThread.comments[1].content).toEqual('**komentar telah dihapus**');
    expect(mockThreadRepository.getThreadById).toBeCalledWith('thread-123');
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith('thread-123');
    expect(mockReplyRepository.getRepliesByThreadId).toBeCalledWith('thread-123');
  });

  it('should not get comments when thread is not found', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.getThreadById = vi.fn()
      .mockImplementation(() => Promise.reject(new Error('thread tidak ditemukan')));
    mockCommentRepository.getCommentsByThreadId = vi.fn();
    mockReplyRepository.getRepliesByThreadId = vi.fn();

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action & Assert
    await expect(getThreadDetailUseCase.execute('thread-xxx')).rejects.toThrowError('thread tidak ditemukan');
    expect(mockThreadRepository.getThreadById).toBeCalledWith('thread-xxx');
    expect(mockCommentRepository.getCommentsByThreadId).not.toBeCalled();
    expect(mockReplyRepository.getRepliesByThreadId).not.toBeCalled();
  });
});
