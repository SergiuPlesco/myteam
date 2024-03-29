import { Prisma } from "@prisma/client";
import { z } from "zod";

import { procedure, router } from "../trpc";

export const projectRouter = router({
  create: procedure
    .input(
      z.object({
        name: z
          .string()
          .min(1, "Project name is required.")
          .max(
            50,
            "Project name cannot be longer than 50 characters. Please shorten the project name and try again."
          ),
        description: z
          .string()
          .max(
            350,
            "Project description cannot be longer than 350 characters. Please shorten the project description and try again."
          ),
        startDate: z.date(),
        endDate: z.date().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const newProject = await ctx.prisma.project.upsert({
          where: {
            name: input.name,
          },
          create: {
            name: input.name,
          },
          update: {},
        });

        await ctx.prisma.userProject.create({
          data: {
            projectId: newProject.id,
            name: newProject.name,
            userId: ctx.session!.user.id,
            description: input.description,
            startDate: input.startDate,
            endDate: input.endDate,
          },
        });
        return newProject;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // "Unique constraint failed on the {constraint}"
          // https://www.prisma.io/docs/orm/reference/error-reference#p2002
          if (error.code === "P2002") {
            throw {
              ...error,
              message: `${input.name} is already added.`,
            };
          } else {
            throw error;
          }
        }
      }
    }),
  all: procedure.query(async ({ ctx }) => {
    return await ctx.prisma.project.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }),
  search: procedure
    .input(
      z.object({
        searchQuery: z
          .string()
          .max(
            50,
            "Search querry cannot be longer than 50 characters. Please shorten the search query and try again."
          ),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.searchQuery === "") return [];
      return await ctx.prisma.project.findMany({
        where: {
          name: {
            contains: input.searchQuery,
            mode: "insensitive",
          },
        },
      });
    }),
  getById: procedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.userProject.findFirst({
        where: {
          projectId: input.id,
          userId: ctx.session?.user.id,
        },
        include: {
          project: true,
        },
      });
    }),
  update: procedure
    .input(
      z.object({
        userProjectId: z.number(),
        description: z
          .string()
          .max(
            350,
            "Project description cannot be longer than 350 characters. Please shorten the project description and try again."
          ),
        startDate: z.date(),
        endDate: z.date().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.userProject.update({
        where: {
          id: input.userProjectId,
          userId: ctx.session?.user.id,
        },
        data: {
          description: input.description,
          startDate: input.startDate,
          endDate: input.endDate,
        },
      });
    }),
});
