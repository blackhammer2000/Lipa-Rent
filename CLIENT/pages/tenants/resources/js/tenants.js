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

  const selectRoomNumberForm = document.querySelector(
    "[data-room-number-form]"
  );

  selectRoomNumberForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const selectedRoomNumber =
      selectRoomNumberForm.querySelector("select")?.value;
  });

  const addNewTenantButton = document.querySelector(
    "[data-create-tenant-button]"
  );
  addNewTenantButton.addEventListener("click", () => {
    const addNewTenantModal = document.querySelector("[data-create-tenant]");
    addNewTenantModal.classList.toggle("hide");
  });

  const closeNewTenantModal = document.querySelector(
    "[data-close-create-tenant-modal]"
  );
  closeNewTenantModal.addEventListener("click", () => {
    const addNewTenantModal = document.querySelector("[data-create-tenant]");
    addNewTenantModal.classList.add("hide");
  });
})();
