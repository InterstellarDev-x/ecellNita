To contribute to this project follow the guide.

- clone the project.
- go to vs code prompt.
- type npm i
- create .env file inside backend folder.
- initialize variables in .env file.
  # database details.
  PORT=4000
  

  MONGODB_URL=  --create cluster in mongodb and paste url--
  
  # cloudinary details.
  CLOUD_NAME=  <create account in cloudinary and paste name , api-secret, api-key>
  

  API_KEY=
  

  API_SECRET=
  

  FOLDER_NAME="nitaspace"
  
  
  # mail sender deatils
  MAIL_HOST=smtp.gmail.com  


  MAIL_USER=  --user your email id--
  

  MAIL_PASS=  --use a Gmail App Password, not your normal Google password--
  
  
  
  #jwt
  JWT_SECRET="nita"

- go to vs code prompt and use command npm start.

## Live chat and notifications

The Express server also hosts Socket.IO on the same port at `/socket.io/`.
Set `HOST` to the frontend origin(s), comma-separated, and ensure the reverse proxy
forwards WebSocket upgrades to the Node server. The frontend derives the socket
origin from `VITE_BASE_URL`; set `VITE_SOCKET_URL` if the socket origin differs.
Both services must be restarted after installing the new dependencies.

Each socket authenticates with the existing JWT and joins only its own user room.
Messages are stored before acknowledgement; client message IDs prevent duplicate
sends on retry. Reconnect and tab focus reload persisted chats and notifications.
Price offers record an agreement in chat; accepting one does not change the public
listing price, create a purchase request, or complete a sale. Existing questions
remain available in the Messages page under “Previous questions & replies”.

Notification model hooks push updates for creation, upserts, read state, and
removal, covering the existing question, meeting, and transaction notifications.
No notification polling is required. New chat collections and indexes are created
by Mongoose; no migration of existing question records is needed.

The current room adapter supports one Node server process. Before scaling to
multiple processes or replicas, configure a shared Socket.IO adapter so events
reach clients on other instances.

Run `npm test` for backend checks. The chat integration suite starts isolated
MongoDB and real WebSocket clients; its first run downloads a MongoDB test binary.
It does not connect to the configured application database.
