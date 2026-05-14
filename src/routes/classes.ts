import express from "express";
import {db} from '../db'
import {classes, type Schedule} from "../db/schema";
import {z} from "zod";
import crypto from "crypto"
import {eq} from "drizzle-orm";

const scheduleSchema = z.object({
    day: z.string().min(1),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    room: z.string().optional(),
});

const createClassSchema = z.object({
    name: z.string().min(1).max(255),
    teacherId: z.string().min(1),
    subjectId: z.number().int().positive(),
    description: z.string().optional(),
    capacity: z.number().int().positive().optional(),
    schedules: z.array(scheduleSchema).optional(),
    bannerUrl: z.string().url().optional(),
    bannerCldPubId: z.string().optional(),
});

const generateInviteCode = ():string => {
    return crypto.randomBytes(5).toString("base64url").substring(0,9);
}


const router = express.Router();

router.post('/', async(req, res) => {
    try {
        const parsed = createClassSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({error: parsed.error.format()});
            return;
        }
        let inviteCode: string;
        let attempts = 0;
        const MAX_ATTEMPTS = 5;
        do {
            inviteCode = generateInviteCode();
            const existing = await db.select().from(classes).where(eq(classes.inviteCode, inviteCode)).limit(1)
            if(existing.length === 0) break;
            attempts++;
        } while (attempts < MAX_ATTEMPTS);
        if (attempts >= MAX_ATTEMPTS) {
            throw new Error(`Failed to generate unique invite code: ${attempts} attempts`);
        }
        const schedules = (parsed.data.schedules ?? []) as Schedule[];
        const [createdClass] = await db
            .insert(classes)
            .values({...parsed.data, inviteCode, schedules})
            .returning({id: classes.id});
        if (!createdClass) throw Error;
        res.status(201).json({data: createdClass});
    } catch(e) {
        console.error("POST /classes error:", e);
        res.status(500).json({error: "Failed to create class"});
    }
})

export default router;
