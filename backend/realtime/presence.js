const states = new Map();

const connectUser = (userId) => {
    const id = String(userId);
    const state = states.get(id) || { connections: 0, lastSeenAt: null };
    state.connections += 1;
    states.set(id, state);
    return { online: true, lastSeenAt: state.lastSeenAt };
};

const disconnectUser = (userId) => {
    const id = String(userId);
    const state = states.get(id) || { connections: 0, lastSeenAt: null };
    state.connections = Math.max(0, state.connections - 1);
    if (!state.connections) state.lastSeenAt = new Date();
    states.set(id, state);
    return { online: state.connections > 0, lastSeenAt: state.lastSeenAt };
};

const getPresence = (userId) => {
    const state = states.get(String(userId));
    return { online: Boolean(state?.connections), lastSeenAt: state?.lastSeenAt || null };
};

module.exports = { connectUser, disconnectUser, getPresence };
