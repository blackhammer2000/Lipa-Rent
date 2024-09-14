async function createModel(model, property, value, ownerID) {
  if (!model || !property || !ownerID) return;

  const modelBody = {
    ownerID,
    [property]: {},
  };

  const newModel = await model.create(modelBody);

  return newModel;
}

module.exports = { createModel };
