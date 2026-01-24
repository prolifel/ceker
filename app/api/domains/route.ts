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
        const req = await request.json()
        if ("domain" in req) {
            const res = await createDomain(req.domain)
            if (!res.ok) {
                if (res.error == "DUPLICATE_DOMAIN") {
                    return NextResponse.json({
                        message: "domain already exist",
                        data: null
                    }, {
                        status: 400
                    })
                }

                return NextResponse.json({
                    message: "internal server error",
                    data: null
                }, {
                    status: 500
                })
            }

            return NextResponse.json({
                message: "success",
                data: res.data
            }, {
                status: 201
            })
        }

        return NextResponse.json({
            message: "bad request, domain is required",
            data: null
        }, {
            status: 400
        })

    } catch (error: any) {
        console.error(error)
        return NextResponse.json({
            message: "Internal server error",
            data: null
        }, {
            status: 500
        })
    }
}