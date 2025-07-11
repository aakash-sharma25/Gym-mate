import { redirect } from "next/navigation";
import axios from "axios";

export async function GET(request, { params }) {
  const orderid = params.orderId;

  try {
    const response = await axios.request({
      method: "GET",
      url: `https://sandbox.cashfree.com/pg/orders/${orderid}`,
      headers: {
        accept: "application/json",
        "x-api-version": "2022-09-01",
        "x-client-id": process.env.APP_ID,
        "x-client-secret": process.env.SECRET_KEY,
      },
    });

    const orderStatus = response.data.order_status;
    const paymentSessionId = response.data.payment_session_id;

    if (orderStatus === "PAID") {
      return Response.json({ message: "Paid" }, { status: 200 });
    } else if (orderStatus === "ACTIVE") {
      return Response.json({ message: "Active" }, { status: 200 });
    } else {
      return Response.json({ message: "Fail" }, { status: 404 });
    }
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ message: error.message, success: false }),
      {
        status: 500,
      }
    );
  }
}
