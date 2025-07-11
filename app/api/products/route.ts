import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireRole } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

export async function GET() {
  try {
    const db = await getDatabase()
    const productsCollection = db.collection("products")

    const products = await productsCollection.find({ isActive: true }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Products fetched successfully",
      data: products,
      statusCode: 200,
    })
  } catch (error) {
    console.error("Get products error:", error)
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
    const user = requireRole(request, ["admin"])

    const { name, description, price, image, stock, category } = await request.json()

    if (!name || !description || !price || !image || !stock || !category) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "All fields are required",
          statusCode: 400,
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const productsCollection = db.collection("products")

    const result = await productsCollection.insertOne({
      name,
      description,
      price: Number.parseFloat(price),
      image,
      stock: Number.parseInt(stock),
      category,
      isActive: true,
      createdAt: new Date(),
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Product created successfully",
        data: { id: result.insertedId },
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

    console.error("Create product error:", error)
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
