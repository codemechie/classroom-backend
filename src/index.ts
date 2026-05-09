import express from 'express';

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Classroom Backend');
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
