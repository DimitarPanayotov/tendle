import { createD1Stores, type D1Database } from "../adapters/d1Stores";
import { createApp } from "./app";
import { settleYesterday } from "./settle";

/** The bindings the Worker reads: the D1 database and the public address of the game. */
export interface WorkerEnv {
  DB: D1Database;
  PUBLIC_URL?: string;
}

/** The part of the execution context the Worker uses. */
export interface WorkerContext {
  waitUntil(promise: Promise<unknown>): void;
}

/** The part of a scheduled event the Worker uses. */
export interface ScheduledController {
  scheduledTime: number;
}

export default {
  async fetch(request: Request, env: WorkerEnv, _ctx: WorkerContext): Promise<Response> {
    const app = createApp({ stores: createD1Stores(env.DB), shareLink: env.PUBLIC_URL });
    return app.fetch(request);
  },
  async scheduled(controller: ScheduledController, env: WorkerEnv, ctx: WorkerContext): Promise<void> {
    ctx.waitUntil(settleYesterday(createD1Stores(env.DB), new Date(controller.scheduledTime)));
  },
};
