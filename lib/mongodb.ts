import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

export function dbConnect(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local.");
  }

  if (!global._mongooseConn) {
    global._mongooseConn = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      // Keep a small pool of warm connections open instead of reconnecting
      // per request — this is what actually makes repeat queries fast.
      maxPoolSize: 10,
      minPoolSize: 2,
      // Fail fast instead of hanging for the 30s Mongo default when Atlas
      // is unreachable (e.g. an IP whitelist issue) — a quick, clear error
      // beats a slow page that looks "stuck".
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 20000,
      // Skip the IPv6-then-IPv4 happy-eyeballs dance, which adds latency
      // on some Windows networks for no benefit against Atlas.
      family: 4,
      autoIndex: process.env.NODE_ENV !== "production",
    });
    // If the connection attempt fails, don't leave the rejected promise
    // cached — every future request would just re-await the same failure
    // forever (until the server restarts). Clearing it lets the next call
    // retry fresh instead of being permanently stuck after one bad blip.
    global._mongooseConn.catch(() => {
      global._mongooseConn = undefined;
    });
  }

  return global._mongooseConn;
}
