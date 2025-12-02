const db = require('../connectors/db');

function getSessionToken(req) {
  if (!req.headers.cookie) {
    return null;
  }
  
  const cookies = req.headers.cookie.split(';')
    .map(function (cookie) { return cookie.trim(); })
    .filter(function (cookie) { return cookie.includes('session_token'); })
    .join('');

  const sessionToken = cookies.slice('session_token='.length);
  if (!sessionToken) {
    return null;
  }
  return sessionToken;
}

async function getUser(req) {
  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    console.log("No session token found");
    throw new Error('No session token found');
  }

  try {
    const user = await db.select('*')
      .from({ s: 'FoodTruck.Sessions' })
      .where('token', sessionToken)
      .innerJoin('FoodTruck.Users as u', 's.userId', 'u.userId')
      .first();

    if (!user) {
      throw new Error('Invalid session token');
    }

    // Check if token has expired
    const now = new Date();
    if (user.expiresAt && new Date(user.expiresAt) < now) {
      throw new Error('Session expired');
    }

    if (user.role === "truckOwner") {
      const TruckRecord = await db.select('*')
        .from('FoodTruck.Trucks')
        .where('ownerId', user.userId)
        .first();

      if (TruckRecord) {
        return {
          id: user.id,
          userId: user.userId,
          token: user.token,
          expiresAt: user.expiresAt,
          name: user.name,
          birthDate: user.birthDate,
          email: user.email,
          password: user.password,
          role: user.role,
          truckId: TruckRecord.truckId,
          truckName: TruckRecord.truckName,
          truckLogo: TruckRecord.truckLogo,
          ownerId: TruckRecord.ownerId,
          truckStatus: TruckRecord.truckStatus,
          orderStatus: TruckRecord.orderStatus,
          createdAt: user.createdAt
        };
      } else {
        console.log(`Truck owner ${user.name} (ID: ${user.userId}) has no associated truck`);
        return {
          id: user.id,
          userId: user.userId,
          token: user.token,
          expiresAt: user.expiresAt,
          name: user.name,
          birthDate: user.birthDate,
          email: user.email,
          password: user.password,
          role: user.role,
          truckId: null,
          createdAt: user.createdAt
        };
      }
    }

    // For customers
    return {
      id: user.id,
      userId: user.userId,
      token: user.token,
      expiresAt: user.expiresAt,
      name: user.name,
      birthDate: user.birthDate,
      email: user.email,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt
    };

  } catch (error) {
    console.error('Error in getUser function:', error.message);
    throw error;
  }
}

module.exports = { getSessionToken, getUser };