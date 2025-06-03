# End-to-End Encryption Implementation

This document provides an overview of the End-to-End Encryption (E2EE) implementation in this MERN Stack Chat Application.

## Overview

The application uses the NaCl (pronounced "salt") cryptography library via the `tweetnacl` and `tweetnacl-util` packages to implement public-key (asymmetric) cryptography for secure messaging.

## Key Components

### Backend Components

1. **User Model (`/backend/src/models/user.model.js`)**
   - Added `publicKey` field to store each user's public key

2. **Message Model (`/backend/src/models/message.model.js`)**
   - Added fields to support encrypted messages:
     - `encryptedText` - For encrypted message text
     - `encryptedImage` - For encrypted image URLs/data
     - `nonce` - Unique value used for each encryption operation
     - `isEncrypted` - Flag to indicate if a message is encrypted

3. **Encryption Utilities (`/backend/src/lib/encryption.js`)**
   - Contains functions for key generation, encryption, and decryption
   - Server only handles encrypted data; it never has access to private keys

4. **Auth Controller (`/backend/src/controllers/auth.controller.js`)**
   - Generates a keypair during user registration
   - Stores only the public key in the database
   - Sends the private key to the client for secure storage

### Frontend Components

1. **Encryption Utilities (`/frontend/src/lib/encryption.js`)**
   - Client-side encryption and decryption functions
   - Works with the `keyStorage.js` utilities

2. **Key Storage (`/frontend/src/lib/keyStorage.js`)**
   - Manages secure storage of private keys in the browser's localStorage
   - Provides import/export functionality for key backup

3. **E2EE Key Management Component (`/frontend/src/components/E2EEKeyManagement.jsx`)**
   - User interface for managing encryption keys
   - Allows users to export their private key for safekeeping
   - Allows importing previously exported keys

4. **Auth Store (`/frontend/src/store/useAuthStore.js`)**
   - Receives and stores private key during registration
   - Provides methods to access the current user's private key

5. **Chat Store (`/frontend/src/store/useChatStore.js`)**
   - Handles encryption of outgoing messages
   - Handles decryption of incoming messages
   - Manages retrieval of other users' public keys

## Encryption Flow

1. **Key Generation**
   - During registration, a public/private key pair is generated
   - Public key is stored on the server
   - Private key is sent to the client and stored in localStorage

2. **Sending Messages**
   - Client retrieves recipient's public key
   - Message is encrypted using recipient's public key and sender's private key
   - A unique nonce is generated for each message
   - Only the encrypted data and nonce are sent to the server

3. **Receiving Messages**
   - Client receives encrypted message with nonce
   - Using sender's public key and recipient's private key, message is decrypted
   - Decrypted content is displayed to the user

## Security Notes

- Private keys are never transmitted over the network after initial registration
- Each message uses a unique nonce to prevent replay attacks
- Users are responsible for backing up their private keys
- If a user loses their private key, they will lose access to all encrypted messages

## Limitations

- Images are encrypted as base64 strings before upload, not as binary files
- File attachments other than images are not currently supported
- Group chats would require a different encryption approach

## Future Improvements

- Add support for encrypted file attachments
- Implement secure key recovery mechanisms
- Add perfect forward secrecy by rotating keys
- Add support for encrypted group messaging
