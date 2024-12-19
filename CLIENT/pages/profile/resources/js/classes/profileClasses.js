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

  static async verifyPasswordResetCode(accessToken, resetToken) {
    if (!accessToken) return;

    UserInterface.openLoader("verifying reset code", "verifyingCode");

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
        resettoken: resetToken,
      },
    };

    const generateResetCodeRequest = await fetch(
      "http://localhost:4000/api/user/owner/verify/resetToken",
      requestOptions
    );

    const { message, error } = await generateResetCodeRequest.json();

    if (message || error) UserInterface.closeLoader("verifyingCode");

    if (error) UserInterface.handleErrors(error);

    if (message) return { message };
  }

  static async editPassword(
    newPassword,
    confirmNewPassword,
    accessToken,
    resetCode
  ) {
    if (!newPassword || !confirmNewPassword || !accessToken) return;

    UserInterface.openLoader("changing password", "changingPassword");

    const requestOptions = {
      mode: "cors",
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
        resettoken: resetCode,
      },
      body: JSON.stringify({ newPassword, confirmNewPassword }),
    };

    const changePasswordRequest = await fetch(
      "http://localhost:4000/api/user/owner/edit/password",
      requestOptions
    );

    const { message, error } = await changePasswordRequest.json();

    if (message || error) UserInterface.closeLoader("changingPassword");

    if (error) UserInterface.handleErrors(error);

    if (message) return { message };
  }

  static async verifyPasswordWhenDeleteAccount(accessToken, password) {
    if (!accessToken || !password) return;

    UserInterface.openLoader("verifying password", "verifyingPassword");

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({ password }),
    };

    const verifyPasswordRequest = await fetch(
      "http://localhost:4000/api/user/owner/verify/password",
      requestOptions
    );

    const { message, error } = await verifyPasswordRequest.json();

    if (message || error) UserInterface.closeLoader("verifyingPassword");

    if (error) UserInterface.handleErrors(error);

    if (message) return { message };
  }

  static async generateDeleteAccountCode(accessToken) {
    if (!accessToken) return;

    UserInterface.openLoader("changing password", "changingPassword");

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
    };

    const getDeleteAccountCodeRequest = await fetch(
      "http://localhost:4000/api/user/owner/generate/deleteToken",
      requestOptions
    );

    const { message, deleteAccountToken, error } =
      await getDeleteAccountCodeRequest.json();

    if (message || deleteAccountToken || error)
      UserInterface.closeLoader("changingPassword");

    if (error) UserInterface.handleErrors(error);

    if (message && deleteAccountToken) return { message, deleteAccountToken };
  }

  static async verifyDeleteAccountCode(accessToken, deleteCode) {
    if (!accessToken) return;

    UserInterface.openLoader("verifying code", "verifyingCode");

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
        deletetoken: deleteCode,
      },
    };

    const getDeleteAccountCodeRequest = await fetch(
      "http://localhost:4000/api/user/owner/verify/deleteToken",
      requestOptions
    );

    const { message, error } = await getDeleteAccountCodeRequest.json();

    if (message || error) UserInterface.closeLoader("verifyingCode");

    if (error) UserInterface.handleErrors(error);

    if (message) return { message };
  }

  static async deleteAccount(accessToken, deleteCode) {
    if (!accessToken) return;

    UserInterface.openLoader("deleting account", "deletingAccount");

    const requestOptions = {
      mode: "cors",
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
        deletetoken: deleteCode,
      },
    };

    const deleteAccountRequest = await fetch(
      "http://localhost:4000/api/user/owner/delete",
      requestOptions
    );

    const { message, error } = await deleteAccountRequest.json();

    if (message || error) UserInterface.closeLoader("deletingAccount");

    if (error) UserInterface.handleErrors(error);

    if (message) return { message };
  }
}

class UserInterface extends UserinterfaceUtilities {
  static async populateEditOwnerDetailsForm(accessToken) {
    if (!accessToken) return;

    if (!confirm("Do you want to change your account details?")) return;

    const form = document.querySelector("[data-edit-account-form]");

    // const formInputs = form.querySelectorAll("input");

    // const isFormPopulated = formInputs.every((input) => input.value);

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

  static createPasswordResetVerificationModal(accessToken) {
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
    closeModalButton.className = "closeResetModal btn btn-danger";
    closeModalButton.innerText = "X";
    closeModalButton.addEventListener("click", () => {
      document.querySelector(".home").classList.remove("blur");
      document.querySelector(".resetModal").remove();
    });
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
    verifyButton.className = "btn btn-success";
    verifyButton.innerText = "Verify";
    verifyButton.addEventListener("click", async (e) => {
      e.preventDefault();
      const resetCode =
        e.target.parentElement.previousElementSibling.querySelector(
          "form input"
        ).value;

      const { message } = await Store.verifyPasswordResetCode(
        accessToken,
        resetCode
      );

      if (!message) return;

      this.alertMessage(message, "success");
      document.querySelector(".resetModal").remove();
      this.createChangePasswordModal(accessToken, resetCode);
    });

    const sendCodeAgainButton = document.createElement("button");
    sendCodeAgainButton.className = "ml-2 btn btn-dark";
    sendCodeAgainButton.innerText = "Send code again";
    sendCodeAgainButton.disabled = "true";

    // const newResetCodeTimer = document.createElement("span");
    // let counter = 10;
    // newResetCodeTimer.innerText = `(${counter})`;

    // var interval = setInterval(() => {
    //   if (counter < 1) {
    //     clearInterval(interval);
    //     sendCodeAgainButton.disabled = "false";
    //   }

    //   counter--;
    //   newResetCodeTimer.innerText = `(${counter})`;
    // }, 1000);

    // sendCodeAgainButton.append(newResetCodeTimer);

    formGroup2.append(verifyButton);
    formGroup2.append(sendCodeAgainButton);
    form.append(formGroup2);

    fieldset.append(form);
    modal.append(fieldset);

    document.querySelector("body").append(modal);
  }

  static async generateResetCodeAndOpenResetModal(accessToken) {
    if (!accessToken) return;

    if (!confirm("Do you want to change your password?")) return;

    const { message, resetPasswordToken } =
      await Store.genaratePasswordResetCode(accessToken);

    if (!message && !resetPasswordToken) return;

    this.alertMessage(message, "success");
    alert(resetPasswordToken);

    document.querySelector(".home").classList.add("blur");

    UserInterface.createPasswordResetVerificationModal(accessToken);
  }

  static async createChangePasswordModal(accessToken, resetCode) {
    if (!accessToken || !resetCode) return;

    const modal = document.createElement("div");
    modal.className = "changePasswordModal border border-dark px-4 pb-4 pt-2";

    const closeModal = document.createElement("div");
    closeModal.className = "closeModal w-100 d-flex justify-content-end";
    const closeModalButton = document.createElement("button");
    closeModalButton.className = "btn btn-danger";
    closeModalButton.draggable = "true";
    closeModalButton.innerText = "X";
    closeModal.append(closeModalButton);
    closeModal.addEventListener("click", () => {
      document.querySelector(".changePasswordModal")?.remove();
      document.querySelector(".home")?.classList.remove("blur");
    });
    modal.append(closeModal);

    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.className = "text-center";
    legend.innerText = "Password Reset";
    fieldset.append(legend);

    const form = document.createElement("form");
    form.className = "container text-center";

    const formGroup1 = document.createElement("div");
    formGroup1.className = "form-group d-flex align-items-center w-100";

    const newPasswordInput = document.createElement("input");
    newPasswordInput.type = "password";
    newPasswordInput.required = true;
    newPasswordInput.placeholder = "New password";
    newPasswordInput.className = "form-control w-100";

    const toggleShowAndHide1 = document.createElement("i");
    toggleShowAndHide1.className = "fa fa-eye ml-3";
    toggleShowAndHide1.addEventListener("click", (e) => {
      //   this.toggleShowAndHidePassword(e);
    });
    formGroup1.append(newPasswordInput);
    formGroup1.append(toggleShowAndHide1);
    form.append(formGroup1);

    const formGroup2 = document.createElement("div");
    formGroup2.className = "form-group d-flex align-items-center w-100";

    const confirmNewPasswordInput = document.createElement("input");
    confirmNewPasswordInput.type = "password";
    confirmNewPasswordInput.required = true;
    confirmNewPasswordInput.placeholder = "Confirm new password";
    confirmNewPasswordInput.className = "form-control w-100";

    const toggleShowAndHide2 = document.createElement("i");
    toggleShowAndHide2.className = "fa fa-eye ml-3";
    toggleShowAndHide2.addEventListener("click", (e) => {
      //   this.toggleShowAndHidePassword(e);
    });
    formGroup2.append(confirmNewPasswordInput);
    formGroup2.append(toggleShowAndHide2);
    form.append(formGroup2);

    const submitButton = document.createElement("button");
    submitButton.className = "btn btn-success w-50";
    submitButton.innerText = "Submit";
    form.append(submitButton);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      this.changePassword(accessToken, resetCode, form);
    });

    fieldset.append(form);
    modal.append(fieldset);
    document.querySelector("body").append(modal);
  }

  static async changePassword(accessToken, resetCode, form) {
    if (!accessToken || !resetCode || !form) return;

    if (!confirm("Proceed to change password?")) return;

    const newPassword = form.querySelectorAll("input")[0].value;
    const confirmNewPassword = form.querySelectorAll("input")[1].value;

    if (newPassword !== confirmNewPassword)
      this.handleErrors("Passwords do not match");

    const { message } = await Store.editPassword(
      newPassword,
      confirmNewPassword,
      accessToken,
      resetCode
    );

    if (!message) return;

    this.alertMessage(message, "success");
    document.querySelector(".changePasswordModal")?.remove();
    document.querySelector(".home")?.classList.remove("blur");
    this.handleLogout();
  }

  static createDeleteAccountVerifyPasswordModal(accessToken) {
    if (!accessToken) return;

    if (!confirm("Do you want to delete your account?")) return;

    const modal = document.createElement("div");
    modal.className =
      "verifyModal d-flex justify-content-center align-items-center border border-success py-2 w-25";

    const fieldset = document.createElement("fieldset");
    fieldset.className =
      "container-fluid d-flex flex-column justify-content-center align-items-center";

    const legend = document.createElement("legend");
    legend.className = "container-fluid d-flex justify-content-end";

    const closeModalButton = document.createElement("button");
    closeModalButton.draggable = "true";
    closeModalButton.className = "closeResetModal btn btn-danger";
    closeModalButton.innerText = "X";
    closeModalButton.addEventListener("click", () => {
      document.querySelector(".home").classList.remove("blur");
      document.querySelector(".verifyModal").remove();
    });
    legend.append(closeModalButton);
    fieldset.append(legend);

    const form = document.createElement("form");

    const formGroup1 = document.createElement("div");
    formGroup1.className = "form-group";

    const label = document.createElement("label");
    label.htmlFor = "reset";
    label.className = "text-center";

    const labelText = document.createElement("h5");
    labelText.innerText = "Verify password";
    label.append(labelText);
    formGroup1.append(label);

    const input = document.createElement("input");
    input.className = "form-control";
    input.placeholder = "Enter password";
    input.type = "password";
    input.id = "reset";
    formGroup1.append(input);
    form.append(formGroup1);

    const formGroup2 = document.createElement("div");
    formGroup2.className = "form-group";

    const verifyButton = document.createElement("button");
    verifyButton.className = "btn btn-success w-100";
    verifyButton.innerText = "Verify";
    verifyButton.addEventListener("click", async (e) => {
      e.preventDefault();
      const password =
        e.target.parentElement.previousElementSibling.querySelector(
          "form input"
        ).value;

      const verifyPassword = await Store.verifyPasswordWhenDeleteAccount(
        accessToken,
        password
      );

      if (!verifyPassword.message) return;
      this.alertMessage(verifyPassword.message, "success");

      const { message, deleteAccountToken } =
        await Store.generateDeleteAccountCode(accessToken);

      this.alertMessage(message, "success");
      alert(deleteAccountToken);
      document.querySelector(".verifyModal").remove();
      this.createDeleteAccountCodeVerificationModal(accessToken);
    });

    formGroup2.append(verifyButton);
    form.append(formGroup2);

    fieldset.append(form);
    modal.append(fieldset);

    document.querySelector(".home").classList.add("blur");
    document.querySelector("body").append(modal);
  }

  static createDeleteAccountCodeVerificationModal(accessToken) {
    if (!accessToken) return;

    const modal = document.createElement("div");
    modal.className =
      "deleteAccountModal d-flex justify-content-center align-items-center border border-success py-2 w-25";

    const fieldset = document.createElement("fieldset");
    fieldset.className =
      "container-fluid d-flex flex-column justify-content-center align-items-center";

    const legend = document.createElement("legend");
    legend.className = "container-fluid d-flex justify-content-end";

    const closeModalButton = document.createElement("button");
    closeModalButton.draggable = "true";
    closeModalButton.className = "closeResetModal btn btn-danger";
    closeModalButton.innerText = "X";
    closeModalButton.addEventListener("click", () => {
      document.querySelector(".home").classList.remove("blur");
      document.querySelector(".deleteAccountModal").remove();
    });
    legend.append(closeModalButton);
    fieldset.append(legend);

    const form = document.createElement("form");

    const formGroup1 = document.createElement("div");
    formGroup1.className = "form-group";

    const label = document.createElement("label");
    label.htmlFor = "delete";
    label.className = "text-center";

    const labelText = document.createElement("h5");
    labelText.innerText = "Enter account deletion code:";
    label.append(labelText);
    formGroup1.append(label);

    const input = document.createElement("input");
    input.className = "form-control";
    input.type = "text";
    input.id = "delete";
    formGroup1.append(input);
    form.append(formGroup1);

    const formGroup2 = document.createElement("div");
    formGroup2.className = "form-group";

    const verifyButton = document.createElement("button");
    verifyButton.className = "btn btn-success";
    verifyButton.innerText = "Verify";
    verifyButton.addEventListener("click", async (e) => {
      e.preventDefault();
      const deleteCode =
        e.target.parentElement.previousElementSibling.querySelector(
          "form input"
        ).value;

      const { message } = await Store.verifyDeleteAccountCode(
        accessToken,
        deleteCode
      );

      if (!message) return;

      this.alertMessage(message, "success");

      const deleteAccount = await Store.deleteAccount(accessToken, deleteCode);

      if (!deleteAccount.message) return;

      this.alertMessage(deleteAccount.message, "success");
      document.querySelector(".home").classList.remove("blur");
      document.querySelector(".deleteAccountModal").remove();
      this.handleLogout();
    });

    const sendCodeAgainButton = document.createElement("button");
    sendCodeAgainButton.className = "ml-2 btn btn-dark";
    sendCodeAgainButton.innerText = "Send code again";
    sendCodeAgainButton.disabled = "true";

    // const newResetCodeTimer = document.createElement("span");
    // let counter = 10;
    // newResetCodeTimer.innerText = `(${counter})`;

    // var interval = setInterval(() => {
    //   if (counter < 1) {
    //     clearInterval(interval);
    //     sendCodeAgainButton.disabled = "false";
    //   }

    //   counter--;
    //   newResetCodeTimer.innerText = `(${counter})`;
    // }, 1000);

    // sendCodeAgainButton.append(newResetCodeTimer);

    formGroup2.append(verifyButton);
    formGroup2.append(sendCodeAgainButton);
    form.append(formGroup2);

    fieldset.append(form);
    modal.append(fieldset);

    document.querySelector("body").append(modal);
  }

  static toggleShowAndHidePassword(e) {
    e.target.previousElementSibling.type = "password"
      ? (e.target.previousElementSibling.type = "text")
      : (e.target.previousElementSibling.type = "password");

    if (e.target.classList.contains("fa-eye")) {
      e.target.classList.remove("fa-eye");
      e.target.classList.add("fa-eye-slash");
    } else {
      e.target.classList.remove("fa-eye-slash");
      e.target.classList.add("fa-eye");
    }
  }
}
