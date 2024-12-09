import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
// export const usersTable = sqliteTable("users_table", {
//   id: int().primaryKey({ autoIncrement: true }),
//   name: text().notNull(),
//   age: int().notNull(),
//   email: text().notNull().unique(),
// });
export enum Device {
  DESKTOP = 0,
  TABLET = 1,
  MOBILE = 2,
}
export const interaction = sqliteTable("interaction", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: text("type").notNull(),
  time: int("time").notNull(),
  timestamp: int("timestamp").notNull(),
  route: text("route"),
  url: text("url").notNull(),
  uniqueInteractionId: text("unique_interaction_id").notNull(),
  interactionId: text("interactionId").notNull(),
  componentPath: text("component_path", { mode: "json" })
    .$type<Array<string>>()
    .notNull(),
  projectId: text("projectId"),
  session: text("session", { mode: "json" })
    .$type<{
      id: string;
      device: Device;
      agent: string;
      wifi: string;
      cpu: number;
      gpu: string | null;
      mem: number;
    }>()
    .notNull()

});

export const component = sqliteTable("component", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  uniqueInteractionId: text("uniqueInteractionId")
    .references(() => interaction.id)
    .notNull(),
  name: text("name").notNull(),
  renders: int("renders").notNull(),
  instances: int("instances").notNull(),
  totalTime: int("total_time"),
  selfTime: int("self_time"),
  interactionId: text("interactionId").notNull(),
});

export const replay = sqliteTable("replay", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  events: text("events", { mode: "json" }).$type<Array<any>>().notNull(),
});

export const interactionToReplay = sqliteTable("interaction_to_replay", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  interactionId: text("interactionId").notNull(),
  replayId: text("replayId").notNull(),
  startTime: int("timestamp").notNull(),
  endTime: int("timestamp").notNull(),
});
