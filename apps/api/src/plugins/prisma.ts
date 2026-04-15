// Elysia plugin that decorates requests with the shared Prisma client.
import { Elysia } from "elysia";
import { prisma } from "@podkaap/db";

export const prismaPlugin = new Elysia({ name: "prisma" }).decorate("prisma", prisma);
