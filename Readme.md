# Pigon Micro

**Pigon Micro** is a self‑hosted, end‑to‑end encrypted chat application. It supports private and group conversations, file sharing (images/videos), voice/video calls with screen sharing, and a fully encrypted key management system. The project consists of a React/TypeScript frontend and a Node.js/Express backend, communicating via REST API, Socket.IO (real‑time messaging), and WebRTC (calls).

<!-- ![Screenshot placeholder](https://via.placeholder.com/800x400?text=Pigon+Micro+Demo) -->

## Features

- 🔐 **End‑to‑end encryption** – All messages, files, and keys are encrypted on the client.
- 💬 **Private & group chats** – Direct conversations and group chats with participant management.
- 📎 **File sharing** – Send encrypted images and videos; files are stored on the server and cached in IndexedDB.
- 📞 **Voice & video calls** – WebRTC‑based 1‑on‑1 calls with optional screen sharing.
- 🔑 **Key management** – Master key (password‑protected), per‑chat ephemeral keys, and automatic key rotation.
- 👤 **User profiles** – Profile pictures, account settings, logout.
- 🐳 **Docker support** – Ready‑to‑use `docker-compose` for the whole stack.

## Tech Stack

### Frontend (`pigon-micro-web/`)
- React 19 + TypeScript
- Vite (build tool)
- Socket.IO client (real‑time signalling)
- Axios (HTTP client)
- IndexedDB (local key & file cache)
- Web Crypto API (encryption/decryption)

### Backend (`server/`)
- Node.js + Express
- Socket.IO (real‑time events, call signalling)
- MySQL / MariaDB (data persistence)
- Multer (file uploads)
- Bcrypt (password hashing)
- JWT‑like tokens (UUID based, stored in DB)

## Prerequisites

- Node.js (v24+ recommended)
- MySQL or MariaDB
- Docker & Docker Compose (optional, for containerised deployment)
- Git
- Reverse Proxy for https (not needed for dev environment)

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/kiralysanyi/pigon-micro.git
cd pigon-micro
```

### 2. Set up the database
Import the provided SQL schema:
```bash
mysql -u root -p < pigonmicro.sql
```
Or use your favourite database tool to execute `pigonmicro.sql`.

### 3. Configure environment variables
Copy the example configuration and edit it:
```bash
cp server/.env.example server/.env
```
Adjust the following values in `server/.env`:

| Variable           | Description                                      |
|--------------------|--------------------------------------------------|
| `PORT`             | HTTP port for the server (default: 8080)         |
| `DB_HOST`          | MySQL host (e.g., `localhost` or `db`)           |
| `DB_USER`          | MySQL user                                       |
| `DB_PASS`          | MySQL password                                   |
| `DB_DATABASE`      | Database name (default: `pigonmicro`)            |
| `REGISTER_ENABLED` | Allow new user registration (`true`/`false`)     |
| `USERFILES`        | Absolute path to store profile pictures & media |
| `PFP_MAX_SIZE`     | Max profile picture size in MB (default: 1)      |
| `MEDIA_MAX_SIZE`   | Max file upload size in MB (default: 100)        |

### 4. Build the frontend
```bash
cd pigon-micro-web
npm install
npm run build
```
The built files will be placed in `dist/`. When running the backend in production, it will serve these static files automatically if they exist.

### 5. Build the backend
```bash
cd ../server
npm install
npm run build
```
This compiles TypeScript to `dist/`.

### 6. (Optional) Run the build script
The project includes a `build.sh` script that performs steps 4 & 5 and packages everything into a `build/` directory ready for Docker.
```bash
chmod +x build.sh
./build.sh
```

## Running the Application

### Development Mode
Start backend with hot‑reload:
```bash
cd server
npm run start
```
Start frontend dev server (Vite):
```bash
cd pigon-micro-web
npm run dev
```
Access the frontend at `http://localhost:5173` (ensure the backend API is reachable – see `pigon-micro-web/src/conf.ts`).

### Production Mode (without Docker)

#### Notes for deployment

You will need a reverse proxy with https for two reasons:
- Improve the security of the app
- WebCrypto wont work on http sites

Build both parts (as above), then run:
```bash
cd server
npm run start-prod
```
The backend will serve the built frontend from `./public`.

## Docker Deployment

A `docker-compose.yaml` is provided to run the whole stack (backend + MariaDB) with a single command.

1. Make sure `pigonmicro.sql` is present in the project root.
2. Build the Docker image (or use the pre‑built one from GHCR):
   ```bash
   docker-compose up -d
   ```
   This will start the `pigon-micro` service and a `db` container. The first startup initialises the database using the SQL file.
3. Access the application at `http://localhost:8080`.

> **Note:** The Docker image expects the frontend build to be present in `./build/public` (created by `build.sh`). The `docker-compose` file uses the `testing` tag – adapt to your own image if needed.

## API Overview (Selected Endpoints)

All API routes are prefixed with `/api/v1`. A valid access token (Bearer) is required for most endpoints.

### Authentication (`/auth`)
| Method | Endpoint               | Description                     |
|--------|------------------------|---------------------------------|
| POST   | `/register`            | Create a new user               |
| POST   | `/login`               | Obtain access/refresh tokens    |
| GET    | `/token`               | Refresh access token            |
| GET    | `/refreshtoken`        | Rotate refresh token            |
| GET    | `/info`                | Get current user info           |
| GET    | `/users`               | List other users                |
| POST   | `/logout`              | Invalidate tokens               |
| GET    | `/pfp/:id`             | Get profile picture by user ID  |
| POST   | `/pfp`                 | Upload profile picture          |

### Chats (`/chat`)
| Method | Endpoint                         | Description                         |
|--------|----------------------------------|-------------------------------------|
| POST   | `/`                              | Create a private chat               |
| POST   | `/group`                         | Create a group chat                 |
| GET    | `/`                              | List all chats for the user         |
| GET    | `/:id`                           | Get chat details                    |
| GET    | `/:chatID/messages`              | Get last 100 messages               |
| DELETE | `/:id`                           | Delete a group (only creator)       |
| POST   | `/group/:chatID/user/:userId`    | Add user to group                   |
| DELETE | `/group/:chatID/user/:userId`    | Remove user from group              |

### Keyring (`/keyring`)
| Method | Endpoint                         | Description                           |
|--------|----------------------------------|---------------------------------------|
| GET    | `/masterkey`                     | Get wrapped master key                |
| POST   | `/masterkey`                     | Store wrapped master key              |
| POST   | `/pubkey`                        | Upload user’s ECDH public key         |
| POST   | `/privkey`                       | Upload encrypted ECDH private key     |
| GET    | `/pubkey`                        | Get own or another user’s public key  |
| GET    | `/chatkeys/self`                 | List own chat key pairs               |
| POST   | `/chatkeys/self`                 | Upload new chat key pair              |
| GET    | `/chatkeys/key/:keyid`           | Get a specific public key by ID       |
| GET    | `/chatkeys/user/:userid`         | List a user’s public keys             |
| GET    | `/groupkeys/:chatID/:kGuid`      | Get a group key by GUID               |
| POST   | `/groupkeys/:chatID`             | Upload an encrypted group key         |

### CDN (`/cdn`)
| Method | Endpoint               | Description                           |
|--------|------------------------|---------------------------------------|
| GET    | `/:assetId`            | Download a file (chat media)          |
| POST   | `/:chatId`             | Upload a file to a chat               |

## Encryption Overview

Pigon Micro uses the **Web Crypto API** and implements the following cryptographic layers:

- **Master key** – AES‑GCM 256, wrapped with a key derived from the user’s keyring password (PBKDF2, 600k iterations). It is stored on the server.
- **ECDH key pairs (P‑256)** – Each user has a long‑lived key pair for establishing shared secrets.
- **Per‑chat keys** – AES‑GCM keys used to encrypt messages and files. For private chats, a shared AES key is derived via ECDH using active chat key pairs. For group chats, a symmetric group key is distributed (encrypted with each member’s ECDH shared secret).
- **Key rotation** – Chat keys are rotated every 10 minutes (configurable) and new keys are distributed automatically.
- **File encryption** – Files are encrypted with the chat’s current AES key before upload. The server stores only the encrypted blob.
- **Local caching** – Keys and files are cached in IndexedDB for offline access and performance.

## Building & Testing

- Lint frontend: `cd pigon-micro-web && npm run lint`
- Build frontend: `npm run build`
- Build backend: `cd server && npm run build`

A GitHub Actions workflow (`.github/workflows/build-testing.yaml`) is included that builds the Docker image on every push to the `testing` branch.

## Troubleshooting

- **“No master key found”** – The user needs to go through the initial setup (`/setup`) to generate and upload a master key.
- **403 on chat endpoints** – The user is not a participant in that chat.
- **File upload fails with 413** – The file exceeds the configured `MEDIA_MAX_SIZE`.
- **Calls not connecting** – Ensure the signalling server (Socket.IO) is reachable. Check browser console for WebRTC ICE failures.
- **Decryption errors** – Verify that the keyring password is correct and that the user’s keys are properly uploaded.

## License

This project is licensed under the **GNU Affero General Public License v3.0** – see the [LICENSE](LICENSE) file for details.

---

**Author:** Király Sándor  
**Repository:** [https://github.com/kiralysanyi/pigon-micro](https://github.com/kiralysanyi/pigon-micro)  
**Disclaimer:** This readme.md was mostly written by AI (Deepseek).