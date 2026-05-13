import express from "express";
import {and, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";
import {subjects, departments} from "../db/schema";
import {db} from "../db";
const router = express.Router();
const MAX_LIMIT = 100;

router.get("/", async (req, res) => {
    try {
        const {search, department, page: pageRaw, limit: limitRaw} = req.query;
        const parsedPage = parseInt(pageRaw as string, 10);
        const parsedLimit = parseInt(limitRaw as string, 10);
        const currentPage = Math.max(1, isFinite(parsedPage) ? parsedPage : 1);
        const limitPerPage = Math.min(MAX_LIMIT, Math.max(1, isFinite(parsedLimit) ? parsedLimit : 10));

        const offset = (currentPage - 1) * limitPerPage;
        const filterConditions = []
        if (search) {
            filterConditions.push(
                or(
                    ilike(subjects.name, `%${search}%`),
                    ilike(subjects.code, `%${search}%`),
                )
            );
        }
        if (department) {
            filterConditions.push(ilike(departments.name, `%${department}%`));
        }
        const whereClause = filterConditions.length > 0 ? and(...filterConditions): undefined;
        const countResult = await db
            .select({count: sql<number>`count(*)`})
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)

        const totalCount = countResult[0]?.count ?? 0;

        const subjectsList = await db.select({
            ...getTableColumns(subjects),
            department: {...getTableColumns(departments)},
        }).from(subjects).leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause).
            orderBy(desc(subjects.createdAt)).
            offset(offset).
            limit(limitPerPage)
        res.status(200).json({
            data: subjectsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        })
    } catch (e) {
        console.error("GET /subjects error:", e);
        res.status(500).json({error: "Failed to get resource"})
    }
})

export default router;