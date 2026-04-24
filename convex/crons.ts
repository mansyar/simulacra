import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "world tick",
  { minutes: 1 },
  api.functions.world.tick,
);

export default crons;
