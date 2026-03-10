import { Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisRateLimit from "../config/ratelimitRedis.js";


const ipRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many requests from this IP. Please try again after 15 minutes.",
    },
    store: new RedisStore({
        sendCommand: (...args: string[]) => (redisRateLimit as any).sendCommand(args),
        prefix: "ratelimit:ip:",
    }),
    keyGenerator: (req: Request): string => {
        return req.ip ?? req.socket.remoteAddress ?? "unknown";
    },
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
    store: new RedisStore({
        sendCommand: (...args: string[]) => (redisRateLimit as any).sendCommand(args),
        prefix: "ratelimit:user:",
    }),
    keyGenerator: (req: Request): string => {
        return (req as any).userId ?? req.ip ?? "unknown";
    },
    skip: (req: Request): boolean => {
        return !(req as any).userId;
    },
});

export { ipRateLimiter, userRateLimiter };