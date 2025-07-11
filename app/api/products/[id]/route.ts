import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireRole } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const productsCollection = db.collection("products")

    const product = await productsCollection.findOne({
      _id: new ObjectId(params.id),
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

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Product fetched successfully",
      data: product,
      statusCode: 200,
    })
  } catch (error) {
    console.error("Get product error:", error)
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireRole(request, ["admin"])

    const { name, description, price, image, stock, category, isActive } = await request.json()

    const db = await getDatabase()
    const productsCollection = db.collection("products")

    const result = await productsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          name,
          description,
          price: Number.parseFloat(price),
          image,
          stock: Number.parseInt(stock),
          category,
          isActive,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Product not found",
          statusCode: 404,
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Product updated successfully",
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

    console.error("Update product error:", error)
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireRole(request, ["admin"])

    const db = await getDatabase()
    const productsCollection = db.collection("products")

    const result = await productsCollection.deleteOne({
      _id: new ObjectId(params.id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Product not found",
          statusCode: 404,
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Product deleted successfully",
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

    console.error("Delete product error:", error)
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
