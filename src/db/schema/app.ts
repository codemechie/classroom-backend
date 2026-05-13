import {index, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, varchar} from "drizzle-orm/pg-core";
import {relations} from "drizzle-orm";
import {user} from "./auth";

const timestamps = {
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}

export const classStatus = pgEnum('class_status', ['active', 'inactive', 'archived']);

export const departments = pgTable('departments', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    code: varchar('code', {length: 50}).notNull().unique(),
    name: varchar('name', {length: 50}).notNull(),
    description: varchar('description', {length: 50}),
        ...timestamps
})

export const subjects = pgTable('subjects', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    code: varchar('code', {length: 50}).notNull().unique(),
    departmentId: integer('department_id').notNull().references(() => departments.id, {onDelete: 'restrict'}),
    name: varchar('name', {length: 255}).notNull(),
    description: varchar('description', {length: 255}),
        ...timestamps
}, (table) => ({
    uniqueDepartmentName: unique('uq_subjects_department_name').on(table.departmentId, table.name),
    departmentIdIdx: index('idx_subjects_department_id').on(table.departmentId),
}))

export type Schedule = {
    day: string;
    startTime: string;
    endTime: string;
    room?: string;
};

export const classes = pgTable('classes', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    subjectId: integer('subject_id').notNull().references(() => subjects.id, {onDelete: 'cascade'}),
    teacherId: text('teacher_id').notNull().references(() => user.id, {onDelete: 'restrict'}),
    inviteCode: varchar('invite_code', {length: 255}).notNull().unique(),
    name: varchar('name', {length: 255}).notNull(),
    bannerCldPubId: text('banner_cld_pub_id'),
    bannerUrl: text('banner_url'),
    description: text('description'),
    capacity: integer('capacity').default(50),
    status: classStatus('status').default('active'),
    schedules: jsonb('schedules').$type<Schedule[]>(),
    ...timestamps
}, (table) => ({
    subjectIdIdx: index('idx_classes_subject_id').on(table.subjectId),
    teacherIdIdx: index('idx_classes_teacher_id').on(table.teacherId),
}))

export const enrollments = pgTable('enrollments', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    studentId: text('student_id').notNull().references(() => user.id, {onDelete: 'cascade'}),
    classId: integer('class_id').notNull().references(() => classes.id, {onDelete: 'cascade'}),
    ...timestamps
}, (table) => ({
    uniqueStudentClass: unique('uq_enrollments_student_class').on(table.studentId, table.classId),
    studentIdIdx: index('idx_enrollments_student_id').on(table.studentId),
    classIdIdx: index('idx_enrollments_class_id').on(table.classId),
}))

export const departmentRelations = relations(departments, ({many}) => ({
    subjects: many(subjects)
}));
export const subjectsRelations = relations(subjects, ({one, many}) => ({
    department: one(departments, {
    fields: [subjects.departmentId],
        references: [departments.id]
    }),
    classes: many(classes),
}));

export const classesRelations = relations(classes, ({one, many}) => ({
    subject: one(subjects, {
        fields: [classes.subjectId],
        references: [subjects.id],
    }),
    teacher: one(user, {
        fields: [classes.teacherId],
        references: [user.id],
    }),
    enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({one}) => ({
    student: one(user, {
        fields: [enrollments.studentId],
        references: [user.id],
    }),
    class: one(classes, {
        fields: [enrollments.classId],
        references: [classes.id],
    }),
}));

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;

export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
