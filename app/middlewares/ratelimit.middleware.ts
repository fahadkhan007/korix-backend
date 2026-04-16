import { Request } from "express";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisRateLimit from "../config/ratelimitRedis.js";

const makeRedisStore = (prefix: string) =>
    new RedisStore({
        sendCommand: (...args: string[]) => (redisRateLimit as any).sendCommand(args),
        prefix,
    });


const ipRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many requests from this IP. Please try again after 15 minutes.",
    },
    store: makeRedisStore("ratelimit:ip:"),
});

const userRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many requests. Please slow down.",
    },
    store: makeRedisStore("ratelimit:user:"),
    keyGenerator: (req: Request): string => {
        return (req as any).userId || "unknown";
    },
    skip: (req: Request): boolean => {
        return !(req as any).userId;
    },
});

export { ipRateLimiter, userRateLimiter };