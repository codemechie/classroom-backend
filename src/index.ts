import express from 'express';
import subjects from "./routes/subjects";
import users from "./routes/users";
import classes from "./routes/classes";
import cors from "cors";
import securityMiddleware from "./middleware/security";
import {toNodeHandler} from "better-auth/node";
import {auth} from "./lib/auth";
import AgentAPI from "apminsight";
AgentAPI.config()

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
app.all('/api/auth/*splat', toNodeHandler(auth));
app.use('/api/subjects', subjects)
app.use('/api/users', users)
app.use('/api/classes', classes)

app.get('/', (_req, res) => {
  res.send('Classroom Backend');
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
