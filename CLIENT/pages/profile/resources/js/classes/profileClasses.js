class Store extends StoreUtilities {
  static async readOwnerDetails(accessToken) {
    if (!accessToken) return;

    UserInterface.openLoader("reading owner details", "readOwner");

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
    };

    const readRoomTenantsRequest = await fetch(
      "http://localhost:4000/api/user/read/owner",
      requestOptions
    );

    const { owner, error } = await readRoomTenantsRequest.json();

    if (owner || error) UserInterface.closeLoader("readOwner");

    if (error) UserInterface.handleErrors(error);

    if (owner) return { owner };
  }

  static async editOwner(accessToken, editedOwner) {
    if (!accessToken) return;

    UserInterface.openLoader("editing owner details", "editOwner");

    const requestOptions = {
      mode: "cors",
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({ editedOwner }),
    };

    const editOwnerDetailsRequest = await fetch(
      "http://localhost:4000/api/user/owner/edit/owner",
      requestOptions
    );

    const { message, error, triggerLogOut } =
      await editOwnerDetailsRequest.json();

    if (message || error) UserInterface.closeLoader("editOwner");

    if (error) UserInterface.handleErrors(error);

    if (message && triggerLogOut) return { message, triggerLogOut };
  }

  static async genaratePasswordResetCode(accessToken) {
    if (!accessToken) return;

    UserInterface.openLoader("sending reset code", "sendingCode");

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
    };

    const generateResetCodeRequest = await fetch(
      "http://localhost:4000/api/user/owner/generate/resetToken",
      requestOptions
    );

    const { message, resetPasswordToken, error } =
      await generateResetCodeRequest.json();

    if (message || resetPasswordToken || error)
      UserInterface.closeLoader("sendingCode");

    if (error) UserInterface.handleErrors(error);

    if (message && resetPasswordToken) return { message, resetPasswordToken };
  }
}

class UserInterface extends UserinterfaceUtilities {
  static async populateEditOwnerDetailsForm(accessToken) {
    if (!accessToken) return;

    const form = document.querySelector("[data-edit-account-form]");

    // const isFormPopulated = form
    //   .querySelectorAll("input")
    //   .every((input) => input.value);

    // if (isFormPopulated) {
    //   form.parentElement.parentElement.classList.remove("hide");
    //   return;
    // }

    const { owner } = await Store.readOwnerDetails(accessToken);

    if (!owner) return;

    const { name, nationalID, email, phone } = owner;

    const ownerName = form.querySelector("[data-edited-name]");
    const ownerNatioanlID = form.querySelector("[data-edited-nationalID]");
    const ownerEmail = form.querySelector("[data-edited-email]");
    const ownerPhone = form.querySelector("[data-edited-phone]");

    ownerName.value = name;
    ownerNatioanlID.value = nationalID;
    ownerEmail.value = email;
    ownerPhone.value = phone;

    form.parentElement.parentElement.classList.remove("hide");
  }

  static async editOwnerDetails(accessToken, form) {
    if (!accessToken || !form) return;

    const editedName = form.querySelector("[data-edited-name]").value;
    const editedNatioanlID = form.querySelector(
      "[data-edited-nationalID]"
    ).value;
    const editedEmail = form.querySelector("[data-edited-email]").value;
    const editedPhone = form.querySelector("[data-edited-phone]").value;

    const editedOwner = {
      name: editedName.toUpperCase(),
      nationalID: editedNatioanlID,
      email: editedEmail,
      phone: editedPhone,
    };

    if (
      !confirm(
        "Are you sure you wish to proceed with editing the owner details?, If so you will be required to log in again after changing any of the login details."
      )
    )
      return;

    const { message, triggerLogOut } = await Store.editOwner(
      accessToken,
      editedOwner
    );

    form.parentElement.parentElement.classList.add("hide");
    this.alertMessage(message, "success");
    if (triggerLogOut) this.handleLogout();
  }

  static createPasswordResetVerificationModal() {
    const modal = document.createElement("div");
    modal.className =
      "resetModal d-flex justify-content-center align-items-center border border-success py-2 w-25";

    const fieldset = document.createElement("fieldset");
    fieldset.className =
      "container-fluid d-flex flex-column justify-content-center align-items-center";

    const legend = document.createElement("legend");
    legend.className = "container-fluid d-flex justify-content-end";

    const closeModalButton = document.createElement("button");
    closeModalButton.draggable = "true";
    closeModalButton.className = "btn btn-danger";
    closeModalButton.innerText = "X";
    legend.append(closeModalButton);
    fieldset.append(legend);

    const form = document.createElement("form");

    const formGroup1 = document.createElement("div");
    formGroup1.className = "form-group";

    const label = document.createElement("label");
    label.htmlFor = "reset";
    label.className = "text-center";

    const labelText = document.createElement("h5");
    labelText.innerText = "Enter password reset code:";
    label.append(labelText);
    formGroup1.append(label);

    const input = document.createElement("input");
    input.className = "form-control";
    input.type = "text";
    input.id = "reset";
    formGroup1.append(input);
    form.append(formGroup1);

    const formGroup2 = document.createElement("div");
    formGroup2.className = "form-group";

    const verifyButton = document.createElement("button");
    verifyButton.className = "btn btn-dark";
    verifyButton.innerText = "Verify";

    const sendCodeAgainButton = document.createElement("button");
    sendCodeAgainButton.className = "ml-2 btn btn-info";
    sendCodeAgainButton.innerText = "Send code again";

    formGroup2.append(verifyButton);
    formGroup2.append(sendCodeAgainButton);
    form.append(formGroup2);

    fieldset.append(form);
    modal.append(fieldset);

    document.querySelector("body").append(modal);
  }

  static async generateResetCodeAndOpenResetModal(accessToken) {
    if (!accessToken) return;

    const { message, resetPasswordToken } =
      await Store.genaratePasswordResetCode(accessToken);

    UserInterface.alertMessage(message, "success");
    alert(resetPasswordToken);

    if (message && resetPasswordToken)
      UserInterface.createPasswordResetVerificationModal();
  }
}
