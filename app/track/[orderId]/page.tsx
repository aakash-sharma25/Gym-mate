"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Phone, Mail } from "lucide-react"
import type { Order } from "@/lib/types"
import api from "@/lib/axios"

interface TrackingEvent {
  _id: string
  orderId: string
  status: string
  message: string
  location?: string
  timestamp: Date
  updatedBy: string
  updatedByRole: string
}

interface TrackingDetails {
  order: Order
  events: TrackingEvent[]
  estimatedDelivery: string
  currentLocation?: string
  deliveryAgent?: {
    name: string
    phone: string
    email: string
  }
}

export default function OrderTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const [trackingData, setTrackingData] = useState<TrackingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (params.orderId) {
      fetchTrackingDetails(params.orderId as string)
    }
  }, [params.orderId])

  const fetchTrackingDetails = async (orderId: string) => {
    try {
      const response = await api.get(`/orders/${orderId}/tracking`)
      if (response.data.success) {
        setTrackingData(response.data.data)
      } else {
        setError(response.data.message)
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch tracking details")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusProgress = (status: string) => {
    const statuses = ["pending", "processing", "shipped", "delivered"]
    return statuses.indexOf(status) + 1
  }

  const getStatusIcon = (status: string, isActive: boolean, isCompleted: boolean) => {
    const iconClass = `h-6 w-6 ${isCompleted ? "text-green-600" : isActive ? "text-blue-600" : "text-gray-400"}`

    switch (status) {
      case "pending":
        return <Clock className={iconClass} />
      case "processing":
        return <Package className={iconClass} />
      case "shipped":
        return <Truck className={iconClass} />
      case "delivered":
        return <CheckCircle className={iconClass} />
      default:
        return <Package className={iconClass} />
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="h-6 bg-gray-300 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The order you're looking for doesn't exist."}</p>
          <button
            onClick={() => router.push("/profile")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Orders
          </button>
        </div>
      </div>
    )
  }

  const { order, events, estimatedDelivery, currentLocation, deliveryAgent } = trackingData
  const currentProgress = getStatusProgress(order.status)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Orders</span>
        </button>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Order #{order._id.slice(-8).toUpperCase()}</h1>
              <p className="text-gray-600">Placed on {formatDate(order.createdAt.toString())}</p>
            </div>
            <div className="mt-4 lg:mt-0 text-right">
              <div className="text-2xl font-bold text-gray-900">${order.totalAmount.toFixed(2)}</div>
              {order.discountAmount > 0 && (
                <div className="text-sm text-green-600">Saved ${order.discountAmount.toFixed(2)}</div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              {["pending", "processing", "shipped", "delivered"].map((status, index) => {
                const isCompleted = index + 1 < currentProgress
                const isActive = index + 1 === currentProgress
                const stepNumber = index + 1

                return (
                  <div key={status} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                        isCompleted
                          ? "bg-green-600 border-green-600"
                          : isActive
                            ? "bg-blue-600 border-blue-600"
                            : "bg-white border-gray-300"
                      }`}
                    >
                      {getStatusIcon(status, isActive, isCompleted)}
                    </div>
                    <div className="mt-2 text-center">
                      <div
                        className={`text-sm font-medium ${
                          isCompleted ? "text-green-600" : isActive ? "text-blue-600" : "text-gray-500"
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </div>
                    </div>
                    {index < 3 && (
                      <div
                        className={`hidden lg:block absolute h-0.5 w-full top-6 left-1/2 ${
                          isCompleted ? "bg-green-600" : "bg-gray-300"
                        }`}
                        style={{ zIndex: -1 }}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Progress Line for Mobile */}
            <div className="lg:hidden">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentProgress / 4) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">{getStatusIcon(order.status, true, false)}</div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 capitalize">{order.status}</h3>
                <p className="text-blue-700">
                  {order.status === "delivered"
                    ? "Your order has been delivered successfully!"
                    : order.status === "shipped"
                      ? `Your order is on the way! Expected delivery: ${estimatedDelivery}`
                      : order.status === "processing"
                        ? "Your order is being prepared for shipment"
                        : "Your order has been received and is being processed"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tracking Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Tracking Timeline</h2>

              <div className="space-y-6">
                {events.map((event, index) => (
                  <div key={event._id} className="flex space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {getStatusIcon(event.status, true, false)}
                      </div>
                      {index < events.length - 1 && <div className="w-0.5 h-6 bg-gray-200 ml-5 mt-2"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{event.message}</p>
                        <p className="text-sm text-gray-500">{formatDateTime(event.timestamp.toString())}</p>
                      </div>
                      {event.location && (
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Updated by {event.updatedBy} ({event.updatedByRole})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Details Sidebar */}
          <div className="space-y-6">
            {/* Delivery Information */}
            {(currentLocation || deliveryAgent) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>

                {currentLocation && (
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="font-medium">Current Location</span>
                    </div>
                    <p className="text-gray-900 ml-6">{currentLocation}</p>
                  </div>
                )}

                {deliveryAgent && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Delivery Agent</h4>
                    <div className="space-y-2">
                      <p className="text-gray-900">{deliveryAgent.name}</p>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <a href={`tel:${deliveryAgent.phone}`} className="hover:text-blue-600">
                          {deliveryAgent.phone}
                        </a>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <a href={`mailto:${deliveryAgent.email}`} className="hover:text-blue-600">
                          {deliveryAgent.email}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <img
                      src={item.product.image || "/placeholder.svg?height=50&width=50"}
                      alt={item.product.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity} × ${item.product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <p className="text-gray-900">{order.shippingAddress}</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${(order.totalAmount + order.discountAmount).toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount ({order.couponCode})</span>
                    <span className="text-green-600">-${order.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
