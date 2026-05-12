import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { departments, subjects } from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  const deptIds = await db.insert(departments).values([
    { code: "CS", name: "Computer Science", description: "Computer Science Department" },
    { code: "MATH", name: "Mathematics", description: "Mathematics Department" },
    { code: "PHYS", name: "Physics", description: "Physics Department" },
    { code: "ENG", name: "English", description: "English Department" },
    { code: "BIO", name: "Biology", description: "Biology Department" },
  ]).returning({ id: departments.id, code: departments.code });

  const deptMap = Object.fromEntries(deptIds.map(d => [d.code, d.id]));

  await db.insert(subjects).values([
    { code: "CS101", name: "Introduction to Computer Science", departmentId: deptMap["CS"], description: "Fundamentals of computing" },
    { code: "CS201", name: "Data Structures", departmentId: deptMap["CS"], description: "Linear and non-linear data structures" },
    { code: "CS301", name: "Algorithms", departmentId: deptMap["CS"], description: "Design and analysis of algorithms" },
    { code: "MATH201", name: "Calculus II", departmentId: deptMap["MATH"], description: "Integral calculus and series" },
    { code: "MATH101", name: "Calculus I", departmentId: deptMap["MATH"], description: "Differential calculus" },
    { code: "PHYS150", name: "General Physics I", departmentId: deptMap["PHYS"], description: "Mechanics and thermodynamics" },
    { code: "ENG101", name: "English Composition", departmentId: deptMap["ENG"], description: "Academic writing" },
    { code: "BIO101", name: "Introduction to Biology", departmentId: deptMap["BIO"], description: "Cell biology and genetics" },
  ]);

  console.log("Seed data inserted successfully!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
