import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get('q')
    const domains = await prisma.domain.findMany(
        q ? { where: { domain: q } } : undefined
    )
    return NextResponse.json(domains)
}

export async function POST(request: NextRequest) {
    try {
        const json = await request.json()
        const domain = await prisma.domain.create({
            data: json
        })
        return NextResponse.json(domain)
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return NextResponse.json({
                    message: "Domain already exist!"
                }, {
                    status: 409
                })
            }
        }

        console.error(error)
        return NextResponse.json({
            message: "Internal server error"
        }, {
            status: 500
        })
    }
}