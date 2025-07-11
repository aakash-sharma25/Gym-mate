// MongoDB script to seed initial tracking data
const { MongoClient } = require("mongodb")

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017"
const client = new MongoClient(uri)

async function seedTrackingData() {
  try {
    await client.connect()
    const db = client.db("gym-supplement-store")

    // Create tracking_events collection with sample data
    const trackingEvents = [
      {
        orderId: "sample_order_id_1",
        status: "pending",
        message: "Order received and is being processed",
        location: "Warehouse - New York",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedBy: "System",
        updatedByRole: "system",
      },
      {
        orderId: "sample_order_id_1",
        status: "processing",
        message: "Order is being prepared for shipment",
        location: "Fulfillment Center - New York",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedBy: "John Doe",
        updatedByRole: "admin",
      },
      {
        orderId: "sample_order_id_1",
        status: "shipped",
        message: "Package has been shipped and is on the way",
        location: "Distribution Center - Philadelphia",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedBy: "Jane Smith",
        updatedByRole: "delivery",
      },
    ]

    await db.collection("tracking_events").insertMany(trackingEvents)
    console.log("Tracking data seeded successfully")
  } catch (error) {
    console.error("Error seeding tracking data:", error)
  } finally {
    await client.close()
  }
}

seedTrackingData()
