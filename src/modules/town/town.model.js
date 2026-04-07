const mongoose = require('mongoose');

const townSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Town name is required'],
      unique: true,
      trim: true,
    },
    post: {
      type: String,
      trim: true,
      default: '',
    },
    block: {
      type: String,
      trim: true,
      default: '',
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^\d{5,10}$/, 'Enter a valid pincode'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Town', townSchema);
