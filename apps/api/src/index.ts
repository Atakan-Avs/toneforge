import app from "./app";
import { env } from "./config/env";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "apps/api/.env") });


app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
});