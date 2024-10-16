const accessToken = localStorage.getItem("liparentAccessToken")
  ? JSON.parse(localStorage.getItem("liparentAccessToken"))
  : null;

if (accessToken === (null || undefined))
  location.assign("/CLIENT/login/login.html");

console.log(Store.readAllPropertiesOwned(accessToken));
