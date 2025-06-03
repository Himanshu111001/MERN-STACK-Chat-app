import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import { 
  savePrivateKey as saveKey, 
  getPrivateKey as getKey 
} from './keyStorage';

// Extract the needed functions from the utility package
const { encodeBase64, decodeBase64 } = util;

/**
 * Save the user's private key to localStorage
 * @param {string} userId - User ID
 * @param {string} privateKey - Base64 encoded private key
 */
export const savePrivateKey = (userId, privateKey) => {
  saveKey(userId, privateKey);
};

/**
 * Retrieve the user's private key from localStorage
 * @param {string} userId - User ID
 * @returns {string|null} - Base64 encoded private key or null if not found
 */
export const getPrivateKey = (userId) => {
  return getKey(userId);
};

/**
 * Convert a string to Uint8Array
 * @param {string} str - String to convert
 * @returns {Uint8Array} - Uint8Array representation
 */
export const strToUint8Array = (str) => {
  return decodeBase64(str);
};

/**
 * Convert Uint8Array to string
 * @param {Uint8Array} uint8Array - Uint8Array to convert
 * @returns {string} - Base64 encoded string
 */
export const uint8ArrayToStr = (uint8Array) => {
  return encodeBase64(uint8Array);
};

/**
 * Generate a random nonce
 * @returns {string} - Base64 encoded nonce
 */
export const generateNonce = () => {
  const nonce = nacl.randomBytes(24); // NaCl box nonce is 24 bytes
  return uint8ArrayToStr(nonce);
};

/**
 * Encrypt a message using NaCl box
 * @param {string} message - Message to encrypt
 * @param {string} nonce - Base64 encoded nonce
 * @param {string} recipientPublicKey - Base64 encoded recipient's public key
 * @param {string} senderPrivateKey - Base64 encoded sender's private key
 * @returns {string} - Base64 encoded encrypted message
 */
export const encryptMessage = (message, nonce, recipientPublicKey, senderPrivateKey) => {
  // Convert string parameters to Uint8Array
  const messageUint8 = new TextEncoder().encode(message);
  const nonceUint8 = strToUint8Array(nonce);
  const recipientPublicKeyUint8 = strToUint8Array(recipientPublicKey);
  const senderPrivateKeyUint8 = strToUint8Array(senderPrivateKey);

  // Encrypt the message
  const encryptedMessage = nacl.box(
    messageUint8,
    nonceUint8,
    recipientPublicKeyUint8,
    senderPrivateKeyUint8
  );

  // Return the encrypted message as a Base64 string
  return uint8ArrayToStr(encryptedMessage);
};

/**
 * Decrypt a message using NaCl box.open
 * @param {string} encryptedMessage - Base64 encoded encrypted message
 * @param {string} nonce - Base64 encoded nonce
 * @param {string} senderPublicKey - Base64 encoded sender's public key
 * @param {string} recipientPrivateKey - Base64 encoded recipient's private key
 * @returns {string|null} - Decrypted message or null if decryption fails
 */
export const decryptMessage = (encryptedMessage, nonce, senderPublicKey, recipientPrivateKey) => {
  try {
    // Convert string parameters to Uint8Array
    const encryptedMessageUint8 = strToUint8Array(encryptedMessage);
    const nonceUint8 = strToUint8Array(nonce);
    const senderPublicKeyUint8 = strToUint8Array(senderPublicKey);
    const recipientPrivateKeyUint8 = strToUint8Array(recipientPrivateKey);

    // Decrypt the message
    const decryptedMessage = nacl.box.open(
      encryptedMessageUint8,
      nonceUint8,
      senderPublicKeyUint8,
      recipientPrivateKeyUint8
    );

    if (!decryptedMessage) return null;

    // Return the decrypted message as a string
    return new TextDecoder().decode(decryptedMessage);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};
