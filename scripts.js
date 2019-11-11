// Google Auth Config
var GoogleAuth;
var SCOPE = "https://www.googleapis.com/auth/drive.metadata.readonly";
function handleClientLoad() {
	gapi.load("client:auth2", initClient);
}

function initClient() {
	// do not place docs directly in the array because javascript will stroke out
	var docs = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
	gapi.client.init({
		"apiKey":"AIzaSyDIptkXtN8vcrOr5LPBvk21WuAk8UmVwAs",
		"discoveryDocs":[docs],
		"clientId":"1031491199015-pbjmtfn9kj0tvcl24k7vntelua6glb90.apps.googleusercontent.com",
		"scope":SCOPE
	}).then(function() {
		GoogleAuth = gapi.auth2.getAuthInstance();
		GoogleAuth.isSignedIn.listen(updateSigninStatus);
		
		var user = GoogleAuth.currentUser.get();
		setSigninStatus();
		
		$("#sign-in-or-out-button").click(function() {
			handleAuthClick();
		});
		
		$("#revoke-access-button").click(function() {
			revokeAccess();
		});
	});
}

function handleAuthClick() {
	if (GoogleAuth.isSignedIn.get()) {
		GoogleAuth.signOut();
	}
	else {
		GoogleAuth.signIn();
	}
}

function revokeAccess() {
	GoogleAuth.disconnect();
}

function setSigninStatus(isSignedIn) {
	var user = GoogleAuth.currentUser.get();
	if (GoogleAuth.isSignedIn.get()) {
		$('#sign-in-or-out-button').html('Sign out');
		$('#revoke-access-button').css('display', 'inline-block');
		$('#auth-status').html('You are currently signed in and have granted ' +
			'access to this app.');
	}
	else {
		$('#sign-in-or-out-button').html('Sign In/Authorize');
		$('#revoke-access-button').css('display', 'none');
		$('#auth-status').html('You have not authorized this app or you are ' +
			'signed out.');
	}
}

function updateSigninStatus(isSignedIn) {
	setSigninStatus();
}

// Google Auth Sign-In
function onSignIn(googleUser) {
	// Useful data for your client-side scripts:
	var profile = googleUser.getBasicProfile();
	console.log("ID: " + profile.getId()); // Don't send this directly to your server!
	console.log('Full Name: ' + profile.getName());
	console.log('Given Name: ' + profile.getGivenName());
	console.log('Family Name: ' + profile.getFamilyName());
	console.log("Image URL: " + profile.getImageUrl());
	console.log("Email: " + profile.getEmail());

	// The ID token you need to pass to your backend:
	var id_token = googleUser.getAuthResponse().id_token;
	console.log("ID Token: " + id_token);
	document.getElementById("sign-out-button").classList.remove("hidden");
}

// Google Auth Sign-Out
function signOut() {
	var auth2 = gapi.auth2.getAuthInstance();
	auth2.signOut().then(function () {
		console.log('User signed out.');
		document.getElementById("sign-out-button").classList.add("hidden");
	});
}

