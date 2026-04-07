const mongoose = require('mongoose');

const GENDERS = ['male', 'female', 'other'];
const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed'];
const EDUCATION_LEVELS = ['graduate', 'postgraduate'];

const personSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    profilePhoto: { type: String, default: null },
    mobileNumber: { type: String, trim: true, default: null },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: GENDERS, required: [true, 'Gender is required'] },
    maritalStatus: { type: String, enum: MARITAL_STATUSES, required: [true, 'Marital status is required'] },
    profession: { type: String, trim: true, default: null },
    highestEducation: { type: String, enum: EDUCATION_LEVELS, default: null },
    town: { type: mongoose.Schema.Types.ObjectId, ref: 'Town', required: [true, 'Town is required'] },
    isAlive: { type: Boolean, default: true },
    fatherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', default: null },
    motherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', default: null },
    lifePartnerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'TownAnchor', required: true },
  },
  { timestamps: true }
);

personSchema.index({ town: 1 });
personSchema.index({ name: 'text' });

module.exports = mongoose.model('Person', personSchema);
module.exports.GENDERS = GENDERS;
module.exports.MARITAL_STATUSES = MARITAL_STATUSES;
module.exports.EDUCATION_LEVELS = EDUCATION_LEVELS;
