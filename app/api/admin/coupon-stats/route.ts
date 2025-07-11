import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireRole } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, ["admin"])

    const db = await getDatabase()
    const ordersCollection = db.collection("orders")
    const couponsCollection = db.collection("coupons")

    // Get coupon usage statistics
    const couponStats = await ordersCollection
      .aggregate([
        {
          $match: {
            couponCode: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: "$couponCode",
            usageCount: { $sum: 1 },
            totalSales: { $sum: "$totalAmount" },
          },
        },
      ])
      .toArray()

    // Get all coupons and merge with stats
    const allCoupons = await couponsCollection.find({}).toArray()

    const couponStatsWithDetails = allCoupons.map((coupon) => {
      const stats = couponStats.find((stat) => stat._id === coupon.code)
      return {
        _id: coupon._id,
        code: coupon.code,
        influencerName: coupon.influencerName,
        discount: coupon.discount,
        isActive: coupon.isActive,
        usageCount: stats?.usageCount || 0,
        totalSales: stats?.totalSales || 0,
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Coupon statistics fetched successfully",
      data: couponStatsWithDetails,
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

    console.error("Get coupon stats error:", error)
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
