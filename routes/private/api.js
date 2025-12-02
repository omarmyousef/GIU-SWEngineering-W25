const db = require('../../connectors/db');
const {getUser} = require('../../utils/session');

function handlePrivateBackendApi(app) {
  
  // ==================== TRUCK OWNER ENDPOINTS ====================
  
  // 1. Create a Menu Item
  app.post('/api/v1/menuItem/new', async (req, res) => {
    try {
      const user = await getUser(req);
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can create menu items' });
      }
      
      const { name, price, description, category } = req.body;
      
      if (!name || !price || !category) {
        return res.status(400).json({ error: 'Name, price, and category are required' });
      }
      
      const menuItem = await db('FoodTruck.MenuItems')
        .insert({
          truckId: user.truckId,
          name,
          price,
          description: description || null,
          category,
          status: 'available'
        })
        .returning('*');
      
      return res.status(200).json({ message: 'menu item was created successfully' });
      
    } catch (err) {
      console.error('Error creating menu item:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 2. View My Truck's Menu Items
  app.get('/api/v1/menuItem/view', async (req, res) => {
    try {
      const user = await getUser(req);
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can view their menu items' });
      }
      
      const menuItems = await db('FoodTruck.MenuItems')
        .where({
          truckId: user.truckId,
          status: 'available'
        })
        .orderBy('itemId', 'asc')
        .select('*');
      
      return res.status(200).json(menuItems);
      
    } catch (err) {
      console.error('Error fetching menu items:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 3. View a Specific Menu Item
  app.get('/api/v1/menuItem/view/:itemId', async (req, res) => {
    try {
      const user = await getUser(req);
      const { itemId } = req.params;
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can view menu items' });
      }
      
      const menuItem = await db('FoodTruck.MenuItems')
        .where({
          itemId,
          truckId: user.truckId
        })
        .first();
      
      if (!menuItem) {
        return res.status(404).json({ error: 'Menu item not found or you do not have permission to view it' });
      }
      
      return res.status(200).json(menuItem);
      
    } catch (err) {
      console.error('Error fetching menu item:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 4. Edit a Menu Item
  app.put('/api/v1/menuItem/edit/:itemId', async (req, res) => {
    try {
      const user = await getUser(req);
      const { itemId } = req.params;
      const { name, price, category, description } = req.body;
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can edit menu items' });
      }
      
      // Check if menu item exists and belongs to user
      const menuItem = await db('FoodTruck.MenuItems')
        .where({
          itemId,
          truckId: user.truckId
        })
        .first();
      
      if (!menuItem) {
        return res.status(404).json({ error: 'Menu item not found or you do not have permission to edit it' });
      }
      
      await db('FoodTruck.MenuItems')
        .where({ itemId })
        .update({
          name,
          price,
          category,
          description
        });
      
      return res.status(200).json({ message: 'menu item updated successfully' });
      
    } catch (err) {
      console.error('Error updating menu item:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 5. Delete a Menu Item (set status to unavailable)
  app.delete('/api/v1/menuItem/delete/:itemId', async (req, res) => {
    try {
      const user = await getUser(req);
      const { itemId } = req.params;
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can delete menu items' });
      }
      
      // Check if menu item exists and belongs to user
      const menuItem = await db('FoodTruck.MenuItems')
        .where({
          itemId,
          truckId: user.truckId
        })
        .first();
      
      if (!menuItem) {
        return res.status(404).json({ error: 'Menu item not found or you do not have permission to delete it' });
      }
      
      await db('FoodTruck.MenuItems')
        .where({ itemId })
        .update({ status: 'unavailable' });
      
      return res.status(200).json({ message: 'menu item deleted successfully' });
      
    } catch (err) {
      console.error('Error deleting menu item:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 6. View My Truck Information
  app.get('/api/v1/trucks/myTruck', async (req, res) => {
    try {
      const user = await getUser(req);
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can view truck information' });
      }
      
      const truck = await db('FoodTruck.Trucks')
        .where({ truckId: user.truckId })
        .first();
      
      if (!truck) {
        return res.status(404).json({ error: 'Truck not found' });
      }
      
      return res.status(200).json(truck);
      
    } catch (err) {
      console.error('Error fetching truck info:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 7. Update Truck Order Availability
  app.put('/api/v1/trucks/updateOrderStatus', async (req, res) => {
    try {
      const user = await getUser(req);
      const { orderStatus } = req.body;
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can update order status' });
      }
      
      if (!orderStatus || !['available', 'unavailable'].includes(orderStatus)) {
        return res.status(400).json({ error: 'Valid orderStatus (available/unavailable) is required' });
      }
      
      await db('FoodTruck.Trucks')
        .where({ truckId: user.truckId })
        .update({ orderStatus });
      
      return res.status(200).json({ message: 'truck order status updated successfully' });
      
    } catch (err) {
      console.error('Error updating truck order status:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 8. View Orders for My Truck
  app.get('/api/v1/order/truckOrders', async (req, res) => {
    try {
      const user = await getUser(req);
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can view truck orders' });
      }
      
      const orders = await db('FoodTruck.Orders as o')
        .join('FoodTruck.Users as u', 'o.userId', 'u.userId')
        .where('o.truckId', user.truckId)
        .orderBy('o.orderId', 'desc')
        .select(
          'o.orderId',
          'o.userId',
          'u.name as customerName',
          'o.orderStatus',
          'o.totalPrice',
          'o.scheduledPickupTime',
          'o.estimatedEarliestPickup',
          'o.createdAt'
        );
      
      return res.status(200).json(orders);
      
    } catch (err) {
      console.error('Error fetching truck orders:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 9. Update Order Status
  app.put('/api/v1/order/updateStatus/:orderId', async (req, res) => {
    try {
      const user = await getUser(req);
      const { orderId } = req.params;
      const { orderStatus, estimatedEarliestPickup } = req.body;
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can update order status' });
      }
      
      const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
      if (!orderStatus || !validStatuses.includes(orderStatus)) {
        return res.status(400).json({ error: 'Valid orderStatus is required' });
      }
      
      // Check if order exists and belongs to user's truck
      const order = await db('FoodTruck.Orders')
        .where({
          orderId,
          truckId: user.truckId
        })
        .first();
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found or you do not have permission to update it' });
      }
      
      const updateData = { orderStatus };
      if (estimatedEarliestPickup) {
        updateData.estimatedEarliestPickup = estimatedEarliestPickup;
      }
      
      await db('FoodTruck.Orders')
        .where({ orderId })
        .update(updateData);
      
      return res.status(200).json({ message: 'order status updated successfully' });
      
    } catch (err) {
      console.error('Error updating order status:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 10. View Order Details for Truck Owner
  app.get('/api/v1/order/truckOwner/:orderId', async (req, res) => {
    try {
      const user = await getUser(req);
      const { orderId } = req.params;
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can view order details' });
      }
      
      // Get order details
      const order = await db('FoodTruck.Orders as o')
        .join('FoodTruck.Trucks as t', 'o.truckId', 't.truckId')
        .where({
          'o.orderId': orderId,
          'o.truckId': user.truckId
        })
        .select(
          'o.orderId',
          't.truckName',
          'o.orderStatus',
          'o.totalPrice',
          'o.scheduledPickupTime',
          'o.estimatedEarliestPickup',
          'o.createdAt'
        )
        .first();
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found or you do not have permission to view it' });
      }
      
      // Get order items
      const items = await db('FoodTruck.OrderItems as oi')
        .join('FoodTruck.MenuItems as mi', 'oi.itemId', 'mi.itemId')
        .where('oi.orderId', orderId)
        .select(
          'mi.name as itemName',
          'oi.quantity',
          'oi.price'
        );
      
      return res.status(200).json({
        ...order,
        items
      });
      
    } catch (err) {
      console.error('Error fetching order details:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================== CUSTOMER ENDPOINTS ====================

  // 11. View All Available Trucks
  app.get('/api/v1/trucks/view', async (req, res) => {
    try {
      const user = await getUser(req);
      
      if (user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can view available trucks' });
      }
      
      const trucks = await db('FoodTruck.Trucks')
        .where({
          truckStatus: 'available',
          orderStatus: 'available'
        })
        .orderBy('truckId', 'asc')
        .select('*');
      
      return res.status(200).json(trucks);
      
    } catch (err) {
      console.error('Error fetching trucks:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 12. View Menu Items for a Specific Truck
  app.get('/api/v1/menuItem/truck/:truckId', async (req, res) => {
    try {
      const user = await getUser(req);
      const { truckId } = req.params;
      
      if (user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can view truck menus' });
      }
      
      const menuItems = await db('FoodTruck.MenuItems')
        .where({
          truckId,
          status: 'available'
        })
        .orderBy('itemId', 'asc')
        .select('*');
      
      return res.status(200).json(menuItems);
      
    } catch (err) {
      console.error('Error fetching menu items:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 13. Search Menu Items by Category
  app.get('/api/v1/menuItem/truck/:truckId/category/:category', async (req, res) => {
    try {
      const user = await getUser(req);
      const { truckId, category } = req.params;
      
      if (user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can search menu items' });
      }
      
      const menuItems = await db('FoodTruck.MenuItems')
        .where({
          truckId,
          category,
          status: 'available'
        })
        .orderBy('itemId', 'asc')
        .select('*');
      
      return res.status(200).json(menuItems);
      
    } catch (err) {
      console.error('Error searching menu items:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 14. Add Menu Item to Cart
  app.post('/api/v1/cart/new', async (req, res) => {
    try {
      const user = await getUser(req);
      const { itemId, quantity, price } = req.body;
      
      if (user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can add items to cart' });
      }
      
      if (!itemId || !quantity || !price) {
        return res.status(400).json({ error: 'itemId, quantity, and price are required' });
      }
      
      // Check if item exists and is available
      const menuItem = await db('FoodTruck.MenuItems')
        .where({
          itemId,
          status: 'available'
        })
        .first();
      
      if (!menuItem) {
        return res.status(404).json({ error: 'Menu item not available' });
      }
      
      // Check if cart already has items from different trucks
      const existingCartItems = await db('FoodTruck.Carts as c')
        .join('FoodTruck.MenuItems as mi', 'c.itemId', 'mi.itemId')
        .where('c.userId', user.userId)
        .select('mi.truckId');
      
      if (existingCartItems.length > 0) {
        const existingTruckId = existingCartItems[0].truckId;
        if (existingTruckId !== menuItem.truckId) {
          return res.status(400).json({ message: 'Cannot order from multiple trucks' });
        }
      }
      
      await db('FoodTruck.Carts').insert({
        userId: user.userId,
        itemId,
        quantity,
        price
      });
      
      return res.status(200).json({ message: 'item added to cart successfully' });
      
    } catch (err) {
      console.error('Error adding to cart:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 15. View Cart
  app.get('/api/v1/cart/view', async (req, res) => {
    try {
      const user = await getUser(req);
      
      if (user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can view cart' });
      }
      
      const cartItems = await db('FoodTruck.Carts as c')
        .join('FoodTruck.MenuItems as mi', 'c.itemId', 'mi.itemId')
        .where('c.userId', user.userId)
        .orderBy('c.cartId', 'asc')
        .select(
          'c.cartId',
          'c.userId',
          'c.itemId',
          'mi.name as itemName',
          'c.price',
          'c.quantity'
        );
      
      return res.status(200).json(cartItems);
      
    } catch (err) {
      console.error('Error fetching cart:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 16. Update Cart Item Quantity
  app.put('/api/v1/cart/edit/:cartId', async (req, res) => {
    try {
      const user = await getUser(req);
      const { cartId } = req.params;
      const { quantity } = req.body;
      
      if (user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can edit cart' });
      }
      
      if (!quantity || quantity < 1) {
        return res.status(400).json({ error: 'Valid quantity is required' });
      }
      
      // Check if cart item exists and belongs to user
      const cartItem = await db('FoodTruck.Carts')
        .where({
          cartId,
          userId: user.userId
        })
        .first();
      
      if (!cartItem) {
        return res.status(404).json({ error: 'Cart item not found or you do not have permission to edit it' });
      }
      
      await db('FoodTruck.Carts')
        .where({ cartId })
        .update({ quantity });
      
      return res.status(200).json({ message: 'cart updated successfully' });
      
    } catch (err) {
      console.error('Error updating cart:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 17. Delete Item from Cart
  app.delete('/api/v1/cart/delete/:cartId', async (req, res) => {
    try {
      const user = await getUser(req);
      const { cartId } = req.params;
      
      if (user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can delete cart items' });
      }
      
      // Check if cart item exists and belongs to user
      const cartItem = await db('FoodTruck.Carts')
        .where({
          cartId,
          userId: user.userId
        })
        .first();
      
      if (!cartItem) {
        return res.status(404).json({ error: 'Cart item not found or you do not have permission to delete it' });
      }
      
      await db('FoodTruck.Carts')
        .where({ cartId })
        .del();
      
      return res.status(200).json({ message: 'item removed from cart successfully' });
      
    } catch (err) {
      console.error('Error deleting cart item:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 18. Place an Order
  app.post('/api/v1/order/new', async (req, res) => {
    try {
      const user = await getUser(req);
      const { scheduledPickupTime } = req.body;
      
      if (user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can place orders' });
      }
      
      if (!scheduledPickupTime) {
        return res.status(400).json({ error: 'scheduledPickupTime is required' });
      }
      
      // Get all cart items for user
      const cartItems = await db('FoodTruck.Carts as c')
        .join('FoodTruck.MenuItems as mi', 'c.itemId', 'mi.itemId')
        .where('c.userId', user.userId)
        .select(
          'c.*',
          'mi.truckId'
        );
      
      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }
      
      // Check if all items are from the same truck
      const truckIds = [...new Set(cartItems.map(item => item.truckId))];
      if (truckIds.length > 1) {
        return res.status(400).json({ error: 'Cannot order from multiple trucks' });
      }
      
      const truckId = truckIds[0];
      
      // Calculate total price
      const totalPrice = cartItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      // Start transaction
      await db.transaction(async (trx) => {
        // Create order
        const [order] = await trx('FoodTruck.Orders')
          .insert({
            userId: user.userId,
            truckId,
            orderStatus: 'pending',
            totalPrice,
            scheduledPickupTime,
            estimatedEarliestPickup: scheduledPickupTime // Default same as scheduled
          })
          .returning('*');
        
        // Create order items
        const orderItems = cartItems.map(item => ({
          orderId: order.orderId,
          itemId: item.itemId,
          quantity: item.quantity,
          price: item.price
        }));
        
        await trx('FoodTruck.OrderItems').insert(orderItems);
        
        // Clear cart
        await trx('FoodTruck.Carts')
          .where('userId', user.userId)
          .del();
      });
      
      return res.status(200).json({ message: 'order placed successfully' });
      
    } catch (err) {
      console.error('Error placing order:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 19. View My Orders
  app.get('/api/v1/order/myOrders', async (req, res) => {
    try {
      const user = await getUser(req);
      
      if (user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can view their orders' });
      }
      
      const orders = await db('FoodTruck.Orders as o')
        .join('FoodTruck.Trucks as t', 'o.truckId', 't.truckId')
        .where('o.userId', user.userId)
        .orderBy('o.orderId', 'desc')
        .select(
          'o.orderId',
          'o.userId',
          'o.truckId',
          't.truckName',
          'o.orderStatus',
          'o.totalPrice',
          'o.scheduledPickupTime',
          'o.estimatedEarliestPickup',
          'o.createdAt'
        );
      
      return res.status(200).json(orders);
      
    } catch (err) {
      console.error('Error fetching orders:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 20. View Order Details for Customer
  app.get('/api/v1/order/details/:orderId', async (req, res) => {
    try {
      const user = await getUser(req);
      const { orderId } = req.params;
      
      if (user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can view order details' });
      }
      
      // Get order details
      const order = await db('FoodTruck.Orders as o')
        .join('FoodTruck.Trucks as t', 'o.truckId', 't.truckId')
        .where({
          'o.orderId': orderId,
          'o.userId': user.userId
        })
        .select(
          'o.orderId',
          't.truckName',
          'o.orderStatus',
          'o.totalPrice',
          'o.scheduledPickupTime',
          'o.estimatedEarliestPickup',
          'o.createdAt'
        )
        .first();
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found or you do not have permission to view it' });
      }
      
      // Get order items
      const items = await db('FoodTruck.OrderItems as oi')
        .join('FoodTruck.MenuItems as mi', 'oi.itemId', 'mi.itemId')
        .where('oi.orderId', orderId)
        .select(
          'mi.name as itemName',
          'oi.quantity',
          'oi.price'
        );
      
      return res.status(200).json({
        ...order,
        items
      });
      
    } catch (err) {
      console.error('Error fetching order details:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

};

module.exports = { handlePrivateBackendApi };