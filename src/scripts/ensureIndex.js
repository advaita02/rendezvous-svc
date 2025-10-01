const Interaction = require('../models/interaction.model');

async function ensureCorrectIndexes() {
  const indexes = await Interaction.collection.indexes();

  const hasOldIndex = indexes.some(i =>
    JSON.stringify(i.key) === JSON.stringify({ user: 1, post: 1 })
  );

  if (hasOldIndex) {
    console.log('Dropping old index: { user: 1, post: 1 }');
    await Interaction.collection.dropIndex('user_1_post_1');
  } else {
    console.log('Old index not found, good to go');
  }

  await Interaction.syncIndexes();
}

module.exports = {
    ensureCorrectIndexes,
}