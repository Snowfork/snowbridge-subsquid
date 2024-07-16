import "dotenv/config"
import cron from "node-cron"
import { postProcess } from "./index"

cron.schedule("*/30 * * * *", postProcess)
