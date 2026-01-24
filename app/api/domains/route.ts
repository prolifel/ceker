import { createDomain, getAllDomains, getDomainByDomain } from "@/lib/repo/domain"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get('q')

    let res
    if (q == null || q === '') {
        res = await getAllDomains()
    } else {
        res = await getDomainByDomain(q)
    }

    return NextResponse.json({
        message: res === null ? "domain not found" : "success",
        data: res
    }, {
        status: res === null ? 404 : 200
    })
}

export async function POST(request: NextRequest) {
    try {
        const json = await request.json()
        const domain = await createDomain(json.domain)
        return NextResponse.json(domain)
    } catch (error: any) {
        console.error(error)
        return NextResponse.json({
            message: "Internal server error"
        }, {
            status: 500
        })
    }
}