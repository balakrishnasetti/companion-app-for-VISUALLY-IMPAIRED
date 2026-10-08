const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const CallSession = require('../models/CallSession');

function readCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return ['', ''];
    return [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())];
  }).filter(([key]) => key));
}

function configureSockets(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || readCookies(socket.handshake.headers.cookie).bala_token;
      if (!token) return next(new Error('Authentication required.'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub).select('_id role status');
      if (!user || user.status !== 'ACTIVE') return next(new Error('Account unavailable.'));
      socket.data.userId = user.id;
      socket.data.role = user.role;
      return next();
    } catch {
      return next(new Error('Please sign in again to connect.'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);
    try {
      const volunteer = await Volunteer.findOne({ user: userId, verified: true, availability: 'AVAILABLE' });
      if (volunteer) socket.join('volunteers:available');
    } catch (error) {
      console.error('Could not load volunteer socket permissions:', error.message);
      socket.disconnect(true);
      return;
    }

    socket.on('volunteer:availability', async ({ available } = {}) => {
      if (socket.data.role !== 'VOLUNTEER' || typeof available !== 'boolean') return;
      const volunteer = await Volunteer.findOne({ user: userId, verified: true, availability: available ? 'AVAILABLE' : 'OFFLINE' });
      if (available && volunteer) socket.join('volunteers:available');
      else socket.leave('volunteers:available');
    });

    for (const type of ['offer', 'answer', 'ice-candidate']) {
      socket.on(`webrtc:${type}`, async (payload = {}) => {
        if (typeof payload.callId !== 'string' || !payload.signal || JSON.stringify(payload.signal).length > 100000) return;
        try {
          const call = await CallSession.findById(payload.callId);
          if (!call || call.status === 'ENDED') return;
          const callerId = call.user.toString();
          const volunteerId = call.volunteer.toString();
          if (userId !== callerId && userId !== volunteerId) return;
          const recipient = userId === callerId ? volunteerId : callerId;
          if (type === 'offer' && call.status === 'RINGING') {
            const connectedCall = await CallSession.findOneAndUpdate(
              { _id: call.id, status: 'RINGING' },
              { status: 'CONNECTED', startedAt: new Date() },
              { new: true },
            );
            if (connectedCall) {
              io.to(`user:${callerId}`).to(`user:${volunteerId}`).emit('call:connected', { callId: call.id });
            }
          }
          io.to(`user:${recipient}`).emit('webrtc:signal', {
            callId: call.id,
            fromId: userId,
            type,
            signal: payload.signal,
          });
        } catch (error) {
          console.error('WebRTC signal could not be relayed:', error.message);
        }
      });
    }
  });
}

module.exports = configureSockets;
