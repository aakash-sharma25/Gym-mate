import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireRole } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, ["admin"])

    const db = await getDatabase()
    const productsCollection = db.collection("products")
    const usersCollection = db.collection("users")
    const ordersCollection = db.collection("orders")
    const couponsCollection = db.collection("coupons")

    // Get dashboard statistics
    const [totalProducts, totalUsers, totalOrders, totalRevenue, activeCoupons] = await Promise.all([
      productsCollection.countDocuments(),
      usersCollection.countDocuments({ role: "user" }),
      ordersCollection.countDocuments(),
      ordersCollection
        .aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: "$totalAmount" },
            },
          },
        ])
        .toArray(),
      couponsCollection.countDocuments({ isActive: true }),
    ])

    // Get recent orders (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentOrders = await ordersCollection.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    })

    const stats = {
      totalProducts,
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentOrders,
      activeCoupons,
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Dashboard stats fetched successfully",
      data: stats,
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

    if (error instanceof Error && error.message === "Insufficient permissions") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Insufficient permissions",
          statusCode: 403,
        },
        { status: 403 },
      )
    }

    console.error("Get dashboard stats error:", error)
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
