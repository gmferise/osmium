// Google Auth Config
var GoogleAuth;


function handleClientLoad() { // Called from HTML when API loads
	gapi.load("client:auth2", initClient);
}

function initClient() { // Generates auth client instance, stored in GoogleAuth
	// do not place docs directly in the array because javascript will stroke out
	var docs = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest","https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest"];
	gapi.client.init({ // Initialize a client with these properties
		"apiKey":"AIzaSyDIptkXtN8vcrOr5LPBvk21WuAk8UmVwAs",
		"discoveryDocs":docs,
		"clientId":"1031491199015-pbjmtfn9kj0tvcl24k7vntelua6glb90.apps.googleusercontent.com",
		"scope":"https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.appdata"
	}).then(function() {
		GoogleAuth = gapi.auth2.getAuthInstance();
		GoogleAuth.isSignedIn.listen(updateSigninStatus);
		
		loadAppData();
		
		var user = GoogleAuth.currentUser.get();
		setSigninStatus();
		
		$("#sign-in-or-out-button").click(function() {
			toggleAuth();
		});
	});
}

function loadAppData() {
	// Search for our appdata file
	var exists = false;
	drive.files.list({
		spaces: 'appDataFolder',
		fields: 'nextPageToken, files(id, name)',
		pageSize: 100
	}, function (err, res) {
		if (err) { console.error(err); }
		else {
			res.files.forEach(function (file) {
				console.log('Found file:', file.name, file.id);
				if (file.name == 'config.json') { exists = true; }
			});
		}
	});
	
	// Not found, create it
	if (!exists) {
		var fileMetadata = {
			'name': 'config.json',
			'parents': ['appDataFolder']
		};
		var media = {
			mimeType: 'application/json',
			body: fs.createReadSstream('files/config.json')
		};
		drive.files.create({
			resource: fileMetadata,
			media: media,
			fields: 'id'
		}, function (err, file) {
			if (err) { console.error(err); }
			else { console.log('File Id:', file.id); }
		});
	}
}

function toggleAuth() {
	if (GoogleAuth.isSignedIn.get()) {
		GoogleAuth.signOut();
	}
	else {
		GoogleAuth.signIn();
	}
}

function setSigninStatus(isSignedIn) { // Sets status message
	var user = GoogleAuth.currentUser.get();
	if (GoogleAuth.isSignedIn.get()) {
		$('#sign-in-or-out-button').html('Sign Out');
		$('#auth-status').html('(Currently Signed In.)');
	}
	else {
		$('#sign-in-or-out-button').html('Sign In');
		$('#auth-status').html('(Curently Signed Out.)');
	}
}

function updateSigninStatus(isSignedIn) {
	setSigninStatus();
}

// Sheets Calls
function testCall() {
      var params = {
        spreadsheetId: 'os-test',
        range: 'A1:C3',
        
        // The default render option is ValueRenderOption.FORMATTED_VALUE.
        valueRenderOption: '',
        // The default dateTime render option is [DateTimeRenderOption.SERIAL_NUMBER].
        dateTimeRenderOption: '',
      };

      var request = gapi.client.sheets.spreadsheets.values.get(params);
      request.then(function(response) {
        console.log(response.result);
      }, function(reason) {
        console.error('error: ' + reason.result.error.message);
      });
    }