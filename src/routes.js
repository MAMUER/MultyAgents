const express = require('express');
const router = express.Router();
const db = require('./db');

const CODE_RE = /^[A-Za-z0-9]{6}$/;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { // NOSONAR
    // invalid URL input
    return false;
  }
}

router.post('/shorten', (req, res) => {
  try {
    const { url } = req.body || {};
    if (typeof url !== 'string' || url.trim() === '') {
      return res.status(400).json({ error: 'url is required and must be a string' });
    }
    if (url.length > 2048) {
      return res.status(400).json({ error: 'url must be <= 2048 characters' });
    }
    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'url must be a valid http/https URL' });
    }

    let code = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateCode();
      try {
        db.prepare('INSERT INTO urls (shortCode, originalUrl) VALUES (?, ?)').run(candidate, url);
        code = candidate;
        break;
      } catch (e) {
        if (e && (String(e.code || '').includes('CONSTRAINT') || /UNIQUE/i.test(String(e.message || '')))) continue;
        throw e;
      }
    }
    if (!code) {
      return res.status(500).json({ error: 'failed to generate unique short code' });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    return res.status(201).json({
      shortCode: code,
      shortUrl: `${baseUrl}/${code}`,
      originalUrl: url,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

router.get('/stats/:code', (req, res) => {
  try {
    const { code } = req.params;
    if (!CODE_RE.test(code)) {
      return res.status(400).json({ error: 'invalid code format' });
    }
    const row = db.prepare('SELECT shortCode, originalUrl, clicks, createdAt FROM urls WHERE shortCode = ?').get(code);
    if (!row) return res.status(404).json({ error: 'not found' });
    return res.status(200).json({
      shortCode: row.shortCode,
      originalUrl: row.originalUrl,
      clicks: row.clicks,
      createdAt: row.createdAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

router.get('/:code', (req, res) => {
  try {
    const { code } = req.params;
    if (!CODE_RE.test(code)) {
      return res.status(404).json({ error: 'not found' });
    }
    const row = db.prepare('SELECT originalUrl FROM urls WHERE shortCode = ?').get(code);
    if (!row) return res.status(404).json({ error: 'not found' });
    db.prepare('UPDATE urls SET clicks = clicks + 1 WHERE shortCode = ?').run(code);
    return res.redirect(302, row.originalUrl);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

module.exports = router;
