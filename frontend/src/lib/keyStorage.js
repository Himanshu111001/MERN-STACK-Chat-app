
// Key names used for storage
const PRIVATE_KEY_PREFIX = 'e2ee_private_key_';

/**
 * Check if localStorage is available
 * @returns {boolean} - True if localStorage is available
 */
const isStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Save the private key to localStorage
 * 
 * @param {string} userId - The user ID
 * @param {string} privateKey - The private key as a base64 string
 */
export const savePrivateKey = (userId, privateKey) => {
  if (!userId || !privateKey || !isStorageAvailable()) return;
  
  try {
    localStorage.setItem(`${PRIVATE_KEY_PREFIX}${userId}`, privateKey);
    console.log('Private key saved successfully');
  } catch (error) {
    console.error('Error saving private key:', error);
  }
};

/**
 * Retrieve the private key from localStorage
 * 
 * @param {string} userId - The user ID
 * @returns {string|null} - The private key as a base64 string, or null if not found
 */
export const getPrivateKey = (userId) => {
  if (!userId || !isStorageAvailable()) return null;
  
  try {
    return localStorage.getItem(`${PRIVATE_KEY_PREFIX}${userId}`);
  } catch (error) {
    console.error('Error retrieving private key:', error);
    return null;
  }
};

/**
 * Remove the private key from localStorage
 * 
 * @param {string} userId - The user ID
 */
export const removePrivateKey = (userId) => {
  if (!userId || !isStorageAvailable()) return;
  
  try {
    localStorage.removeItem(`${PRIVATE_KEY_PREFIX}${userId}`);
    console.log('Private key removed successfully');
  } catch (error) {
    console.error('Error removing private key:', error);
  }
};

/**
 * Check if a private key exists for a user
 * 
 * @param {string} userId - The user ID
 * @returns {boolean} - True if a private key exists
 */
export const hasPrivateKey = (userId) => {
  if (!userId || !isStorageAvailable()) return false;
  return !!getPrivateKey(userId);
};

/**
 * Export private key as a file for backup
 * 
 * @param {string} userId - The user ID
 * @param {string} username - The user's name (for filename)
 */
export const exportPrivateKey = (userId, username) => {
  if (!userId) return;
  
  const privateKey = getPrivateKey(userId);
  if (!privateKey) {
    console.error('No private key found to export');
    return;
  }
  
  const blob = new Blob([privateKey], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${username.replace(/\s+/g, '_')}_private_key.txt`;
  a.click();
  
  URL.revokeObjectURL(url);
};

/**
 * Import private key from a file
 * 
 * @param {File} file - The file containing the private key
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} - True if import was successful
 */
export const importPrivateKey = (file, userId) => {
  return new Promise((resolve, reject) => {
    if (!file || !userId) {
      reject(new Error('File or userId missing'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const privateKey = event.target.result;
        savePrivateKey(userId, privateKey);
        resolve(true);
      } catch (error) {
        console.error('Error importing private key:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(error);
    };
    
    reader.readAsText(file);
  });
};
