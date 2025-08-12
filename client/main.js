// YOUR JAVASCRIPT CODE FOR INDEX.HTML GOES HERE

let user = null;

catalyst.auth.isUserAuthenticated().then(result => {
  document.body.style.visibility = "visible";
  // console.log("User authenticated:", result);

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
    document.getElementById("tabContainer").style.display = "block";
  } else {
    document.getElementById("tabContainer").style.display = "none";
  }

}).catch(err => {
  console.log("Not authenticated, redirecting to login...");
  window.location.href = "/__catalyst/auth/login"; // Or your login page
});

function showUserDetls() {
  // catalyst.auth.isUserAuthenticated().then(result => {
  window.location.href = 'userDetails.html';
}


function showPaymnts() {
  window.location.href = 'payments.html';
}

function showMyAcnt() {
  catalyst.auth.isUserAuthenticated().then(result => {
    // Optionally store user data in sessionStorage
    sessionStorage.setItem("userData", JSON.stringify(result.content));
    window.location.href = 'myAccount.html';
  });
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
    FirstName:   document.getElementById("editFirstName").value,
    LastName:    document.getElementById("editLastName").value,
    UserId:      document.getElementById("editUserId").value,
    EmailId:     document.getElementById("editEmail").value,
    LoanAmount:  document.getElementById("loanAmtInput").value,
    InterestRate:document.getElementById("interestRate").value
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