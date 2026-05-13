import express from 'express';
import subjects from "./routes/subjects";
import cors from "cors";
import securityMiddleware from "./middleware/security";

const app = express();
const port = process.env.PORT || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) {
  throw new Error("FRONTEND_URL environment variable is required");
}

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))
app.use(express.json());
app.use(securityMiddleware)
app.use('/api/subjects', subjects)

app.get('/', (_req, res) => {
  res.send('Classroom Backend');
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
