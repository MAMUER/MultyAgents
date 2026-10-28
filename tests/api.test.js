const request = require('supertest');
const app = require('../src/server');
const db = require('../src/db');

beforeEach(() => {
  db.prepare('DELETE FROM urls').run();
});

describe('URL Shortener API', () => {
  test('POST /shorten with valid url returns 201 with shortCode, shortUrl, originalUrl', async () => {
    const url = 'https://example.com/some/path';
    const res = await request(app).post('/shorten').send({ url }).expect(201);
    expect(res.body).toHaveProperty('shortCode');
    expect(res.body.shortCode).toMatch(/^[A-Za-z0-9]{6}$/);
    expect(res.body).toHaveProperty('shortUrl');
    expect(res.body.shortUrl).toContain(res.body.shortCode);
    expect(res.body.originalUrl).toBe(url);
  });

  test('GET /:code redirects (302) to original URL', async () => {
    const url = 'https://example.com/redirect-target';
    const create = await request(app).post('/shorten').send({ url }).expect(201);
    const code = create.body.shortCode;
    const res = await request(app).get(`/${code}`).redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(url);
  });

  test('POST /shorten with invalid url returns 400', async () => {
    const res = await request(app).post('/shorten').send({ url: 'not-a-url' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /stats/:code returns stats', async () => {
    const url = 'https://example.com/stats';
    const create = await request(app).post('/shorten').send({ url }).expect(201);
    const code = create.body.shortCode;
    await request(app).get(`/${code}`).redirects(0);
    const res = await request(app).get(`/stats/${code}`).expect(200);
    expect(res.body.shortCode).toBe(code);
    expect(res.body.originalUrl).toBe(url);
    expect(res.body.clicks).toBe(1);
    expect(res.body).toHaveProperty('createdAt');
  });

  test('GET /:code unknown returns 404', async () => {
    const res = await request(app).get('/ZZZZZZ');
    expect(res.status).toBe(404);
  });
});
