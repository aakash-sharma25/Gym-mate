import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const user = requireAuth(request)

    const db = await getDatabase()
    const cartsCollection = db.collection("carts")

    // Remove item from cart
    const result = await cartsCollection.updateOne(
      { userId: user.id },
      { $pull: { items: { productId: new ObjectId(params.productId) } } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Cart not found",
          statusCode: 404,
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Item removed from cart successfully",
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

    console.error("Remove from cart error:", error)
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
