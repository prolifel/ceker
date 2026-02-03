import { createTLD, createTLDs, getAllTLDs, getTLD } from "@/lib/repo/tld"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get('q')

    let res
    if (q == null || q === '') {
        res = await getAllTLDs()
    } else {
        res = await getTLD(q)
    }

    return NextResponse.json({
        message: res === null ? "tld not found" : "success",
        data: res
    }, {
        status: res === null ? 404 : 200
    })
}

export async function POST(request: NextRequest) {
    try {
        const req = await request.json()

        // Handle multiple TLDs (array)
        if ("tlds" in req && Array.isArray(req.tlds)) {
            if (req.tlds.length === 0) {
                return NextResponse.json({
                    message: "bad request, tlds array is empty",
                    data: null
                }, {
                    status: 400
                })
            }

            const res = await createTLDs(req.tlds)

            if (res.duplicates > 0) {
                return NextResponse.json({
                    message: "partial success",
                    data: {
                        inserted: res.inserted,
                        duplicates: res.duplicates
                    }
                }, {
                    status: 207  // Multi-Status for partial success
                })
            }

            return NextResponse.json({
                message: "success",
                data: {
                    inserted: res.inserted,
                    duplicates: 0
                }
            }, {
                status: 201
            })
        }

        // Handle single TLD (backward compatibility)
        if ("tld" in req) {
            const res = await createTLD(req.tld)
            if (!res.ok) {
                if (res.error == "DUPLICATE_TLD") {
                    return NextResponse.json({
                        message: "tld already exist",
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
            message: "bad request, tld or tlds is required",
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
