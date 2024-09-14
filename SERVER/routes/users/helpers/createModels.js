async function createModel(model, property, value, ownerID) {
  if (!model || !property || !ownerID) return;
  try {
    const modelBody = {
      ownerID,
      [property]: {},
    };

    const newModel = await model.create(modelBody);

    if (!newModel) throw new Error(newModel);

    return newModel;
  } catch (err) {
    if (err.message) return err;
  }
}

module.exports = { createModel };
