import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireRole } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const user = requireRole(request, ["admin", "delivery"])
    const { status, message, location } = await request.json()

    if (!status || !message) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Status and message are required",
          statusCode: 400,
        },
        { status: 400 },
      )
    }

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Invalid status",
          statusCode: 400,
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const ordersCollection = db.collection("orders")
    const trackingCollection = db.collection("tracking_events")

    // Update order status
    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(params.orderId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Order not found",
          statusCode: 404,
        },
        { status: 404 },
      )
    }

    // Add tracking event
    await trackingCollection.insertOne({
      orderId: params.orderId,
      status,
      message,
      location: location || null,
      timestamp: new Date(),
      updatedBy: user.name,
      updatedByRole: user.role,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Order status updated successfully",
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

    console.error("Update order status error:", error)
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
