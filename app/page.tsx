import Link from "next/link"
import { ArrowRight, Star, Shield, Truck, Award } from "lucide-react"
import Banner from "@/components/Banner"

export default function HomePage() {
  const features = [
    {
      icon: <Star className="h-8 w-8 text-yellow-500" />,
      title: "Premium Quality",
      description: "Only the highest quality supplements from trusted brands",
    },
    {
      icon: <Shield className="h-8 w-8 text-green-500" />,
      title: "Lab Tested",
      description: "All products are third-party tested for purity and potency",
    },
    {
      icon: <Truck className="h-8 w-8 text-blue-500" />,
      title: "Fast Shipping",
      description: "Free shipping on orders over $50 with quick delivery",
    },
    {
      icon: <Award className="h-8 w-8 text-purple-500" />,
      title: "Expert Approved",
      description: "Recommended by fitness professionals and nutritionists",
    },
  ]

  const trendingProducts = [
    {
      name: "Whey Protein Isolate",
      price: "$49.99",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.8,
    },
    {
      name: "Creatine Monohydrate",
      price: "$29.99",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.9,
    },
    {
      name: "Pre-Workout Formula",
      price: "$39.99",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.7,
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Fuel Your <span className="text-yellow-400">Fitness</span> Journey
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto">
              Premium gym supplements to help you achieve your fitness goals. Quality products, expert guidance, and
              fast delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors flex items-center justify-center space-x-2"
              >
                <span>View Products</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/register"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-gray-900 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Banner />
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose GymSupplements?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to providing you with the best supplements and service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Products Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Trending Products</h2>
            <p className="text-xl text-gray-600">Most popular supplements among our customers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trendingProducts.map((product, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="h-32 w-32 object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-current" : ""}`} />
                      ))}
                    </div>
                    <span className="ml-2 text-gray-600">({product.rating})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">{product.price}</span>
                    <Link
                      href="/products"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <span>View All Products</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">About GymSupplements</h2>
              <p className="text-lg text-gray-300 mb-6">
                We're passionate about helping fitness enthusiasts achieve their goals through premium quality
                supplements. With over 10 years of experience in the industry, we've built a reputation for excellence
                and trust.
              </p>
              <p className="text-lg text-gray-300 mb-8">
                Our team of experts carefully selects each product to ensure you get the best results from your
                training. From protein powders to pre-workouts, we have everything you need to fuel your fitness
                journey.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-3xl font-bold text-yellow-400 mb-2">10K+</div>
                  <div className="text-gray-300">Happy Customers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-yellow-400 mb-2">500+</div>
                  <div className="text-gray-300">Products</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-6">Our Promise</h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-green-400 mt-1" />
                  <span>100% authentic products guaranteed</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Truck className="h-6 w-6 text-blue-400 mt-1" />
                  <span>Fast and secure shipping worldwide</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Award className="h-6 w-6 text-purple-400 mt-1" />
                  <span>Expert customer support team</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Star className="h-6 w-6 text-yellow-400 mt-1" />
                  <span>30-day money-back guarantee</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
