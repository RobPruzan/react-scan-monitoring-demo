import { Elysia, t } from "elysia";
import { db } from "./db";
import {
  component,
  interaction,
  interactionToReplay,
  replay,
} from "./db/schema";
import { desc, eq, gte, lte, and, inArray } from "drizzle-orm";
import cors from "@elysiajs/cors";

interface PerformanceMetrics {
  poor: (typeof interaction.$inferSelect)[];
  needsImprovement: (typeof interaction.$inferSelect)[];
  great: (typeof interaction.$inferSelect)[];
}

function aggregateInteractionsByPerformance(
  interactions: (typeof interaction.$inferSelect)[]
): PerformanceMetrics {
  return interactions.reduce<PerformanceMetrics>(
    (acc, interaction) => {
      if (interaction.time > 500) {
        acc.poor.push(interaction);
      } else if (interaction.time > 200) {
        acc.needsImprovement.push(interaction);
      } else {
        acc.great.push(interaction);
      }
      return acc;
    },
    { poor: [], needsImprovement: [], great: [] }
  );
}

const app = new Elysia()
  .use(
    cors({
      origin: "*",
    })
  )

  .get("/components/:interactionId", async ({ params: { interactionId } }) => {
    const aggregatedComponents = await db
      .select()
      .from(component)
      .where(eq(component.interactionId, interactionId));
    return aggregatedComponents;
  })
  .get("/replay/:interactionId", async ({ params: { interactionId } }) => {
    const replayMeta = await db
      .select()
      .from(interactionToReplay)
      .where(eq(interactionToReplay.interactionId, interactionId))
      .orderBy(desc(interactionToReplay.endTime))
      .limit(1)
      .then((data) => data.at(0) ?? null);

    if (!replayMeta) {
      return null;
    }

    const replayRecord = await db
      .select()
      .from(replay)
      .where(eq(replay.id, replayMeta.replayId))
      .then((data) => data[0]);

    return replayRecord;
  })
  .get(
    "/stats-timeline",
    async ({ query }) => {
      const interactions = await db
        .select()
        .from(interaction)
        .where(
          and(
            gte(interaction.timestamp, query.from),
            lte(interaction.timestamp, query.to)
          )
        );

      const hourBuckets = new Map<number, typeof interactions>();

      interactions.forEach((interaction) => {
        const hourBucket =
          Math.floor(interaction.timestamp / (60 * 60 * 1000)) *
          (60 * 60 * 1000);

        if (!hourBuckets.get(hourBucket)) {
          hourBuckets.set(hourBucket, []);
        }

        hourBuckets.get(hourBucket)?.push(interaction);
      });

      const timelineStats = Array.from(hourBuckets.entries())
        .map(([timestamp, interactions]) => {
          const metrics = aggregateInteractionsByPerformance(interactions);
          return {
            timestamp,
            poor: metrics.poor.length,
            needsImprovement: metrics.needsImprovement.length,
            great: metrics.great.length,
            stats: {
              totalInteractions: interactions.length,
              averageTime:
                interactions.reduce((acc, i) => acc + i.time, 0) /
                interactions.length,
              medianTime: interactions.sort((a, b) => a.time - b.time)[
                Math.floor(interactions.length / 2)
              ]?.time,
            },
          };
        })
        .sort((a, b) => a.timestamp - b.timestamp);

      return timelineStats;
    },
    {
      query: t.Object({
        from: t.Number(), // timestamp in ms
        to: t.Number(), // timestamp in ms
        resolution: t.Optional(t.String({ default: "1h" })), // future support for different time buckets
      }),
    }
  )

  .get("/replay/interactions-collected", async () => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

    const replayedInteractions = await db
      .select({
        interactionId: interactionToReplay.interactionId,
      })
      .from(interactionToReplay)
      .where(gte(interactionToReplay.endTime, oneDayAgo))
      .groupBy(interactionToReplay.interactionId);

    return replayedInteractions.map((r) => r.interactionId);
  })

  .post(
    "/replay",
    async ({ body }) => {
      console.log("replay", body.events.length);
      if (body.events.length < 10) {
        return;
      }
      console.log("interactions", body.interactionIds);

      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      const existingReplays = await db
        .select({
          interactionId: interactionToReplay.interactionId,
        })
        .from(interactionToReplay)
        .where(
          and(
            gte(interactionToReplay.endTime, oneDayAgo),
            inArray(interactionToReplay.interactionId, body.interactionIds)
          )
        );

      const existingReplayIds = new Set(
        existingReplays.map((r) => r.interactionId)
      );
      const interactionsNeedingReplay = body.interactionIds.filter(
        (id) => !existingReplayIds.has(id)
      );

      if (interactionsNeedingReplay.length === 0) {
        return;
      }

      const replayRecord = await db
        .insert(replay)
        .values({
          events: body.events,
        })
        .returning()
        .then((data) => data[0]);

      await Promise.all(
        interactionsNeedingReplay.map((interactionId) =>
          db.insert(interactionToReplay).values({
            replayId: replayRecord.id,
            interactionId,
            startTime: body.startTime,
            endTime: body.endTime,
          })
        )
      );
    },
    {
      body: t.Object({
        events: t.Array(t.Any()),
        interactionIds: t.Array(t.String()),
        startTime: t.Number(),
        endTime: t.Number(),
      }),
    }
  )
  .get("/interactions", async () => {
    const interactions = await db.select().from(interaction);

    const interactionGroups = interactions.reduce<
      Record<string, (typeof interaction.$inferSelect)[]>
    >((acc, interaction) => {
      if (!acc[interaction.interactionId]) {
        acc[interaction.interactionId] = [];
      }
      acc[interaction.interactionId].push(interaction);
      return acc;
    }, {});

    const aggregatedInteractions = Object.entries(interactionGroups).map(
      ([interactionId, groupedInteractions]) => {
        const baseInteraction = groupedInteractions[0];

        const totalTime = groupedInteractions.reduce(
          (sum, i) => sum + i.time,
          0
        );
        const avgTime = totalTime / groupedInteractions.length;

        const aggregated = {
          ...baseInteraction,
          time: avgTime, 
        };

        return {
          interactionId,
          ...aggregateInteractionsByPerformance([aggregated]),
          stats: {
            totalInteractions: groupedInteractions.length,
            averageTime: avgTime,
            medianTime:
              groupedInteractions.sort((a, b) => a.time - b.time)[
                Math.floor(groupedInteractions.length / 2)
              ]?.time ?? 0,
          },
        };
      }
    );

    return aggregatedInteractions;
  })
  .post(
    "/ingest",
    async ({ body }) => {
      // console.log("got ingest", body);
      if (!body.interactions.length) {
        return;
      }
      if (!body.components.length) {
        return;
      }

      console.log(
        "got interaction",
        body.interactions.map((x) => ({
          path: x.componentPath,
          name: x.name,
          time: x.time,
        }))
      );

      await Promise.all([
        db.insert(interaction).values(
          body.interactions.map((interaction) => ({
            ...interaction,
            session: body.session,
          }))
        ), // todo, normalize
        db.insert(component).values(body.components),
      ]);

      // await db.insert(int)
    },
    {
      body: t.Object({
        interactions: t.Array(
          t.Object({
            // id: t.String(),
            name: t.String(),
            type: t.String(),
            time: t.Number(),
            timestamp: t.Number(),
            route: t.Union([t.String(), t.Null()]),
            url: t.String(),
            projectId: t.Optional(t.String()),
            sessionId: t.Optional(t.String()),
            uniqueInteractionId: t.String(),
            componentPath: t.Array(t.String()),
            interactionId: t.String(),
            // session: t.Any(),
          })
        ),
        components: t.Array(
          t.Object({
            uniqueInteractionId: t.String(),
            name: t.String(),
            renders: t.Number(),
            instances: t.Number(),
            totalTime: t.Optional(t.Number()),
            selfTime: t.Optional(t.Number()),
            interactionId: t.String(),
          })
        ),
        session: t.Object({
          id: t.String(),
          device: t.Numeric(),
          agent: t.String(),
          wifi: t.String(),
          cpu: t.Number(),
          gpu: t.Union([t.String(), t.Null()]),
          mem: t.Number(),
        }),
      }),
    }
  )
  .listen(8080);

console.log("listening on port:", app.server?.port);

export type App = typeof app;

export type { Elysia } from "elysia";

// Add your exports here
export const VERSION = "1.0.50";
