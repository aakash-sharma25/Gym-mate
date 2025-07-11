import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)

    const db = await getDatabase()
    const cartsCollection = db.collection("carts")

    const cart = await cartsCollection.findOne({ userId: user.id })

    if (!cart) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Cart is empty",
        data: { items: [] },
        statusCode: 200,
      })
    }

    // Populate product details
    const productsCollection = db.collection("products")
    const cartWithProducts = await cartsCollection
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
            createdAt: { $first: "$createdAt" },
          },
        },
      ])
      .toArray()

    const cartData = cartWithProducts[0] || { items: [] }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Cart fetched successfully",
      data: cartData,
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

    console.error("Get cart error:", error)
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
    const { productId, quantity = 1 } = await request.json()

    if (!productId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Product ID is required",
          statusCode: 400,
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const cartsCollection = db.collection("carts")
    const productsCollection = db.collection("products")

    // Check if product exists
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

    // Check stock
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

    // Find or create cart
    const cart = await cartsCollection.findOne({ userId: user.id })

    if (!cart) {
      await cartsCollection.insertOne({
        userId: user.id,
        items: [{ productId: new ObjectId(productId), quantity }],
        createdAt: new Date(),
      })
    } else {
      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex((item: any) => item.productId.toString() === productId)

      if (existingItemIndex > -1) {
        // Update quantity
        await cartsCollection.updateOne(
          { userId: user.id, "items.productId": new ObjectId(productId) },
          { $inc: { "items.$.quantity": quantity } },
        )
      } else {
        // Add new item
        await cartsCollection.updateOne(
          { userId: user.id },
          { $push: { items: { productId: new ObjectId(productId), quantity } } },
        )
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Item added to cart successfully",
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

    console.error("Add to cart error:", error)
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
