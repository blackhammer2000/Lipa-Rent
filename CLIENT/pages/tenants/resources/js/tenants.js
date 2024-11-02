(async function () {
  const accessToken = localStorage.getItem("liparentAccessToken")
    ? JSON.parse(localStorage.getItem("liparentAccessToken"))
    : null;

  if (accessToken === (null || undefined))
    location.assign("/CLIENT/login/login.html");

  Store.readAllTenantsForRoomInProperty(
    accessToken,
    "f61167454fa6",
    "1bd1299235ff"
  );
})();
