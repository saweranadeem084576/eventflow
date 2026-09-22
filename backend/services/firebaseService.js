const ApiError = require('../utils/apiError');
const config = require('../config');

let firebaseAdmin;

const getFirebaseAdmin = () => {
  if (!config.firebaseServiceAccountJson) return null;
  if (!firebaseAdmin) {
    const admin = require('firebase-admin');
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(config.firebaseServiceAccountJson);
    } catch (error) {
      throw new ApiError(500, 'Firebase service account configuration is invalid');
    }
    firebaseAdmin = admin.apps.length
      ? admin
      : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  return firebaseAdmin;
};

exports.isConfigured = () => Boolean(config.firebaseServiceAccountJson);

exports.verifyIdToken = async (token) => {
  const admin = getFirebaseAdmin();
  if (!admin) throw new ApiError(503, 'Firebase authentication is not configured');
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired Firebase token');
  }
};

exports.sendToTokens = async (tokens, notification) => {
  const admin = getFirebaseAdmin();
  if (!admin || !tokens.length) return null;
  return admin.messaging().sendEachForMulticast({ tokens, notification });
};