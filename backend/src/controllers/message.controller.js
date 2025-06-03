import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { generateNonce } from "../lib/encryption.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserPublicKey = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("publicKey");
    
    if (!user || !user.publicKey) {
      return res.status(404).json({ error: "User public key not found" });
    }
    
    res.status(200).json({ publicKey: user.publicKey });
  } catch (error) {
    console.error("Error in getUserPublicKey: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, encryptedText, encryptedImage, nonce } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    
    // Check if the message is encrypted
    const isEncrypted = Boolean(encryptedText || encryptedImage);

    const newMessage = new Message({
      senderId,
      receiverId,
      // For backward compatibility, still include unencrypted text/image if provided
      text: isEncrypted ? undefined : text,
      image: isEncrypted ? undefined : imageUrl,
      // Add encrypted data
      encryptedText,
      encryptedImage,
      nonce,
      isEncrypted,
    });

    await newMessage.save();

    // Get recipient's socket ID and send the message
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
