export interface User {
  _id: string
  email: string
  password: string
  name: string
  role: "user" | "admin" | "delivery"
  phone?: string
  address?: string
  createdAt: Date
  updatedAt?: Date
}

export interface Product {
  _id: string
  name: string
  description: string
  price: number
  image: string
  stock: number
  category: string
  isActive: boolean
  createdAt: Date
}

export interface CartItem {
  productId: string
  quantity: number
  product: Product
}

export interface Cart {
  _id: string
  userId: string
  items: CartItem[]
  createdAt: Date
}

export interface Coupon {
  _id: string
  code: string
  discount: number
  influencerName: string
  isActive: boolean
  usageCount: number
  createdAt: Date
}

export interface Order {
  _id: string
  userId: string
  items: CartItem[]
  totalAmount: number
  discountAmount: number
  couponCode?: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  shippingAddress: string
  createdAt: Date
}

export interface Banner {
  _id: string
  title: string
  image: string
  isActive: boolean
  createdAt: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  statusCode: number
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: "user" | "admin" | "delivery"
  phone?: string
  address?: string
}
