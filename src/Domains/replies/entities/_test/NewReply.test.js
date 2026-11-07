import NewReply from '../NewReply.js';

describe('a NewReply entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      commentId: 'comment-123',
      owner: 'user-123',
    };

    // Action and Assert
    expect(() => new NewReply(payload)).toThrowError('NEW_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      content: 123,
      commentId: 'comment-123',
      owner: 'user-123',
    };

    // Action and Assert
    expect(() => new NewReply(payload)).toThrowError('NEW_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create newReply object correctly', () => {
    // Arrange
    const payload = {
      content: 'sebuah balasan',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    // Action
    const { content, commentId, owner } = new NewReply(payload);

    // Assert
    expect(content).toEqual(payload.content);
    expect(commentId).toEqual(payload.commentId);
    expect(owner).toEqual(payload.owner);
  });
});
