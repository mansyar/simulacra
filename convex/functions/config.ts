import { query, internalQuery } from "../_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("config").first();
  },
});

export const getInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("config").first();
  },
});
