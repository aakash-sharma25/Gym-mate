import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const userData = await usersCollection.findOne({ _id: new ObjectId(user.id) }, { projection: { password: 0 } })

    if (!userData) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "User not found",
          statusCode: 404,
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Profile fetched successfully",
      data: userData,
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

    console.error("Get profile error:", error)
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

export async function PUT(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { name, email, phone, address } = await request.json()

    if (!name || !email) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Name and email are required",
          statusCode: 400,
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Check if email is already taken by another user
    const existingUser = await usersCollection.findOne({
      email,
      _id: { $ne: new ObjectId(user.id) },
    })

    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Email is already taken",
          statusCode: 409,
        },
        { status: 409 },
      )
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(user.id) },
      {
        $set: {
          name,
          email,
          phone,
          address,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "User not found",
          statusCode: 404,
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Profile updated successfully",
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

    console.error("Update profile error:", error)
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
