const express = require('express');
const cors = require('cors');
const path = require('node:path');
const routes = require('./routes');

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 3000;

app.use(cors()); // NOSONAR: public API
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// api routes
app.use('/', routes);

// error middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'internal server error' });
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
