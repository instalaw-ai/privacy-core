export {
  createDeviceIdentity,
  importDevicePrivateKey,
  importDevicePublicKey,
  type DeviceIdentity,
} from "./device-identity.js";

export {
  createChannelKey,
  wrapKeyForDevice,
  unwrapKeyForDevice,
  exportKeyToBase64,
  importKeyFromBase64,
} from "./key-management.js";

export {
  encryptMessage,
  decryptMessage,
  type EncryptedPayload,
} from "./message-encryption.js";

export {
  encryptFile,
  decryptFile,
  type EncryptedFile,
  type FileMetadata,
} from "./file-encryption.js";

export {
  bytesToBase64,
  base64ToBytes,
  bytesToHex,
  textToBytes,
  bytesToText,
  toUint8Array,
} from "./encoding.js";
