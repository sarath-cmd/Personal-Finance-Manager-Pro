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
