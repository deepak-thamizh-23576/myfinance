// YOUR JAVASCRIPT CODE FOR INDEX.HTML GOES HERE

let user = null;

catalyst.auth.isUserAuthenticated().then(result => {
  document.body.style.visibility = "visible";
  console.log("User authenticated:", result);

  user = result.content;
  const firstName = "Welcome" + " " + user.first_name + "!";
  document.getElementById("firstName").innerHTML = firstName;

  const last_name = "Last Name: " + user.last_name;
  document.getElementById('profileInitial').innerText = user.first_name.charAt(0).toUpperCase() + user.last_name.charAt(0).toUpperCase();

  const mailid = "Email Address: " + user.email_id;
  const emailId = user.email_id;
  const truncatedEmail = emailId.length > 20
    ? emailId.substring(0, 20) + '...'
    : emailId;
  document.getElementById("emailId").innerHTML = truncatedEmail;

  const role = result.content.role_details.role_name;

  document.getElementById("userRoleDisplay").innerText = role;

  // Show or hide the user details tab
  if (role === "Admin") {
    document.getElementById("userDetailsBox").style.display = "block";
    document.getElementById("userDetailsBox").style.display = "flex";
  } else {
    document.getElementById("userDetailsBox").style.display = "none";
  }

  if (role === "Admin") {
    document.getElementById("paymentsBox").style.display = "none";
  } else {
    document.getElementById("paymentsBox").style.display = "block";
    document.getElementById("paymentsBox").disabled = false;
  }

}).catch(err => {
  console.log("Not authenticated, redirecting to login...");
  window.location.href = "/__catalyst/auth/login"; // Or your login page
});

function dashboard() {
  if (user.role_details.role_name === "Admin") {
    fetch('https://my-finance-test-60042869018.development.catalystserverless.in/server/my_finance_2/')
        .then(res => res.json())
        .then(data => {
          const dashboardValue = document.getElementById("dashboardValue");

          dashboardValue.innerHTML ="";
          
          const userCount = data.users.length;
          console.log(userCount);

          const adminCount = data.users.filter(user => user.role_details.role_name === "Admin").length;

          const appUserCount = data.users.filter(user => user.role_details.role_name === "App User").length;

          dashboardValue.innerHTML = `
          <div>
          <p class="dashboardUserText">${userCount}</p>
          <p class="usersOnboardedText">Users Onboarded</p>
          </div>
          <div class="userCountBackground">
          <div class="adminCount">
            <span class="material-symbols-outlined" style="
                background-color: white;
                border-radius: 100px;
                padding: 15px;
                margin: 36px 35px 43px;
                font-size: 21px;
            ">
            group
            </span>
            <p class="adminUserCount" style="
              background-color: #236db4;
              border-radius: 100px;
              width: 18px;
              height: 18px;
              color: white;
              display: flex;
              transform: translate(69px, -98px);
              justify-content: center;
              align-items: center;
              font-size: 11px;
              font-family: 'Zoho Puvi Semibold';
          ">${adminCount}</p>
           <p style="
              color: #236db4;
              font-family: 'Zoho Puvi Semibold';
              font-size: 14px;
              transform: translate(38px, -53px);
          ">Admin</p>
          </div>
          <div class="appUserCount">
          <span class="material-symbols-outlined" style="
              background-color: white;
              border-radius: 100px;
              padding: 15px;
              margin: 36px 35px 43px;
              font-size: 21px;
        ">
          groups_2
          </span>
          <p class="adminUserCount" style="
              background-color: #236db4;
              border-radius: 100px;
              width: 18px;
              height: 18px;
              color: white;
              display: flex;
              transform: translate(69px, -98px);
              justify-content: center;
              align-items: center;
              font-size: 11px;
              font-family: 'Zoho Puvi Semibold';
        ">${appUserCount}</p>
        <p style="
            color: #236db4;
            font-family: 'Zoho Puvi Semibold';
            font-size: 14px;
            transform: translate(38px, -53px);
        ">App User</p>
          </div>
          </div>
          `;

          //dashboardValue.appendChild(dashBoardCount);
          console.log(adminCount);
          console.log(appUserCount);
        })
        .catch(err => {
        console.error("Error fetching data:", err);
      });
  } else {
     document.getElementById("dashboardValue").innerText = "Hi App User";
  }

}

function showUserDetls() {
  // catalyst.auth.isUserAuthenticated().then(result => {
  window.location.href = 'userDetails.html';
}


function showPaymnts() {
  window.location.href = 'payments.html';
}

function showMyAcnt() {
  window.location.href = 'myAccount.html';
  // catalyst.auth.isUserAuthenticated().then(result => {
  //   // Optionally store user data in sessionStorage
  //   sessionStorage.setItem("userData", JSON.stringify(result.content));
  //   window.location.href = 'myAccount.html';
  // });
}

function openEditPopup(user) {
  document.getElementById("editFirstName").value = user.first_name || '';
  document.getElementById("editLastName").value = user.last_name || '';
  document.getElementById("editUserId").value = user.user_id || '';
  document.getElementById("editEmail").value = user.email_id || '';
  document.getElementById("editOrgId").value = user.org_id || '';
  document.getElementById("editCreatedTime").value = user.created_time || '';
  document.getElementById("editStatus").value = user.status || '';
  document.getElementById("editRole").value = user.role_details?.role_name || '';

  // Call datastoreFetch with current user
  datastoreFetch(user);

  document.getElementById("editPopup").style.display = "block";
  document.getElementById("overlay").style.display = "block";
}

function datastoreFetch(user) {
  fetch('https://my-finance-test-60042869018.development.catalystserverless.in/server/datastoreFetch/')
    .then(res => res.json())
    .then(data => {
      console.log("Loan Details from DataStore:", data.userDetailsTable);

      // Find matching record based on EmailId
      const matchingRecord = data.userDetailsTable.find(record =>
        record.EmailId === user.email_id &&
        record.FirstName === user.first_name &&
        record.LastName === user.last_name
      );

      if (matchingRecord) {
        document.getElementById("loanAmtInput").value = matchingRecord.LoanAmount || '';
        document.getElementById("interestRate").value = matchingRecord.InterestRate || '';
        console.log("Matched LoanAmount:", matchingRecord.LoanAmount);
      } else {
        console.warn("No matching record found.");
        document.getElementById("loanAmtInput").value = '';
        document.getElementById("interestRate").value = '';
      }
    })
    .catch(error => {
      console.error("Error fetching loan details:", error);
    });
}

function closePopup() {
  document.getElementById('editPopup').style.display = 'none';
  document.getElementById("overlay").style.display = "none";
}

async function sendDataToBackend() {
  // 1.1 Build the object from your inputs
  const rowData = {
    FirstName: document.getElementById("editFirstName").value,
    LastName: document.getElementById("editLastName").value,
    UserId: document.getElementById("editUserId").value,
    EmailId: document.getElementById("editEmail").value,
    LoanAmount: document.getElementById("loanAmtInput").value,
    InterestRate: document.getElementById("interestRate").value
  };

  try {
    // 1.2 Send it to your Catalyst function
    const response = await fetch(
      "https://my-finance-test-60042869018.development.catalystserverless.in/server/userDatastore/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rowData)
      }
    );

    // 1.3 Read back whatever the function sent you
    const contentType = response.headers.get("content-type") || "";
    let payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (response.ok) {
      alert("Loan Amount updated successfully");
      console.log("Success response:", payload);
      closePopup()
    } else {
      alert("Error: " + (typeof payload === 'string' ? payload : JSON.stringify(payload)));
      console.error("Server error response:", payload);
    }

  } catch (err) {
    console.error("Network or parse error:", err.message);
  }
}


function logout() {
  //The signOut method is used to sign the user out of the application
  const redirectURL = location.protocol + "//" + location.hostname + "/__catalyst/auth/login";
  catalyst.auth.signOut(redirectURL);
}