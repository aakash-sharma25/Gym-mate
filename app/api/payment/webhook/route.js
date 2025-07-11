import { connectToDB } from "@/lib/dbConnect";
import Course from "@/schema/Courses";
import User from "@/schema/User";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectToDB();

    const data = await req.json();

    // Ensure it's a successful payment event
    if (
      data?.type !== "PAYMENT_SUCCESS_WEBHOOK" ||
      data?.data?.payment?.payment_status !== "SUCCESS"
    ) {
      return NextResponse.json(
        { message: "Invalid webhook type or payment not successful" },
        { status: 400 }
      );
    }

    const { courseId, customerId } = {
      courseId: data.data.order.order_tags.cousrseId,
      customerId: data.data.order.order_tags.customerId,
    };

    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(customerId)
    ) {
      return NextResponse.json(
        { message: "Invalid courseId or customerId" },
        { status: 400 }
      );
    }

    // Fetch user and course
    const user = await User.findById(customerId);
    const course = await Course.findById(courseId);

    if (!user || !course) {
      return NextResponse.json(
        { message: "User or course not found" },
        { status: 404 }
      );
    }

    // Prevent duplicate enrollment
    const alreadyEnrolled = user.enrolledCourses.includes(courseId);
    if (alreadyEnrolled) {
      return NextResponse.json(
        { message: "User already enrolled in this course" },
        { status: 409 }
      );
    }

    // Enroll user
    user.enrolledCourses.push(courseId);
    await user.save();

    return NextResponse.json(
      { message: "User enrolled successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
