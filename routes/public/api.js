const { v4 } = require('uuid');
const db = require('../../connectors/db');
const axios = require('axios');

function handlePublicBackendApi(app) {

    // Register HTTP endpoint to create new user
    app.post('/api/v1/user', async function (req, res) {
        try {
            const { name, email, password, role, birthDate } = req.body;

            // Validate required fields
            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Name, email, and password are required' });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            // Validate role if provided
            if (role && !['customer', 'truckOwner'].includes(role)) {
                return res.status(400).json({ error: 'Role must be either "customer" or "truckOwner"' });
            }

            // Check if user already exists in the system
            const userExists = await db.select('*').from('FoodTruck.Users').where('email', email);

            if (userExists.length > 0) {
                return res.status(400).json({ error: 'User with this email already exists' });
            }

            const newUser = {
                name,
                email,
                password, // Note: In production, you should hash this password
                role: role || 'customer',
                birthDate: birthDate || new Date().toISOString().split('T')[0],
                createdAt: new Date()
            };

            const user = await db('FoodTruck.Users').insert(newUser).returning('*');

            // If user is a truckOwner, automatically create a truck for them
            if (role === 'truckOwner') {
                const truckName = `${name}'s Food Truck`;
                await db('FoodTruck.Trucks').insert({
                    truckName: truckName,
                    ownerId: user[0].userId,
                    truckStatus: 'available',
                    orderStatus: 'available',
                    createdAt: new Date()
                });
            }

            return res.status(201).json({
                message: 'User created successfully',
                user: {
                    userId: user[0].userId,
                    name: user[0].name,
                    email: user[0].email,
                    role: user[0].role,
                    birthDate: user[0].birthDate,
                    createdAt: user[0].createdAt
                }
            });

        } catch (e) {
            console.error('Registration error:', e.message);
            return res.status(500).json({ error: 'Could not register user' });
        }
    });

    // Login endpoint
    app.post('/api/v1/user/login', async function (req, res) {
        try {
            // Get user credentials from the JSON body
            const { email, password } = req.body;

            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }
            if (!password) {
                return res.status(400).json({ error: 'Password is required' });
            }

            // Check if user exists
            let user = await db.select('*').from('FoodTruck.Users').where('email', email);

            if (user.length === 0) {
                return res.status(400).json({ error: 'Invalid email or password' });
            }

            user = user[0];

            // Validate password (Note: In production, use bcrypt to compare hashed passwords)
            if (user.password !== password) {
                return res.status(400).json({ error: 'Invalid email or password' });
            }

            // Generate session token
            const token = v4();
            const currentDateTime = new Date();
            const expiresAt = new Date(+currentDateTime + 18000000); // 30 minutes from now

            // Create session
            const session = {
                userId: user.userId,
                token,
                expiresAt,
            };

            // Check for existing session and delete if exists
            await db('FoodTruck.Sessions').where('userId', user.userId).del();

            // Insert new session
            await db('FoodTruck.Sessions').insert(session);

            // Prepare user response (without password)
            const userResponse = {
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                birthDate: user.birthDate,
                createdAt: user.createdAt
            };

            // If user is a truck owner, include truck info
            if (user.role === 'truckOwner') {
                const truck = await db('FoodTruck.Trucks').where('ownerId', user.userId).first();
                if (truck) {
                    userResponse.truckId = truck.truckId;
                    userResponse.truckName = truck.truckName;
                }
            }

            // Set cookie and return response
            return res
                .cookie("session_token", token, {
                    expires: expiresAt,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                })
                .status(200)
                .json({
                    message: 'Login successful',
                    user: userResponse
                });

        } catch (e) {
            console.error('Login error:', e.message);
            return res.status(500).json({ error: 'Could not login user' });
        }
    });

    // Logout endpoint
    app.post('/api/v1/user/logout', async function (req, res) {
        try {
            const token = req.cookies?.session_token;

            if (token) {
                await db('FoodTruck.Sessions').where('token', token).del();
            }

            return res
                .clearCookie("session_token")
                .status(200)
                .json({ message: 'Logout successful' });

        } catch (e) {
            console.error('Logout error:', e.message);
            return res.status(500).json({ error: 'Could not logout user' });
        }
    });

    // Get user profile (public info)
    app.get('/api/v1/user/profile', async function (req, res) {
        try {
            // This endpoint might need authentication depending on your requirements
            // For now, it's public but you might want to make it private

            const { userId } = req.query;

            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            const user = await db('FoodTruck.Users')
                .where('userId', userId)
                .select('userId', 'name', 'email', 'role', 'birthDate', 'createdAt')
                .first();

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.status(200).json(user);

        } catch (e) {
            console.error('Profile error:', e.message);
            return res.status(500).json({ error: 'Could not fetch user profile' });
        }
    });

    // Health check endpoint
    app.get('/api/v1/health', async function (req, res) {
        try {
            // Test database connection
            await db.raw('SELECT 1');

            return res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'GIU Food-truck System Backend'
            });

        } catch (e) {
            console.error('Health check error:', e.message);
            return res.status(500).json({
                status: 'unhealthy',
                error: 'Database connection failed',
                timestamp: new Date().toISOString()
            });
        }
    });

    // View all trucks (public - no authentication required)
    app.get('/api/v1/trucks/public', async function (req, res) {
        try {
            const trucks = await db('FoodTruck.Trucks')
                .where({
                    truckStatus: 'available',
                    orderStatus: 'available'
                })
                .orderBy('truckId', 'asc')
                .select('*');

            return res.status(200).json(trucks);

        } catch (e) {
            console.error('Public trucks error:', e.message);
            return res.status(500).json({ error: 'Could not fetch trucks' });
        }
    });

    // View menu items for a specific truck (public)
    app.get('/api/v1/menuItem/truck/:truckId/public', async function (req, res) {
        try {
            const { truckId } = req.params;

            // First check if truck exists and is available
            const truck = await db('FoodTruck.Trucks')
                .where({
                    truckId,
                    truckStatus: 'available',
                    orderStatus: 'available'
                })
                .first();

            if (!truck) {
                return res.status(404).json({ error: 'Truck not found or not available' });
            }

            const menuItems = await db('FoodTruck.MenuItems')
                .where({
                    truckId,
                    status: 'available'
                })
                .orderBy('itemId', 'asc')
                .select('*');

            return res.status(200).json(menuItems);

        } catch (e) {
            console.error('Public menu items error:', e.message);
            return res.status(500).json({ error: 'Could not fetch menu items' });
        }
    });

};

module.exports = { handlePublicBackendApi };