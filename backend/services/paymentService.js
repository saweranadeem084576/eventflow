const ApiError = require('../utils/apiError');
const Stripe = require('stripe');
const config = require('../config');

let stripeClient;

const getStripeClient = () => {
  if (!config.stripeSecretKey) {
    throw new ApiError(503, 'Payment gateway is not configured');
  }
  if (!stripeClient) stripeClient = new Stripe(config.stripeSecretKey);
  return stripeClient;
};

exports.createPaymentIntent = async ({ amount, currency, metadata }) => {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new ApiError(400, 'Payment amount must be a positive amount in the smallest currency unit');
  }

  return getStripeClient().paymentIntents.create({ amount, currency, metadata });
};

exports.confirmPayment = async (providerPaymentId) => {
  if (!providerPaymentId) throw new ApiError(400, 'Payment provider id is required');
  return getStripeClient().paymentIntents.retrieve(providerPaymentId);
};

// Used to discard an intent this server created but will not use.
exports.cancelPaymentIntent = async (providerPaymentId) => {
  if (!providerPaymentId) throw new ApiError(400, 'Payment provider id is required');
  return getStripeClient().paymentIntents.cancel(providerPaymentId);
};

exports.refundPayment = async (providerPaymentId) => {
  if (!providerPaymentId) throw new ApiError(400, 'Payment provider id is required');
  return getStripeClient().refunds.create({ payment_intent: providerPaymentId });
};

exports.constructWebhookEvent = (payload, signature) => {
  if (!config.stripeWebhookSecret) {
    throw new ApiError(503, 'Payment webhook is not configured');
  }
  try {
    return getStripeClient().webhooks.constructEvent(payload, signature, config.stripeWebhookSecret);
  } catch (error) {
    throw new ApiError(400, 'Invalid payment webhook signature');
  }
};
