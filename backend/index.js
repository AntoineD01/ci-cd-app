import express from 'express';

const app = express();
const PORT = 5000;

app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.get('/', (req, res) => {
  res.send('Welcome to the Backend API!');
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
