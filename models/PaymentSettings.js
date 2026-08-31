const mongoose = require('mongoose');

const paymentSettingsSchema = new mongoose.Schema({
  mpesa: {
    paybill: { type: String, default: '123456' },
    accountNumber: { type: String, default: 'SUITFULLY' },
    instructions: { type: String, default: 'Follow the steps below to complete your M-Pesa payment.' }
  },
  creditCard: {
    enabled: { type: Boolean, default: true },
    gateway: { type: String, default: 'pesapal' },
    publicKey: { type: String, default: '' },
    secretKey: { type: String, default: '' },
    instructions: { type: String, default: 'Please have your card ready and click the link below to complete payment securely.' }
  },
  debitCard: {
    enabled: { type: Boolean, default: true },
    gateway: { type: String, default: 'pesapal' },
    publicKey: { type: String, default: '' },
    secretKey: { type: String, default: '' },
    instructions: { type: String, default: 'Please have your card ready and click the link below to complete payment securely.' }
  },
  paypal: {
    email: { type: String, default: 'suitfully@gmail.com' },
    enabled: { type: Boolean, default: true },
    instructions: { type: String, default: 'Click the button below to pay securely with PayPal.' }
  },
  bankTransfer: {
    bankName: { type: String, default: 'Equity Bank Kenya' },
    accountName: { type: String, default: 'SUITFULLY' },
    accountNumber: { type: String, default: '175-020-000-0001' },
    branch: { type: String, default: 'Utalii Lane, Nairobi' },
    instructions: { type: String, default: 'Please transfer the exact amount to the following SUITFULLY account.' }
  }
}, { timestamps: true });

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);