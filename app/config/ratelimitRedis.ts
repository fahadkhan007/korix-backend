import redisClient from "../database/redis.js";

const redisRateLimit = redisClient.duplicate();

const connectRedisRateLimit = async () => {
    await redisRateLimit.connect();
    redisRateLimit.select(2);
    console.log("rate limit redis connected at db index: 2 successfully!");
};

export { connectRedisRateLimit };
export default redisRateLimit;