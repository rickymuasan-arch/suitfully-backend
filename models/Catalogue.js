const mongoose = require('mongoose');

const catalogueSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'Key is required'],
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  images: {
    type: [String],
    default: []
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Catalogue', catalogueSchema);