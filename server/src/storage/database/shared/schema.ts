import { pgTable, serial, timestamp, varchar, text, boolean, integer, index, uniqueIndex } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 用户表
export const users = pgTable(
	"users",
	{
		id: serial().primaryKey(),
		nickname: varchar("nickname", { length: 50 }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
);

// MVV 提交表
export const mvvSubmissions = pgTable(
	"mvv_submissions",
	{
		id: serial().primaryKey(),
		userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
		type: varchar("type", { length: 20 }).notNull(), // 'mission' | 'vision' | 'values'
		content: text("content").notNull(),
		isAnonymous: boolean("is_anonymous").default(false).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("mvv_submissions_user_id_idx").on(table.userId),
		index("mvv_submissions_type_idx").on(table.type),
		index("mvv_submissions_created_at_idx").on(table.createdAt),
	]
);

// 投票表
export const mvvVotes = pgTable(
	"mvv_votes",
	{
		id: serial().primaryKey(),
		submissionId: integer("submission_id").notNull().references(() => mvvSubmissions.id, { onDelete: "cascade" }),
		userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("mvv_votes_submission_id_idx").on(table.submissionId),
		index("mvv_votes_user_id_idx").on(table.userId),
		uniqueIndex("mvv_votes_submission_user_unique").on(table.submissionId, table.userId),
	]
);
