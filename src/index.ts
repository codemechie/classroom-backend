import express from 'express';
import subjects from "./routes/subjects";
import cors from "cors";

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))
app.use(express.json());
app.use('/api/subjects', subjects)

app.get('/', (_req, res) => {
  res.send('Classroom Backend');
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
