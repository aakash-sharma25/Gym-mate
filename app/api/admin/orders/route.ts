import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { requireRole } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, ["admin"])

    const db = await getDatabase()
    const ordersCollection = db.collection("orders")

    // Get all orders with user details
    const orders = await ordersCollection
      .aggregate([
        {
          $addFields: {
            userObjectId: { $toObjectId: "$userId" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userObjectId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$items",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            "items.productObjectId": { $toObjectId: "$items.productId" },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "items.productObjectId",
            foreignField: "_id",
            as: "items.product",
          },
        },
        {
          $unwind: {
            path: "$items.product",
            preserveNullAndEmptyArrays: true,
          },
        },
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
            user: {
              $first: {
                name: "$userDetails.name",
                email: "$userDetails.email",
                phone: "$userDetails.phone",
              },
            },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray()

    // If aggregation fails, fallback to simple query
    if (orders.length === 0) {
      const simpleOrders = await ordersCollection.find({}).sort({ createdAt: -1 }).toArray()

      // Manually populate user and product data
      const usersCollection = db.collection("users")
      const productsCollection = db.collection("products")

      const populatedOrders = await Promise.all(
        simpleOrders.map(async (order) => {
          // Get user details
          let user = { name: "Unknown User", email: "N/A", phone: "N/A" }
          try {
            const userDoc = await usersCollection.findOne({ _id: new ObjectId(order.userId) })
            if (userDoc) {
              user = {
                name: userDoc.name || "Unknown User",
                email: userDoc.email || "N/A",
                phone: userDoc.phone || "N/A",
              }
            }
          } catch (error) {
            console.error("Error fetching user:", error)
          }

          // Get product details for each item
          const populatedItems = await Promise.all(
            order.items.map(async (item: any) => {
              try {
                const product = await productsCollection.findOne({ _id: new ObjectId(item.productId) })
                return {
                  ...item,
                  product: product || { name: "Unknown Product", price: 0, image: "" },
                }
              } catch (error) {
                console.error("Error fetching product:", error)
                return {
                  ...item,
                  product: { name: "Unknown Product", price: 0, image: "" },
                }
              }
            }),
          )

          return {
            ...order,
            user,
            items: populatedItems,
          }
        }),
      )

      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Orders fetched successfully (fallback method)",
        data: populatedOrders,
        statusCode: 200,
      })
    }

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

    console.error("Get admin orders error:", error)
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
