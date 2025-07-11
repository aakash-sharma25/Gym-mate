import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDatabase } from "@/lib/mongodb"
import { generateToken } from "@/lib/jwt"
import type { ApiResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Email and password are required",
          statusCode: 400,
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Find user
    const user = await usersCollection.findOne({ email })
    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Invalid credentials",
          statusCode: 401,
        },
        { status: 401 },
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Invalid credentials",
          statusCode: 401,
        },
        { status: 401 },
      )
    }

    const authUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    }

    const token = generateToken(authUser)

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Login successful",
      data: { user: authUser, token },
      statusCode: 200,
    })
  } catch (error) {
    console.error("Login error:", error)
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
