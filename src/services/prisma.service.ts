import { PrismaClient } from "@prisma/client";

export class PrismaService {
    public static readonly prisma: PrismaClient = new PrismaClient()
}