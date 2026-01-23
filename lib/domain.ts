import { prisma } from "./prisma"

export async function getDomains(query: string | null) {
    return await prisma.domain.findFirst(
        query ? { where: { domain: query } } : undefined
    )
}