import { Prisma } from "@prisma/client";
import { z } from "zod";

import { procedure, router } from "../../trpc";
import { addSkill, deleteSkill } from "./userSkillsProcedures";
import { addTeamMember, deleteTeamMember } from "./userTeamMembersProcedure";

export const userRouter = router({
  all: procedure.query(async ({ ctx }) => {
    return await ctx.prisma.user.findMany({
      include: {
        positions: true,
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
            "Search querry cannot be longer than 50 characters. Please shorten the search query and try again.",
          ),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.searchQuery === "") return [];
      const result = await ctx.prisma.user.findMany({
        where: {
          name: {
            contains: input.searchQuery,
            mode: "insensitive",
          },
        },
      });
      const excludedLoggedUser = result.filter(
        (user) => user.id !== ctx.session?.user.id,
      );
      return excludedLoggedUser;
    }),
  filter: procedure
    .input(
      z.object({
        searchQuery: z
          .string()
          .max(
            50,
            "Search querry cannot be longer than 50 characters. Please shorten the search query and try again.",
          ),
        page: z.number(),
        perPage: z.number(),
        occupancy: z.array(z.enum(["FULL", "PART", "NOT"])),
        skills: z.array(
          z.object({
            name: z
              .string()
              .max(
                50,
                "Skill name cannot be longer than 50 characters. Please shorten the skill name and try again.",
              ),
            ratingRange: z.array(z.number()).min(0).max(2),
          }),
        ),
        projects: z.array(
          z
            .string()
            .max(
              50,
              "Project name cannot be longer than 50 characters. Please shorten the project name and try again.",
            ),
        ),
        managers: z.array(
          z
            .string()
            .max(
              50,
              "Manager name cannot be longer than 50 characters. Please shorten the manager name and try again.",
            ),
        ),
        positions: z.array(
          z
            .string()
            .max(
              50,
              "Position name cannot be longer than 50 characters. Please shorten the position name and try again.",
            ),
        ),
        ratingRange: z
          .array(z.number())
          .refine(
            (arr) =>
              arr.length === 2
                ? arr.every((num) => num >= 5 && num <= 100)
                : arr.length === 0,
            {
              message:
                "Array must contain exactly 2 numbers between 5 and 100, or be empty",
            },
          ),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skipPages = input.perPage * (input.page - 1);
      const where: Prisma.UserWhereInput = {
        occupancy: {
          in:
            input.occupancy.length > 0
              ? input.occupancy
              : ["FULL", "PART", "NOT"],
        },
        // ...(input.skills.length > 0 && {
        //   skills: {
        //     some: {
        //       AND: input.skills.map((skill) => {
        //         return {
        //           name: skill.name,
        //           rating: {
        //             gte: skill.ratingRange[0],
        //             // lte: skill.ratingRange[1],
        //           },
        //         };
        //       }),
        //     },
        //   },
        // }),
        ...(input.projects.length > 0 && {
          projects: {
            some: {
              name: {
                in: input.projects,
              },
            },
          },
        }),
        ...(input.managers.length > 0 && {
          managers: {
            some: {
              name: {
                in: input.managers,
              },
            },
          },
        }),
        ...(input.positions.length > 0 && {
          positions: {
            some: {
              name: {
                in: input.positions,
              },
            },
          },
        }),
        AND: input.skills.map((skill) => ({
          skills: {
            some: {
              name: skill.name,
              rating: {
                gte: skill.ratingRange[0],
              },
            },
          },
        })),

        OR: [
          {
            name: {
              contains: input.searchQuery,
              mode: "insensitive",
            },
          },
          {
            skills: {
              some: {
                name: {
                  contains: input.searchQuery,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            positions: {
              some: {
                name: {
                  contains: input.searchQuery,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            projects: {
              some: {
                name: {
                  contains: input.searchQuery,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      };

      const include: Prisma.UserInclude = {
        positions: true,
      };
      const [users, totalUsers] = await ctx.prisma.$transaction([
        ctx.prisma.user.findMany({
          skip: skipPages,
          take: input.perPage,
          where,
          include,
          orderBy: {
            name: "asc",
          },
        }),

        ctx.prisma.user.findMany({
          where,
          include,
        }),
      ]);

      return {
        users,
        pagination: {
          currentPage: input.page,
          perPage: input.perPage,
          totalPages: Math.ceil(totalUsers.length / input.perPage),
        },
      };
    }),
  getById: procedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user.findFirst({
        where: {
          id: input.userId,
        },
        include: {
          positions: {
            orderBy: {
              name: "asc",
            },
          },
          managers: {
            orderBy: {
              name: "asc",
            },
          },
          members: {
            orderBy: {
              name: "asc",
            },
          },
          skills: {
            orderBy: {
              name: "asc",
            },
          },
          projects: {
            orderBy: {
              startDate: "desc",
            },
          },
        },
      });
    }),
  getLoggedUser: procedure.query(async ({ ctx }) => {
    return await ctx.prisma.user.findFirst({
      where: {
        id: ctx.session?.user.id,
      },
      include: {
        positions: {
          orderBy: {
            name: "asc",
          },
        },
        managers: {
          orderBy: {
            name: "asc",
          },
        },
        members: {
          orderBy: {
            name: "asc",
          },
        },
        skills: {
          orderBy: {
            name: "asc",
          },
        },
        projects: {
          orderBy: {
            startDate: "desc",
          },
        },
      },
    });
  }),
  userInfo: procedure
    .input(
      z.object({
        phone: z
          .string()
          .length(
            9,
            "Please ensure it is 9 digits long and follows the format 0xxxxxxxx.",
          )
          .regex(
            new RegExp("[0-9]{9}"),
            "Please ensure it is 9 digits long and follows the format 0xxxxxxxx.",
          ),
        employmentDate: z.date().nullable(),
        occupancy: z.enum(["FULL", "PART", "NOT"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const phone = await ctx.prisma.user.update({
        where: {
          id: ctx.session?.user.id,
        },
        data: {
          phone: input.phone,
          employmentDate: input.employmentDate,
          occupancy: input.occupancy,
        },
      });
      return phone;
    }),

  addSkill,
  deleteSkill,
  // getSkills: procedure.query(async ({ ctx }) => {
  //   const user = await ctx.prisma.user.findFirst({
  //     where: {
  //       id: ctx.session?.user?.id,
  //     },
  //   });

  //   if (!user) throw new Error("This user does not exist");

  //   return await ctx.prisma.userSkill.findMany({
  //     where: {
  //       user: {
  //         id: user.id,
  //       },
  //     },
  //     orderBy: {
  //       createdAt: "asc",
  //     },
  //   });
  // }),
  // getTopSkills: procedure.query(async ({ ctx }) => {
  //   // @ts-ignore
  //   if (!ctx.session?.user?.id) return;

  //   const topSkills = await ctx.prisma.userSkill.findMany({
  //     where: {
  //       user: {
  //         // @ts-ignore
  //         id: ctx.session.user.id,
  //       },
  //     },
  //     take: 3,
  //     orderBy: {
  //       rating: "desc",
  //     },
  //   });

  //   return topSkills;
  // }),
  updateRating: procedure
    .input(
      z.object({ skillId: z.number(), rating: z.number().min(5).max(100) }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedSkill = await ctx.prisma.userSkill.update({
        where: {
          id: input.skillId,
          userId: ctx.session?.user?.id,
        },
        data: {
          rating: input.rating,
        },
      });

      return updatedSkill;
    }),

  addPosition: procedure
    .input(
      z.object({
        name: z
          .string()
          .max(
            50,
            "Position name cannot be longer than 50 characters. Please shorten the position name and try again.",
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const position = await ctx.prisma.position.findUnique({
        where: {
          name: input.name,
        },
      });
      if (!position) return;
      const userPosition = await ctx.prisma.userPosition.create({
        data: {
          positionId: position.id,
          userId: ctx.session?.user.id,
          name: position.name,
        },
      });
      const userPositions = await ctx.prisma.user.update({
        where: {
          id: ctx.session?.user.id,
        },
        data: {
          positions: {
            connect: {
              id: userPosition.id,
            },
          },
        },
      });
      return userPositions;
    }),

  deletePosition: procedure
    .input(z.object({ userPositionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const deletedPosition = await ctx.prisma.userPosition.delete({
        where: {
          id: input.userPositionId,
        },
      });
      const userWithPosition = await ctx.prisma.user.findFirst({
        where: {
          positions: {
            some: {
              positionId: deletedPosition.positionId,
            },
          },
        },
      });

      if (!userWithPosition && deletedPosition.positionId) {
        await ctx.prisma.position.delete({
          where: {
            id: deletedPosition.positionId,
          },
        });
      }
      return deletedPosition;
    }),

  addManager: procedure
    .input(
      z.object({
        name: z
          .string()
          .max(
            50,
            "Manager name cannot be longer than 50 characters. Please shorten the manager name and try again.",
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          name: input.name,
        },
      });

      if (!user) return;

      await ctx.prisma.user.update({
        where: {
          id: ctx.session?.user.id,
        },
        data: {
          managers: {
            connect: {
              id: user.id,
            },
          },
        },
      });
    }),
  deleteManager: procedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          id: input.userId,
        },
      });

      if (!user) return;

      await ctx.prisma.user.update({
        where: {
          id: ctx.session?.user.id,
        },
        data: {
          managers: {
            disconnect: {
              id: user.id,
            },
          },
        },
      });
    }),
  addTeamMember,
  deleteTeamMember,
  getUserManagers: procedure.query(async ({ ctx }) => {
    return await ctx.prisma.user.findFirst({
      where: {
        id: ctx.session?.user.id,
      },
      select: {
        managers: true,
      },
    });
  }),
  getAllManagers: procedure.query(async ({ ctx }) => {
    return await ctx.prisma.user.findMany({
      where: {
        members: {
          some: {},
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }),
  deleteProject: procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const deleteUserProject = await ctx.prisma.userProject.delete({
        where: {
          id: input.id,
        },
      });

      const userWithProject = await ctx.prisma.user.findFirst({
        where: {
          projects: {
            some: {
              projectId: deleteUserProject.projectId,
            },
          },
        },
      });

      if (!userWithProject && deleteUserProject.projectId) {
        await ctx.prisma.project.delete({
          where: {
            id: deleteUserProject.projectId,
          },
        });
      }
      return deleteUserProject;
    }),
});
