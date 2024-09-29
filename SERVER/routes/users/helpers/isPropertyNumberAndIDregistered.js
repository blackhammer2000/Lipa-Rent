function checkIfPropertyNumberAndIDareRegistered(property, propertiesOwned) {
  const isNewPropertyIdAndNumberRegistered = false;
  const isNewPropertyIdRegistered = false;
  const isNewPropertyNumberRegistered = false;

  let error = "";

  for (const key in propertiesOwned) {
    console.log(key);

    if (
      key === property.propertyID &&
      propertiesOwned[key].propertyNumber === property.propertyNumber
    )
      isNewPropertyIdAndNumberRegistered = !isNewPropertyIdAndNumberRegistered;

    if (key === property.propertyID)
      isNewPropertyIdRegistered = !isNewPropertyIdRegistered;

    if (propertiesOwned[key].propertyNumber === property.propertyNumber)
      isNewPropertyNumberRegistered = !isNewPropertyNumberRegistered;
  }

  if (isNewPropertyIdAndNumberRegistered)
    error =
      "Property with the given Id and Number has already been registered.";
  if (isNewPropertyNumberRegistered)
    error = "Property with the given Number has already been registered.";
  if (isNewPropertyIdRegistered)
    error = "Property with the given Id has already been registered.";

  return error;
}

module.exports = { checkIfPropertyNumberAndIDareRegistered };
