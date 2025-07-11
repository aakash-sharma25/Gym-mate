import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const user = requireAuth(request)

    const db = await getDatabase()
    const ordersCollection = db.collection("orders")
    const trackingCollection = db.collection("tracking_events")

    // Get order details
    const order = await ordersCollection
      .aggregate([
        { $match: { _id: new ObjectId(params.orderId), userId: user.id } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "items.product",
          },
        },
        { $unwind: "$items.product" },
        {
          $group: {
            _id: "$_id",
            userId: { $first: "$userId" },
            items: { $push: "$items" },
            totalAmount: { $first: "$totalAmount" },
            discountAmount: { $first: "$discountAmount" },
            couponCode: { $first: "$couponCode" },
            status: { $first: "$status" },
            shippingAddress: { $first: "$shippingAddress" },
            createdAt: { $first: "$createdAt" },
          },
        },
      ])
      .toArray()

    if (!order.length) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Order not found",
          statusCode: 404,
        },
        { status: 404 },
      )
    }

    // Get tracking events
    const trackingEvents = await trackingCollection.find({ orderId: params.orderId }).sort({ timestamp: -1 }).toArray()

    // Calculate estimated delivery date
    const orderDate = new Date(order[0].createdAt)
    const estimatedDate = new Date(orderDate)
    estimatedDate.setDate(orderDate.getDate() + 7) // 7 days from order

    const estimatedDelivery = estimatedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Get current location from latest tracking event
    const latestEvent = trackingEvents[0]
    const currentLocation = latestEvent?.location

    // Mock delivery agent data (in real app, this would come from database)
    const deliveryAgent =
      order[0].status === "shipped" || order[0].status === "delivered"
        ? {
            name: "John Smith",
            phone: "+1 (555) 123-4567",
            email: "john.smith@delivery.com",
          }
        : undefined

    const trackingData = {
      order: order[0],
      events: trackingEvents,
      estimatedDelivery,
      currentLocation,
      deliveryAgent,
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Tracking details fetched successfully",
      data: trackingData,
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

    console.error("Get tracking details error:", error)
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
