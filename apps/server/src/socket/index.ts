import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { Driver } from '../models/Driver';
import { Booking } from '../models/Booking';

// In-memory map of userId → socketId for targeted emissions
const connectedSockets = new Map<string, string>(); // userId → socket.id
const driverSocketMap = new Map<string, string>(); // driverId → socket.id

export function setupSocketIO(io: SocketIOServer) {
  // ─── Auth Middleware for all namespaces ──────────────────────────────────────
  const authMiddleware = (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  };

  // ─── Customer Namespace ───────────────────────────────────────────────────────
  const customerNs = io.of('/customer');
  customerNs.use(authMiddleware);

  customerNs.on('connection', async (socket: Socket) => {
    const user = (socket as any).user;
    if (user.role !== 'customer') {
      socket.disconnect();
      return;
    }

    connectedSockets.set(user.userId, socket.id);
    logger.info({ userId: user.userId, socketId: socket.id }, 'Customer connected');

    // Reconnect/resume: rejoin active trip room
    socket.on('join:active', async () => {
      try {
        const booking = await Booking.findOne({
          customerId: user.userId,
          status: { $in: ['searching', 'assigned', 'driver_arrived', 'otp_verified', 'started'] },
        }).populate('driverId', 'name phone rating kyc.photoUrl location');

        if (booking) {
          socket.join(`trip:${booking._id}`);
          socket.emit('trip:sync', { booking });
          logger.info({ bookingId: booking._id, userId: user.userId }, 'Customer rejoined trip room');
        }
      } catch (error) {
        logger.error({ error }, 'Failed to rejoin trip room');
      }
    });

    socket.on('disconnect', () => {
      connectedSockets.delete(user.userId);
      logger.info({ userId: user.userId }, 'Customer disconnected');
    });
  });

  // ─── Driver Namespace ─────────────────────────────────────────────────────────
  const driverNs = io.of('/driver');
  driverNs.use(authMiddleware);

  driverNs.on('connection', async (socket: Socket) => {
    const user = (socket as any).user;
    if (user.role !== 'driver') {
      socket.disconnect();
      return;
    }

    driverSocketMap.set(user.userId, socket.id);
    logger.info({ driverId: user.userId, socketId: socket.id }, 'Driver connected');

    // Reconnect/resume: rejoin active trip room
    socket.on('join:active', async () => {
      try {
        const booking = await Booking.findOne({
          driverId: user.userId,
          status: { $in: ['assigned', 'driver_arrived', 'otp_verified', 'started'] },
        }).populate('customerId', 'name phone rating');

        if (booking) {
          socket.join(`trip:${booking._id}`);
          socket.emit('trip:sync', { booking });
          logger.info({ bookingId: booking._id, driverId: user.userId }, 'Driver rejoined trip room');
        }
      } catch (error) {
        logger.error({ error }, 'Failed to rejoin trip room');
      }
    });

    // Driver emits location updates during a trip
    socket.on('location:update', async (data: { bookingId: string; lat: number; lng: number; heading?: number }) => {
      const { bookingId, lat, lng, heading } = data;

      // Emit to trip room (customer + driver connected to same trip)
      // NOTE: location ticks are NOT written to DB per tick
      // DB checkpoint happens every ~30s via the interval below
      socket.to(`trip:${bookingId}`).emit('location:update', {
        lat,
        lng,
        heading,
        driverId: user.userId,
        timestamp: Date.now(),
      });
    });

    // Accept a booking request
    socket.on('booking:accept', async (data: { bookingId: string }) => {
      try {
        const booking = await Booking.findOneAndUpdate(
          { _id: data.bookingId, status: 'searching' },
          { $set: { status: 'assigned', driverId: user.userId, 'timestamps.assignedAt': new Date() } },
          { new: true },
        ).populate('customerId', '_id');

        if (!booking) {
          socket.emit('booking:accept:error', { message: 'Booking no longer available' });
          return;
        }

        // Driver joins the trip room
        socket.join(`trip:${booking._id}`);

        // Notify the customer
        const customerSocketId = connectedSockets.get(booking.customerId.toString());
        if (customerSocketId) {
          customerNs.to(customerSocketId).emit('booking:assigned', { booking });
          // Customer also joins the trip room via REST reconciliation
        }

        socket.emit('booking:accept:success', { booking });
        logger.info({ bookingId: data.bookingId, driverId: user.userId }, 'Booking accepted via socket');
      } catch (error) {
        socket.emit('booking:accept:error', { message: 'Failed to accept booking' });
      }
    });

    socket.on('disconnect', () => {
      driverSocketMap.delete(user.userId);
      logger.info({ driverId: user.userId }, 'Driver disconnected');
    });
  });

  // ─── Admin Namespace ──────────────────────────────────────────────────────────
  const adminNs = io.of('/admin');
  adminNs.use(authMiddleware);

  adminNs.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    if (user.role !== 'admin') {
      socket.disconnect();
      return;
    }

    socket.join('admin:global');
    logger.info({ adminId: user.userId }, 'Admin connected to socket');

    socket.on('disconnect', () => {
      logger.info({ adminId: user.userId }, 'Admin disconnected');
    });
  });

  // ─── Helper Exports ───────────────────────────────────────────────────────────

  return {
    // Emit to a specific customer
    emitToCustomer: (customerId: string, event: string, data: any) => {
      const socketId = connectedSockets.get(customerId);
      if (socketId) {
        customerNs.to(socketId).emit(event, data);
      }
    },

    // Emit to a specific driver
    emitToDriver: (driverId: string, event: string, data: any) => {
      const socketId = driverSocketMap.get(driverId);
      if (socketId) {
        driverNs.to(socketId).emit(event, data);
      }
    },

    // Emit to a trip room (customer + driver)
    emitToTrip: (bookingId: string, event: string, data: any) => {
      customerNs.to(`trip:${bookingId}`).emit(event, data);
      driverNs.to(`trip:${bookingId}`).emit(event, data);
    },

    // Broadcast booking request to nearby drivers
    broadcastToDrivers: async (driverIds: string[], event: string, data: any) => {
      for (const driverId of driverIds) {
        const socketId = driverSocketMap.get(driverId);
        if (socketId) {
          driverNs.to(socketId).emit(event, data);
        }
      }
    },

    customerNs,
    driverNs,
    adminNs,
    connectedSockets,
    driverSocketMap,
  };
}

export type SocketService = ReturnType<typeof setupSocketIO>;
