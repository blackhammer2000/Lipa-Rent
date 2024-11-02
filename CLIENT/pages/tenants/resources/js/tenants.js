(async function () {
  const accessToken = localStorage.getItem("liparentAccessToken")
    ? JSON.parse(localStorage.getItem("liparentAccessToken"))
    : null;

  if (accessToken === (null || undefined))
    location.assign("/CLIENT/login/login.html");

  const selectedPropertyId = localStorage.getItem("liparentSelectedPropertyId")
    ? localStorage.getItem("liparentSelectedPropertyId")
    : null;

  if (selectedPropertyId)
    UserInterface.renderRoomNumbersForSelection(
      accessToken,
      selectedPropertyId
    );

  //   Store.readAllTenantsForRoomInProperty(
  //     accessToken,
  //     "f61167454fa6",
  //     "1bd1299235ff"
  //   );
})();
