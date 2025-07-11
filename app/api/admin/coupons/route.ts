import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireRole } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, ["admin"])

    const db = await getDatabase()
    const couponsCollection = db.collection("coupons")

    const coupons = await couponsCollection.find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Coupons fetched successfully",
      data: coupons,
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

    console.error("Get coupons error:", error)
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

export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, ["admin"])

    const { code, discount, influencerName, isActive } = await request.json()

    if (!code || !discount || !influencerName) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Code, discount, and influencer name are required",
          statusCode: 400,
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const couponsCollection = db.collection("coupons")

    // Check if coupon code already exists
    const existingCoupon = await couponsCollection.findOne({ code: code.toUpperCase() })
    if (existingCoupon) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Coupon code already exists",
          statusCode: 409,
        },
        { status: 409 },
      )
    }

    const result = await couponsCollection.insertOne({
      code: code.toUpperCase(),
      discount: Number.parseFloat(discount),
      influencerName,
      isActive: isActive !== false,
      usageCount: 0,
      createdAt: new Date(),
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Coupon created successfully",
        data: { id: result.insertedId },
        statusCode: 201,
      },
      { status: 201 },
    )
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

    console.error("Create coupon error:", error)
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
