"use client"

import { useState } from "react"
import Image from "next/image"
import { ShoppingCart, Plus, Minus } from "lucide-react"
import type { Product } from "@/lib/types"
import api from "@/lib/axios"

interface ProductCardProps {
  product: Product
  onAddToCart?: () => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddToCart = async () => {
    try {
      setIsLoading(true)
      const response = await api.post("/cart", {
        productId: product._id,
        quantity,
      })

      if (response.data.success) {
        onAddToCart?.()
        setQuantity(1)
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error)
      alert(error.response?.data?.message || "Failed to add to cart")
    } finally {
      setIsLoading(false)
    }
  }

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 w-full">
        <Image
          src={product.image || "/placeholder.svg?height=200&width=200"}
          alt={product.name}
          fill
          className="object-cover"
        />
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs">
            Only {product.stock} left
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">Out of Stock</div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 text-gray-800">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
          <span className="text-sm text-gray-500">{product.category}</span>
        </div>

        {product.stock > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={decrementQuantity}
                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-medium">{quantity}</span>
              <button
                onClick={incrementQuantity}
                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>{isLoading ? "Adding..." : "Add to Cart"}</span>
        </button>
      </div>
    </div>
  )
}
