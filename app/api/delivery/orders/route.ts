import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireRole } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, ["delivery", "admin"])

    const db = await getDatabase()
    const ordersCollection = db.collection("orders")

    // Get orders that are not delivered or cancelled
    const orders = await ordersCollection
      .find({
        status: { $nin: ["delivered", "cancelled"] },
      })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
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

    console.error("Get delivery orders error:", error)
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
