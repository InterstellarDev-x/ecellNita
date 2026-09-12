// Only server-selected user rooms may receive private events.
let server;
const userRoom = (id) => `user:${String(id)}`;
const setServer = (io) => { server = io; };
const emitToUsers = (ids, event, payload = {}) => {
    if (server) server.to([...new Set(ids.filter(Boolean).map(userRoom))]).emit(event, payload);
};
const disconnectUser = (id) => server?.in(userRoom(id)).disconnectSockets(true);
module.exports = { setServer, userRoom, emitToUsers, disconnectUser };
