import express from "express";
import {and, desc, eq, ilike, or, sql} from "drizzle-orm";
import {user} from "../db/schema";
import {db} from "../db";
const router = express.Router();
const MAX_LIMIT = 100;

router.get("/", async (req, res) => {
    try {
        const {search, role, page: pageRaw, limit: limitRaw} = req.query;
        const parsedPage = parseInt(pageRaw as string, 10);
        const parsedLimit = parseInt(limitRaw as string, 10);
        const currentPage = Math.max(1, isFinite(parsedPage) ? parsedPage : 1);
        const limitPerPage = Math.min(MAX_LIMIT, Math.max(1, isFinite(parsedLimit) ? parsedLimit : 10));

        const offset = (currentPage - 1) * limitPerPage;
        const filterConditions = []
        if (search) {
            filterConditions.push(
                or(
                    ilike(user.name, `%${search}%`),
                    ilike(user.email, `%${search}%`),
                )
            );
        }
        if (role) {
            filterConditions.push(eq(user.role, role as "student" | "teacher" | "admin"));
        }
        const whereClause = filterConditions.length > 0 ? and(...filterConditions): undefined;
        const countResult = await db
            .select({count: sql<number>`count(*)`})
            .from(user)
            .where(whereClause)

        const totalCount = countResult[0]?.count ?? 0;

        const usersList = await db.select()
            .from(user)
            .where(whereClause).
            orderBy(desc(user.createdAt)).
            offset(offset).
            limit(limitPerPage)
        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        })
    } catch (e) {
        console.error("GET /users error:", e);
        res.status(500).json({error: "Failed to get resource"})
    }
})

export default router;
