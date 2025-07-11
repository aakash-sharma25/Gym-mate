import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { productId, quantity } = await request.json()

    if (!productId || quantity < 1) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Product ID and valid quantity are required",
          statusCode: 400,
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const cartsCollection = db.collection("carts")
    const productsCollection = db.collection("products")

    // Check if product exists and has enough stock
    const product = await productsCollection.findOne({
      _id: new ObjectId(productId),
      isActive: true,
    })

    if (!product) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Product not found",
          statusCode: 404,
        },
        { status: 404 },
      )
    }

    if (product.stock < quantity) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Insufficient stock",
          statusCode: 400,
        },
        { status: 400 },
      )
    }

    // Update quantity in cart
    const result = await cartsCollection.updateOne(
      { userId: user.id, "items.productId": new ObjectId(productId) },
      { $set: { "items.$.quantity": quantity } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Item not found in cart",
          statusCode: 404,
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Cart updated successfully",
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

    console.error("Update cart error:", error)
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
