"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag } from "lucide-react";
import type { CartItem, AuthUser } from "@/lib/types";
import api from "@/lib/axios";
import { toast } from "sonner";

interface CartData {
  _id?: string;
  items: CartItem[];
}

export default function CartPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [cart, setCart] = useState<CartData>({ items: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const router = useRouter();

  // const getSessionId = async () => {
  //   if (!localStorage.getItem("token")) {
  //     router.push("/login");
  //   }
  //   // setLoading(true);
  //   try {
  //     const { data } = await api.post("/api/payment/new-order", {
  //       version,
  //       courseId: selectedCourse._id,
  //       price: selectedCourse.price,
  //     });

  //     return data.payment_session_id; // assuming res.data is the session ID
  //   } catch (err) {
  //     console.error("Failed to get session ID", err);
  //   } finally {
  //     // setLoading(false);
  //   }
  // };
  // const handlePayment = async () => {
  //   try {
  //     const sessionId = await getSessionId();

  //     if (!cashfree || !sessionId) {
  //       alert("Cashfree not loaded or session ID missing");
  //       return;
  //     }

  //     const checkoutOptions = {
  //       paymentSessionId: sessionId,
  //       returnUrl: "https://www.rjmanish.shop/my-course",
  //     };

  //     cashfree.checkout(checkoutOptions).then((result) => {
  //       if (result.error) {
  //         alert(result.error.message);
  //       }
  //       if (result.redirect) {
  //         console.log("Redirection", result);
  //       }
  //     });
  //   } catch (error) {
  //     alert(error);
  //   }
  // };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setShippingAddress(parsedUser.address || "");
    fetchCart();
  }, [router]);

  const fetchCart = async () => {
    try {
      const response = await api.get("/cart");
      if (response.data.success) {
        setCart(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setIsUpdating(true);
    try {
      const response = await api.put("/cart/update", {
        productId,
        quantity: newQuantity,
      });

      if (response.data.success) {
        fetchCart();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  const removeItem = async (productId: string) => {
    setIsUpdating(true);
    try {
      const response = await api.delete(`/cart/remove/${productId}`);

      if (response.data.success) {
        fetchCart();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to remove item");
    } finally {
      setIsUpdating(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponError("");
    try {
      const response = await api.post("/coupons/validate", {
        code: couponCode.trim(),
      });

      if (response.data.success) {
        setAppliedCoupon({
          code: response.data.data.code,
          discount: response.data.data.discount,
        });
        setCouponCode("");
      }
    } catch (error: any) {
      setCouponError(error.response?.data?.message || "Invalid coupon code");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const calculateSubtotal = () => {
    return cart.items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    return (calculateSubtotal() * appliedCoupon.discount) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleCheckout = async () => {
    if (!shippingAddress.trim()) {
      alert("Please enter a shipping address");
      return;
    }

    setIsCheckingOut(true);
    try {
      const response = await api.post("/orders", {
        shippingAddress: shippingAddress.trim(),
        couponCode: appliedCoupon?.code,
      });

      if (response.data.success) {
        alert("Order placed successfully!");
        router.push("/profile?tab=orders");
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to place order");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gray-300 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Continue Shopping</span>
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">
            {cart.items.length} {cart.items.length === 1 ? "item" : "items"} in
            your cart
          </p>
        </div>

        {cart.items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add some products to get started
            </p>
            <button
              onClick={() => router.push("/products")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Shop Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Cart Items
                </h2>
                <div className="space-y-6">
                  {cart.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center space-x-4 pb-6 border-b border-gray-200"
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={
                            item.product.image ||
                            "/placeholder.svg?height=80&width=80"
                          }
                          alt={item.product.name}
                          className="h-20 w-20 object-cover rounded-lg"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.product.category}
                        </p>
                        <p className="text-lg font-semibold text-blue-600 mt-2">
                          ${item.product.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            disabled={isUpdating || item.quantity <= 1}
                            className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-4 py-2 font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            disabled={
                              isUpdating || item.quantity >= item.product.stock
                            }
                            className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.productId)}
                          disabled={isUpdating}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Order Summary
                </h2>

                {/* Coupon Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coupon Code
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-sm text-green-600">
                          ({appliedCoupon.discount}% off)
                        </span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter coupon code"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={applyCoupon}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-sm text-red-600">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                      ${calculateSubtotal().toFixed(2)}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Discount ({appliedCoupon.code})
                      </span>
                      <span className="text-green-600">
                        -${calculateDiscount().toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">Free</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Checkout
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shipping Address *
                    </label>
                    <textarea
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      rows={3}
                      placeholder="Enter your complete shipping address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Order Summary
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${calculateSubtotal().toFixed(2)}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-${calculateDiscount().toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-base pt-2 border-t">
                        <span>Total:</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut || !shippingAddress.trim()}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isCheckingOut ? "Placing Order..." : "Place Order"}
                  </button>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
