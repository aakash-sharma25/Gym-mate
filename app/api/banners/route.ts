import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireRole } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

export async function GET() {
  try {
    const db = await getDatabase()
    const bannersCollection = db.collection("banners")

    const banners = await bannersCollection.find({ isActive: true }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Banners fetched successfully",
      data: banners,
      statusCode: 200,
    })
  } catch (error) {
    console.error("Get banners error:", error)
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

    const { title, image } = await request.json()

    if (!title || !image) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Title and image are required",
          statusCode: 400,
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const bannersCollection = db.collection("banners")

    const result = await bannersCollection.insertOne({
      title,
      image,
      isActive: true,
      createdAt: new Date(),
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Banner created successfully",
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

    console.error("Create banner error:", error)
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
