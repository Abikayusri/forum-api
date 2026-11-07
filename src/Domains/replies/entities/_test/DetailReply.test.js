import DetailReply from '../DetailReply.js';

describe('a DetailReply entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah balasan',
      date: '2021-08-08T07:59:48.766Z',
      username: 'johndoe',
    };

    // Action and Assert
    expect(() => new DetailReply(payload)).toThrowError('DETAIL_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah balasan',
      date: '2021-08-08T07:59:48.766Z',
      username: 123,
      isDelete: false,
    };

    // Action and Assert
    expect(() => new DetailReply(payload)).toThrowError('DETAIL_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create detailReply object with original content when not deleted', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah balasan',
      date: '2021-08-08T07:59:48.766Z',
      username: 'johndoe',
      isDelete: false,
    };

    // Action
    const detailReply = new DetailReply(payload);

    // Assert
    expect(detailReply.id).toEqual('reply-123');
    expect(detailReply.content).toEqual('sebuah balasan');
    expect(detailReply.date).toEqual('2021-08-08T07:59:48.766Z');
    expect(detailReply.username).toEqual('johndoe');
    expect(Object.keys(detailReply)).toEqual(['id', 'content', 'date', 'username']);
  });

  it('should replace content when reply is deleted', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah balasan',
      date: '2021-08-08T07:59:48.766Z',
      username: 'johndoe',
      isDelete: true,
    };

    // Action
    const detailReply = new DetailReply(payload);

    // Assert
    expect(detailReply.content).toEqual('**balasan telah dihapus**');
  });
});
