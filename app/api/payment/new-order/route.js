import { NextResponse } from "next/server";
import axios from "axios";
import User from "@/schema/User";
import { authMiddleware } from "@/middleware/auth";

export async function POST(req) {
  const body = await req.json();
  const userDetails = await authMiddleware(req);
  if (!body.courseId || !body.price) {
    return NextResponse.json(
      { message: "All filed are required", success: false },
      { status: 500 }
    );
  }
  if (userDetails?.status === 511) {
    return Response.json({ message: "Unauthorized" }, { status: 511 });
  }

  const user = await User.findById(userDetails.id);

  if (!user) {
    return NextResponse.json(
      { message: "no user found", success: false },
      { status: 500 }
    );
  }

  try {
    const response = await axios.request({
      method: "POST",
      url: "https://api.cashfree.com/pg/orders",
      headers: {
        accept: "application/json",
        "x-api-version": "2022-09-01",
        "content-type": "application/json",
        "x-client-id": process.env.APP_ID,
        "x-client-secret": process.env.SECRET_KEY,
      },
      data: {
        customer_details: {
          customer_id: user._id,
          customer_email: user.email,
          customer_phone: "0000000000",
          customer_name: user.name,
        },
        order_meta: {
          notify_url: "https://www.rjmanish.shop/api/payment/webhook",
          payment_methods: "cc,dc,upi",
        },
        order_tags: {
          customerId: user._id,
          cousrseId: body.courseId,
        },
        order_amount: body.price,
        order_id: "ORID665456" + Date.now(),
        order_currency: "INR",
        order_note:
          "This is payment is for course registration by" + " " + user.email,
      },
    });

    return NextResponse.json({
      payment_session_id: response.data.payment_session_id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: error.message, success: false },
      { status: 500 }
    );
  }
}
