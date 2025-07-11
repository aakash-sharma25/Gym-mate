import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)

    const db = await getDatabase()
    const ordersCollection = db.collection("orders")

    const orders = await ordersCollection.find({ userId: user.id }).sort({ createdAt: -1 }).toArray()

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

    console.error("Get orders error:", error)
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
    const user = requireAuth(request)
    const { shippingAddress, couponCode } = await request.json()

    if (!shippingAddress) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Shipping address is required",
          statusCode: 400,
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const cartsCollection = db.collection("carts")
    const ordersCollection = db.collection("orders")
    const couponsCollection = db.collection("coupons")

    // Get user's cart
    const cart = await cartsCollection
      .aggregate([
        { $match: { userId: user.id } },
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
          },
        },
      ])
      .toArray()

    if (!cart.length || !cart[0].items.length) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Cart is empty",
          statusCode: 400,
        },
        { status: 400 },
      )
    }

    const cartData = cart[0]
    let totalAmount = 0
    let discountAmount = 0

    // Calculate total
    cartData.items.forEach((item: any) => {
      totalAmount += item.product.price * item.quantity
    })

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await couponsCollection.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      })

      if (coupon) {
        discountAmount = (totalAmount * coupon.discount) / 100
        // Update coupon usage count
        await couponsCollection.updateOne({ _id: coupon._id }, { $inc: { usageCount: 1 } })
      }
    }

    const finalAmount = totalAmount - discountAmount

    // Create order
    const result = await ordersCollection.insertOne({
      userId: user.id,
      items: cartData.items,
      totalAmount: finalAmount,
      discountAmount,
      couponCode: couponCode?.toUpperCase(),
      status: "pending",
      shippingAddress,
      createdAt: new Date(),
    })

    // Clear cart
    await cartsCollection.deleteOne({ userId: user.id })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Order placed successfully",
        data: { orderId: result.insertedId },
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

    console.error("Create order error:", error)
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
