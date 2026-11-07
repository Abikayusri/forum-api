/* istanbul ignore file */
import request from 'supertest';

const ServerTestHelper = {
  async getAccessToken(app, {
    username = 'dicoding', password = 'secret', fullname = 'Dicoding Indonesia',
  } = {}) {
    await request(app).post('/users').send({ username, password, fullname });
    const response = await request(app).post('/authentications').send({ username, password });
    return response.body.data.accessToken;
  },
};

export default ServerTestHelper;
