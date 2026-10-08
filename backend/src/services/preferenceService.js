const UserPreference = require('../models/UserPreference');

function getOrCreatePreference(userId, language = 'en') {
  return UserPreference.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, language } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

module.exports = { getOrCreatePreference };
