// Shared temporary storage for orders when database is not available
const tempOrders = new Map();
let tempOrderIdCounter = 1000; // Start from 1000 to distinguish from DB IDs

const tempStorage = {
  // Add a new order to temporary storage
  addOrder(orderData) {
    const orderId = 'temp-' + (tempOrderIdCounter++);
    const order = {
      id: orderId,
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'temporary'
    };
    tempOrders.set(orderId, order);
    console.log(`Added order to temporary storage: ${orderId}`);
    return order;
  },
  
  // Get all orders from temporary storage
  getAllOrders() {
    return Array.from(tempOrders.values()).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  },
  
  // Get a specific order by ID
  getOrder(orderId) {
    return tempOrders.get(orderId);
  },
  
  // Update an order
  updateOrder(orderId, updates) {
    const order = tempOrders.get(orderId);
    if (order) {
      const updatedOrder = {
        ...order,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      tempOrders.set(orderId, updatedOrder);
      console.log(`Updated order in temporary storage: ${orderId}`);
      return updatedOrder;
    }
    return null;
  },
  
  // Delete an order
  deleteOrder(orderId) {
    const deleted = tempOrders.delete(orderId);
    if (deleted) {
      console.log(`Deleted order from temporary storage: ${orderId}`);
    }
    return deleted;
  },
  
  // Get statistics
  getStats() {
    const orders = this.getAllOrders();
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.totalPrice) || 0), 0);
    
    return {
      totalOrders,
      pendingOrders,
      totalRevenue
    };
  },
  
  // Clear all temporary orders (for testing/reset)
  clear() {
    tempOrders.clear();
    tempOrderIdCounter = 1000;
    console.log('Cleared all temporary storage');
  }
};

module.exports = tempStorage;
