import express from "express";
import {db} from '../db'
import {classes, subjects, user, type Schedule} from "../db/schema";
import {z} from "zod";
import crypto from "crypto"
import {and, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";

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
const MAX_LIMIT = 100;

router.get("/", async (req, res) => {
    try {
        const {search, subject, teacher, page: pageRaw, limit: limitRaw} = req.query;
        const parsedPage = parseInt(pageRaw as string, 10);
        const parsedLimit = parseInt(limitRaw as string, 10);
        const currentPage = Math.max(1, isFinite(parsedPage) ? parsedPage : 1);
        const limitPerPage = Math.min(MAX_LIMIT, Math.max(1, isFinite(parsedLimit) ? parsedLimit : 10));

        const offset = (currentPage - 1) * limitPerPage;
        const filterConditions = []
        if (search) {
            filterConditions.push(
                or(
                    ilike(classes.name, `%${search}%`),
                    ilike(classes.inviteCode, `%${search}%`),
                )
            );
        }
        if (subject) {
            filterConditions.push(ilike(subjects.name, `%${subject}%`));
        }
        if (teacher) {
            filterConditions.push(ilike(user.name, `%${teacher}%`));
        }
        const whereClause = filterConditions.length > 0 ? and(...filterConditions): undefined;
        const countResult = await db
            .select({count: sql<number>`count(*)`})
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause)

        const totalCount = countResult[0]?.count ?? 0;

        const classesList = await db.select({
            ...getTableColumns(classes),
            subject: {...getTableColumns(subjects)},
            teacher: {...getTableColumns(user)},
        }).from(classes).leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause).
            orderBy(desc(classes.createdAt)).
            offset(offset).
            limit(limitPerPage)
        res.status(200).json({
            data: classesList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        })
    } catch (e) {
        console.error("GET /classes error:", e);
        res.status(500).json({error: "Failed to get resource"})
    }
})

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
