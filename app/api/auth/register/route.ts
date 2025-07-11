import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDatabase } from "@/lib/mongodb"
import { generateToken } from "@/lib/jwt"
import type { ApiResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role = "user" } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Email, password, and name are required",
          statusCode: 400,
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "User already exists",
          statusCode: 409,
        },
        { status: 409 },
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const result = await usersCollection.insertOne({
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: new Date(),
    })

    const user = {
      id: result.insertedId.toString(),
      email,
      name,
      role,
    }

    const token = generateToken(user)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "User registered successfully",
        data: { user, token },
        statusCode: 201,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
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
