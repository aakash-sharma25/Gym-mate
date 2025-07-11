import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireRole } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireRole(request, ["admin"])

    const { code, discount, influencerName, isActive } = await request.json()

    const db = await getDatabase()
    const couponsCollection = db.collection("coupons")

    // Check if coupon code already exists (excluding current coupon)
    const existingCoupon = await couponsCollection.findOne({
      code: code.toUpperCase(),
      _id: { $ne: new ObjectId(params.id) },
    })

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

    const result = await couponsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          code: code.toUpperCase(),
          discount: Number.parseFloat(discount),
          influencerName,
          isActive,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Coupon not found",
          statusCode: 404,
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Coupon updated successfully",
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

    console.error("Update coupon error:", error)
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireRole(request, ["admin"])

    const db = await getDatabase()
    const couponsCollection = db.collection("coupons")

    const result = await couponsCollection.deleteOne({
      _id: new ObjectId(params.id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Coupon not found",
          statusCode: 404,
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Coupon deleted successfully",
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

    console.error("Delete coupon error:", error)
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
