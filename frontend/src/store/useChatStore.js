import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { 
  encryptMessage, 
  decryptMessage, 
  generateNonce 
} from "../lib/encryption";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const messages = res.data;
      
      // Attempt to decrypt all encrypted messages
      const decryptedMessages = await Promise.all(messages.map(async (message) => {
        // Skip if not encrypted
        if (!message.isEncrypted) {
          return message;
        }
        
        try {
          const authUser = useAuthStore.getState().authUser;
          const recipientPrivateKey = useAuthStore.getState().getUserPrivateKey();
          
          // Determine if current user is sender or receiver
          const isCurrentUserSender = message.senderId === authUser._id;
          
          // Get the other user's public key
          const otherUserId = isCurrentUserSender ? message.receiverId : message.senderId;
          const otherUserPublicKey = await get().getUserPublicKey(otherUserId);
          
          if (recipientPrivateKey && otherUserPublicKey && message.nonce) {
            const userPrivateKey = recipientPrivateKey;
            const otherPartyPublicKey = otherUserPublicKey;
            
            // If current user is sender, swap the keys for decryption
            const senderPublicKey = isCurrentUserSender ? authUser.publicKey : otherUserPublicKey;
            const recipientPrivKey = isCurrentUserSender ? recipientPrivateKey : recipientPrivateKey;
            
            // Decrypt text if present
            if (message.encryptedText) {
              const decryptedText = decryptMessage(
                message.encryptedText,
                message.nonce,
                senderPublicKey,
                recipientPrivKey
              );
              
              if (decryptedText) {
                message.text = decryptedText;
              }
            }
            
            // Decrypt image if present
            if (message.encryptedImage) {
              const decryptedImage = decryptMessage(
                message.encryptedImage,
                message.nonce,
                senderPublicKey,
                recipientPrivKey
              );
              
              if (decryptedImage) {
                message.image = decryptedImage;
              }
            }
          }
        } catch (error) {
          console.error("Error decrypting message:", error);
        }
        
        return message;
      }));
      
      set({ messages: decryptedMessages });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },sendMessage: async (messageData) => {
    const { selectedUser, messages, getUserPublicKey } = get();
    try {
      // Get the recipient's public key
      const recipientPublicKey = await getUserPublicKey(selectedUser._id);
      
      // Get sender's private key from localStorage
      const senderPrivateKey = useAuthStore.getState().getUserPrivateKey();
      
      if (!recipientPublicKey || !senderPrivateKey) {
        // Fall back to unencrypted messaging if keys are not available
        const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
        set({ messages: [...messages, res.data] });
        return;
      }
      
      // Generate a unique nonce for this message
      const nonce = generateNonce();
      
      // Prepare the encrypted message data
      const encryptedData = {};
      
      // Encrypt text if provided
      if (messageData.text) {
        const encryptedText = encryptMessage(
          messageData.text,
          nonce,
          recipientPublicKey,
          senderPrivateKey
        );
        encryptedData.encryptedText = encryptedText;
      }
      
      // For image encryption, we're only encrypting the URL or base64 data
      if (messageData.image) {
        const encryptedImage = encryptMessage(
          messageData.image,
          nonce,
          recipientPublicKey,
          senderPrivateKey
        );
        encryptedData.encryptedImage = encryptedImage;
      }
      
      // Send the encrypted message to the server
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, {
        ...encryptedData,
        nonce,
      });
      
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
      console.error("Error sending encrypted message:", error);
    }
  },
  subscribeToMessages: () => {
    const { selectedUser, getUserPublicKey } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", async (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;
      
      // Check if message is encrypted
      if (newMessage.isEncrypted) {
        try {
          // Get the sender's public key
          const senderPublicKey = await getUserPublicKey(newMessage.senderId);
          
          // Get recipient's (current user's) private key from localStorage
          const recipientPrivateKey = useAuthStore.getState().getUserPrivateKey();
          
          if (senderPublicKey && recipientPrivateKey && newMessage.nonce) {
            // Decrypt the message parts
            if (newMessage.encryptedText) {
              const decryptedText = decryptMessage(
                newMessage.encryptedText,
                newMessage.nonce,
                senderPublicKey,
                recipientPrivateKey
              );
              
              if (decryptedText) {
                newMessage.text = decryptedText;
              }
            }
            
            if (newMessage.encryptedImage) {
              const decryptedImage = decryptMessage(
                newMessage.encryptedImage,
                newMessage.nonce,
                senderPublicKey,
                recipientPrivateKey
              );
              
              if (decryptedImage) {
                newMessage.image = decryptedImage;
              }
            }
          }
        } catch (error) {
          console.error("Error decrypting message:", error);
        }
      }

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },
  
  getUserPublicKey: async (userId) => {
    try {
      const res = await axiosInstance.get(`/messages/publicKey/${userId}`);
      return res.data.publicKey;
    } catch (error) {
      toast.error("Failed to get user's public key");
      console.error("Error getting public key:", error);
      return null;
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
