import { Prisma } from "@prisma/client";
import { z } from "zod";

import { procedure, router } from "../trpc";

export const skillsRouter = router({
  create: procedure
    .input(
      z.object({
        name: z
          .string()
          .max(
            50,
            "Skill name cannot be longer than 50 characters. Please shorten the skill name and try again."
          ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const newSkill = await ctx.prisma.skill.upsert({
          where: {
            name: input.name.trim(),
          },
          create: {
            name: input.name.trim(),
          },
          update: {},
        });
        const newUserSkill = await ctx.prisma.userSkill.create({
          data: {
            skillId: newSkill.id,
            userId: ctx.session?.user.id as string,
            rating: 5,
            name: newSkill.name,
            createdAt: new Date(),
          },
        });

        return newUserSkill;
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
    return await ctx.prisma.skill.findMany({
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
      if (input.searchQuery == "") return [];
      return await ctx.prisma.skill.findMany({
        where: {
          name: {
            contains: input.searchQuery,
            mode: "insensitive",
          },
        },
      });
    }),
  delete: procedure
    .input(z.object({ skillId: z.number(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.skill.delete({
          where: {
            id: input.skillId,
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // "Foreign key constraint failed on the field: {field_name}"
          // https://www.prisma.io/docs/orm/reference/error-reference#p2003
          if (error.code === "P2003") {
            throw {
              ...error,
              message: `${input.name} is used and can't be deleted.`,
            };
          } else {
            throw error;
          }
        }
      }
    }),
});
