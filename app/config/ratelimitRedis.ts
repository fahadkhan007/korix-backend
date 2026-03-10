import redisClient from "../database/redis.js";

const redisRateLimit = redisClient.duplicate();

// Start connection immediately to allow command buffering
const connectionPromise = redisRateLimit.connect().then(() => {
    return redisRateLimit.select(2);
}).then(() => {
    console.log("rate limit redis connected at db index: 2 successfully!");
}).catch((err) => {
    console.error("Rate limit redis connection error:", err);
});

const connectRedisRateLimit = async () => {
    await connectionPromise;
};

export { connectRedisRateLimit };
export default redisRateLimit;