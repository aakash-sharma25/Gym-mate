import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, ["admin"])

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No file provided",
          statusCode: 400,
        },
        { status: 400 },
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            folder: "gym-supplements",
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          },
        )
        .end(buffer)
    })

    const uploadResult = result as any

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      },
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

    console.error("Image upload error:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Failed to upload image",
        statusCode: 500,
      },
      { status: 500 },
    )
  }
}
