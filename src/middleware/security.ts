import {Request, Response, NextFunction} from 'express';
import aj from '../config/arcjet'
import {ArcjetNodeRequest, slidingWindow} from "@arcjet/node";
const securityMiddleware = async(req: Request, res: Response, next: NextFunction) => {
if(process.env.NODE_ENV == 'test' || process.env.NODE_ENV == 'development') return next();
try {
    const role: RateLimitRole = req.user?.role ?? 'guest';
    let limit: number;
    let message: string;

    switch(role) {
        case 'admin':
            limit=20;
            message = "Admin request limit exceeded (20 per minute)";
            break;
        case 'teacher':
        case "student":
            limit=10;
            message = "Teacher request limit exceeded";
            break;
        default:
            limit=5;
            message = "Guest limit exceeded";
            break;
    }
    const client = aj.withRule(
        slidingWindow({
            mode: "LIVE",
            interval: "1m",
            max: limit
        })
    )
    const arcjetRequest: ArcjetNodeRequest = {
        headers: req.headers,
        method: req.method,
        url: req.originalUrl ?? req.url,
        socket: {remoteAddress: req.socket.remoteAddress ?? req.ip ?? '0.0.0.0'}
    }
    const decision = await client.protect(arcjetRequest);
    if(decision.isDenied() && decision.reason.isBot()) {
        return res.status(403).json({error: 'Unauthorized', message: 'Automatic requests are not authorized'});
    }
    if(decision.isDenied() && decision.reason.isShield()) {
        return res.status(403).json({error: 'Unauthorized', message: 'Request blocked by security policy'});
    }
    if(decision.isDenied() && decision.reason.isRateLimit()) {
        return res.status(403).json({error: 'Unauthorized', message: 'Rate limit exceeded'});
    }
    if(decision.isDenied()) {
        return res.status(403).json({error: 'Unauthorized', message: 'Request denied by security policy'});
    }
    next();
} catch(e) {
    console.error("Arcjet middleware error",e);
    res.status(500).json({error: 'Internal Error', message: "Something went wrong"});
}
}

export default securityMiddleware;