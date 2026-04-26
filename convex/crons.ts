import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Get tick interval from environment (default: 180 seconds / 3 minutes)
const tickIntervalMinutes = parseInt(process.env.WORLD_TICK_INTERVAL || "180") / 60;

crons.interval(
  "world tick",
  { minutes: tickIntervalMinutes },
  api.functions.world.tick,
  { skipSleep: false }
);

export default crons;
