function encrypt(inputString) {
  let decodedString = "";
  const stringArray = inputString.split("");

  stringArray.forEach((character) => {
    const asciiCode = character.charCodeAt();

    if (asciiCode === 32) {
      decodedString += character;
    } else if (asciiCode >= 33 && asciiCode <= 78) {
      decodedString += String.fromCharCode(asciiCode + 47);
    } else if (asciiCode === 79) {
      decodedString += character;
    } else if (asciiCode >= 80 && asciiCode <= 126) {
      decodedString += String.fromCharCode(asciiCode - 47);
    } else {
      decodedString += character;
    }
  });
  return decodedString;
}

module.exports = { encrypt };
