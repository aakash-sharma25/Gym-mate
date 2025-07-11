import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Coupon code is required",
          statusCode: 400,
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const couponsCollection = db.collection("coupons")

    const coupon = await couponsCollection.findOne({
      code: code.toUpperCase(),
      isActive: true,
    })

    if (!coupon) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Invalid coupon code",
          statusCode: 404,
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Coupon is valid",
      data: {
        code: coupon.code,
        discount: coupon.discount,
        influencerName: coupon.influencerName,
      },
      statusCode: 200,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Authentication required",
          statusCode: 511,
        },
        { status: 511 },
      )
    }

    console.error("Validate coupon error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Internal server error",
        statusCode: 500,
      },
      { status: 500 },
    )
  }
}
