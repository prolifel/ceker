import { createDomain, createDomains, getAllDomains, getDomainByDomain } from "@/lib/repo/domain"
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

        // Handle multiple domains (array)
        if ("domains" in req && Array.isArray(req.domains)) {
            if (req.domains.length === 0) {
                return NextResponse.json({
                    message: "bad request, domains array is empty",
                    data: null
                }, {
                    status: 400
                })
            }

            const res = await createDomains(req.domains)

            if (res.failed.length > 0) {
                return NextResponse.json({
                    message: "partial success",
                    data: {
                        failed: res.failed
                    }
                }, {
                    status: 207  // Multi-Status for partial success
                })
            }

            return NextResponse.json({
                message: "success",
                data: {
                    failed: []
                }
            }, {
                status: 201
            })
        }

        // Handle single domain (backward compatibility)
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
            message: "bad request, domain or domains is required",
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