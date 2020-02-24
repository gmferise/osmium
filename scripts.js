/// ******************************
/// * GOOGLE AUTH API AND CONFIG *
/// ******************************

var GoogleAuth; // Stores auth token and other info

/// ***** BUTTON FUNCTIONS *****

// Hangles sign in and out with one press
function toggleAuth() {
	if (GoogleAuth.isSignedIn.get()) {
		GoogleAuth.signOut();
	}
	else {
		GoogleAuth.signIn();
	}
}

/// ***** INTERNAL FUNCTIONS *****

// Called from HTML to finish loading API
function loadAuth() {
	gapi.load("client:auth2", initClient);
}

// Generates auth client instance, stored in GoogleAuth
function initClient() {
	// do not place docs directly in the array, must be evaluated beforehand
	var docs = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest","https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest"];
	gapi.client.init({ // Initialize a client with these properties
		"apiKey":"AIzaSyDIptkXtN8vcrOr5LPBvk21WuAk8UmVwAs",
		"discoveryDocs":docs,
		"clientId":"1031491199015-pbjmtfn9kj0tvcl24k7vntelua6glb90.apps.googleusercontent.com",
		"scope":"https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets"
	}).then(function() {
		GoogleAuth = gapi.auth2.getAuthInstance();
		GoogleAuth.isSignedIn.listen(onAuthUpdate);
		onAuthUpdate();
	});
}

/// ***********************
/// * DATABASE MANAGEMENT *
/// ***********************

// Dictionary of known databases which is kept up to date using getDatabases()
// Stored as 'Name':'SpreadsheetID'
var knownDatabases = {}; 
var databaseId; // Currently selected database in the form of it's spreadsheet id1
var pageId = 0; // Second page of spreadsheet

/// ***** ASYNC FUNCTIONS *****

// Creates new database in user's Drive using given name
// Returns new database id through catch
function createDatabase(name){
	name = '[OsDB] '+name;
	gapi.client.sheets.spreadsheets.create({
		properties: {
		title: name
		}
	}).then(function(response){
		console.log("Created new database. Configuring...");
		var id = response.result.spreadsheetId;
		getDatabases(id);
		
		var requests = [];
		
		// Rename first page
		requests.push({
			"updateSheetProperties": {
				"properties": {
					"sheetId": 0,
					"title": "DATABASE",
				},
            "fields": "title",
			}
		});
		
		// Format database columns
		requests.push({ // int id (>= 0)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
					"startColumnIndex": 0,
					"endColumnIndex": 1
				},
				"cell": {
					"userEnteredFormat": {
						"numberFormat": {
							"type": "NUMBER",
							"pattern": "0"
						},
					},
					"dataValidation": {
						"condition": { "type": "NUMBER_GREATER_THAN_EQ", "values": [{"userEnteredValue": "0"}] },
						"strict": true
					}
				},
				"fields": "userEnteredFormat.numberFormat,dataValidation"
			}
		});
		requests.push({ // str name (no validation)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
					"startColumnIndex": 1,
					"endColumnIndex": 2
				},
				"cell": {
					"userEnteredFormat": {
						"numberFormat": {
							"type": "TEXT",
							"pattern": ""
						}
					}
				},
				"fields": "userEnteredFormat.numberFormat"
			}
		});
		requests.push({ // str event (no validation)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
					"startColumnIndex": 2,
					"endColumnIndex": 3
				},
				"cell": {
					"userEnteredFormat": {
						"numberFormat": {
							"type": "TEXT",
							"pattern": ""
						}
					}
				},
				"fields": "userEnteredFormat.numberFormat"
			}
		});
		requests.push({ // DateTime timestamp (no validation)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
					"startColumnIndex": 3,
					"endColumnIndex": 4
				},
				"cell": {
					"userEnteredFormat": {
						"numberFormat": {
							"type": "DATE_TIME",
							"pattern": "yyyy-mm-dd HH:MM:SS"
						}
					}
				},
				"fields": "userEnteredFormat.numberFormat"
			}
		});
		requests.push({ // str comments (no validation)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
					"startColumnIndex": 4,
					"endColumnIndex": 5
				},
				"cell": {
					"userEnteredFormat": {
						"numberFormat": {
							"type": "TEXT",
							"pattern": ""
						}
					}
				},
				"fields": "userEnteredFormat.numberFormat"
			}
		});
		requests.push({ // bool studying (strict)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
					"startColumnIndex": 5,
					"endColumnIndex": 6
				},
				"cell": {
					"dataValidation": {
						"condition": {
							"type": "BOOLEAN"
						}
					}
				},
				"fields": "dataValidation"
			}
		});
		requests.push({ // bool technology (strict)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
					"startColumnIndex": 6,
					"endColumnIndex": 7
				},
				"cell": {
					"dataValidation": {
						"condition": {
							"type": "BOOLEAN"
						}
					}
				},
				"fields": "dataValidation"
			}
		});
		requests.push({ // bool printing (strict)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
					"startColumnIndex": 7,
					"endColumnIndex": 8
				},
				"cell": {
					"dataValidation": {
						"condition": { "type": "BOOLEAN" },
						"strict": true,
						"showCustomUi": true
					}
				},
				"fields": "dataValidation"
			}
		});
		
		// Give database columns headers		
		requests.push({
			"updateCells": {
				"rows": [{
					"values": [
						{"userEnteredValue": {"stringValue": "id"}},
						{"userEnteredValue": {"stringValue": "name"}},
						{"userEnteredValue": {"stringValue": "event"}},
						{"userEnteredValue": {"stringValue": "timestamp"}},
						{"userEnteredValue": {"stringValue": "comments"}},
						{"userEnteredValue": {"stringValue": "library"}},
						{"userEnteredValue": {"stringValue": "technology"}},
						{"userEnteredValue": {"stringValue": "printing"}}
					]
				}],
				"fields": "userEnteredValue",
				"start": {
					"rowIndex": 0,
					"columnIndex": 0
				},
				
			}
		});
		
		// Make second page
		requests.push({
			"addSheet": {
				"properties": {
					"title":"ID_REFERENCE"
				}
			}
		});
		
		// Do first batch of requests
		var batch = {requests: requests};
		gapi.client.sheets.spreadsheets.batchUpdate({
			spreadsheetId: id,
			resource: batch
		}).then(function(response){
			// Then get the second page's id
			var id = response.result.spreadsheetId;
			
			gapi.client.sheets.spreadsheets.get({
				spreadsheetId: id
			}).then(function(response){
				var id = response.result.spreadsheetId;
				var pageId = response.result.sheets[1].properties.sheetId;
				
				// Third round of requests, configuring the second page
				var requests = [];
				
				// Format reference page columns
				requests.push({
					"repeatCell": {
						"range": {
							"sheetId": pageId,
							"startRowIndex": 0,
							"startColumnIndex": 0,
							"endColumnIndex": 1
						},
						"cell": {
							"userEnteredFormat": {
								"numberFormat": {
									"type": "NUMBER",
									"pattern": "0"
								}
							}
						},
						"fields": "userEnteredFormat.numberFormat"
					}
				});
				requests.push({
					"repeatCell": {
						"range": {
							"sheetId": pageId,
							"startRowIndex": 0,
							"startColumnIndex": 1,
							"endColumnIndex": 2
						},
						"cell": {
							"userEnteredFormat": {
								"numberFormat": {
									"type": "TEXT",
									"pattern": ""
								}
							}
						},
						"fields": "userEnteredFormat.numberFormat"
					}
				});
			
				// Give reference page columns headers		
				requests.push({
					"updateCells": {
						"rows": [{
							"values": [
								{"userEnteredValue": {"stringValue": "id"}},
								{"userEnteredValue": {"stringValue": "name"}},
							]
						}],
						"fields": "userEnteredValue",
						"start": {
							"sheetId": pageId,
							"rowIndex": 0,
							"columnIndex": 0
						},
						
					}
				});
				
				// Do requests
				var batch = {requests: requests};
				gapi.client.sheets.spreadsheets.batchUpdate({
					spreadsheetId: id,
					resource: batch
				}).then(function(response){
					if (response.status != 200){
						throw new Error("Failed to configure the spreadsheet");
					}
					else {
						console.log("Configured the spreadsheet.");
					}
				});
			});
		});
	});
}

// Pulls list of [OsDB] sheets from user's Drive to update knownDatabases
// Returns new knownDatabases through catch
// newDatabase is an optional parameter that is used during database creation to act as a callback
function getDatabases(newDatabase){
	// Do not place params directly in the array, must be evaluated beforehand
	var params = "mimeType='application/vnd.google-apps.spreadsheet' and '"+GoogleAuth.currentUser.get().getBasicProfile().getEmail()+"' in writers and name contains '[OsDB]' and trashed = false";
	gapi.client.drive.files.list({
		q: params,
	}).then(function(response) {
		var dbs = response.result.files
		for (var i = 0; i < dbs.length; i++){
			knownDatabases[dbs[i].name] = dbs[i].id;
		}
		if (newDatabase != undefined) { catchCreateDatabase(newDatabase); }
		catchGetDatabases(knownDatabases);
    },function(err) { console.error("Failed to search Drive for Databases"); });
}

// Gets second page id of currently selected database
// Returns through catch
function getPageId(){
	return gapi.client.sheets.spreadsheets.get({
			spreadsheetId: databaseId
	}).then(function(response){
		pageId = response.result.sheets[1].properties.sheetId;
		catchPageId(pageId);
	});
}

function catchPageId(response){
	console.log("New pageId: "+response); // New reference id
}

/// ***** STANDARD FUNCTIONS *****

// Assigns databaseId a database from knownDatabases given it's name
// Returns selected database id
function selectDatabaseName(name){
	var id = knownDatabases[name];
	selectDatabaseId(id);
	return id;
}

// Assigns databaseId a database from knownDatabases given it's id
// Returns selected database name
function selectDatabaseId(id){
	databaseId = id;
	getPageId();
	for (var db in knownDatabases) {
		if (knownDatabases[db] == id) {
			return db;
		}
	}
	return undefined;
}

function selectDatabaseIdFromUrl() {
	var url = new URLSearchParams(window.location.search).get('id');
	if (url != null) {
		selectDatabaseId(url);
	} else {
		showError('no-url-database');
	}
}

/// ******************
/// * UPDATE QUERIES *
/// ******************

/// ***** ASYNC FUNCTIONS *****

// Input: id, event name, comments, bool[](studying, technology, printing)
function pushEvent(id, type, comments, flags) {
	// Get name from uid 
	getName(id, function(response){
		name = response.getDataTable().getDistinctValues(1)[0];
		if (name == "undefined") {
			name = "Unknown Student";
			console.log("pushEvent() WARN: No name found for id "+id);
		}
		// Update values
		gapi.client.sheets.spreadsheets.values.append({
			"spreadsheetId": databaseId,
			"range": "A:H",
			"valueInputOption": "USER_ENTERED",
			"resource": {
				"values": [
				[id, name, type,
				new Date().toLocaleString("en-CA-u-hc-h24",
				{day:"2-digit", month:"2-digit", year:"numeric",
				hour:"2-digit", minute:"2-digit", second:"2-digit"}).replace(",",""),
				comments, flags[0], flags[1], flags[2] ]
				]
			}
		}).then(function(response){
			if (response.status != 200){
				throw new Error("Failed to add new rows.");
			}
			else {
				catchPushEvent(name, type, flags);
			}
		});	
	}, pageId);
}

// Input: id, event, timestamp to identify a row
// Sets the comments column of the given a rowIndex
function updateComment(id, type, dateObject, newComment){
	// First get the number of rows with dates older than or exactly the target date
	var dateString = dateObject.toLocaleString("en-CA-u-hc-h24",
		{day:"2-digit", month:"2-digit", year:"numeric",
		hour:"2-digit", minute:"2-digit", second:"2-digit"}).replace(",","");
	gvzQuery("SELECT COUNT(D) WHERE D <= datetime '"+dateString+"'",
	function(response){
		var lteq = response.getDataTable().getDistinctValues(0)[0];
		// Then get the data in any rows with the target date
		gvzQuery("SELECT A, B, C, D, E, F, G, H WHERE D = datetime '"+dateString+"'",
		function(response){
			var eq = response.getDataTable().getNumberOfRows();
			var rawtbl = response.getDataTable();
			
			// Process the data into an array
			var tbl = [];
			for (var i = 0; i < rawtbl.getNumberOfRows(); i++){
				var row = []
				for (var j = 0; j < rawtbl.getNumberOfColumns(); j++){
					if (rawtbl.getColumnType(j) == "datetime"){
						row.push(rawtbl.getValue(i,j).toLocaleString("en-CA-u-hc-h24",
							{day:"2-digit", month:"2-digit", year:"numeric",
							hour:"2-digit", minute:"2-digit", second:"2-digit"}).replace(",",""));
					}
					else {
						row.push(rawtbl.getValue(i,j));
					}
				}
				tbl.push(row);
			}
			
			// Update the comment for the row with the correct event and id
			// Any extra rows selected because of matching date are unchanged
			for (var i = 0; i < tbl.length; i++){
				if (tbl[i][0] == id && tbl[i][2] == type){
					tbl[i][4] = newComment;
				}
			}
			
			// Now update ALL of the matching date rows in the database
			// Definitely an ugly workaround for no UPDATE query
			var a1range = "A"+(2+lteq-eq)+":H"+(1+lteq);
			gapi.client.sheets.spreadsheets.values.update({
				"spreadsheetId": databaseId,
				"range": a1range,
				"valueInputOption": "USER_ENTERED",
				"resource": {
					"values": tbl
				}
			}).then(function(response){
				if (response.status != 200){
					throw new Error("Failed to update comments.");
				}
				else {
					catchUpdateComment();
				}
			});
		});
	});
}

// Sets a name for an id in the reference table and then fixes the database
function setReferenceName(id, newName){
	if (pageId == 0 || pageId == undefined){ showError("bad-pageid"); }
	// Get entire reference page
	gvzQuery("SELECT A, B",
	function(response){
		var rawtbl = response.getDataTable();
		var tbl = [];
		for (var i = 0; i < rawtbl.getNumberOfRows(); i++){
			var row = []
			for (var j = 0; j < rawtbl.getNumberOfColumns(); j++){
				row.push(rawtbl.getValue(i,j));
			}
			tbl.push(row);
		}
		// Update new id with name
		var foundAndUpdated = false;
		for (var i = 0; i < tbl.length; i++){
			if (tbl[i][0] == id){
				tbl[i][1] = newName
				foundAndUpdated = true;
			}
			if (tbl[i][1] == "undefined" || tbl[i][1] == undefined){
				tbl[i][1] == "Unknown Student";
			}
		}
		// If it never found the id, add it
		if (!foundAndUpdated){ tbl.push([id,newName]); }
		
		// Update spreadsheet with new values
		var a1range = "ID_REFERENCE!A2"+":B"+(tbl.length+1);
		gapi.client.sheets.spreadsheets.values.update({
			"spreadsheetId": databaseId,
			"range": a1range,
			"valueInputOption": "USER_ENTERED",
			"resource": {
				"values": tbl
			}
		}).then(function(response){
			if (response.status != 200){
				throw new Error("Failed to update name.");
			}
			else {
				fixDatabaseNameColumn();
			}
		});
	}, pageId);
}

// Updates the names in the database columns to reflect the new state of the reference page
function fixDatabaseNameColumn(){
	// Select the entire database of names and ids column
	gvzQuery("SELECT A, B",
	function(response){
		// Process the names and ids into a table array
		var rawtbl = response.getDataTable();
		var tbl = [];
		for (var i = 0; i < rawtbl.getNumberOfRows(); i++){
			var row = []
			for (var j = 0; j < rawtbl.getNumberOfColumns(); j++){
				row.push(rawtbl.getValue(i,j));
			}
			tbl.push(row);
		}
		// Then select the reference names and ids
		gvzQuery("SELECT A, B",
		function(response){
			// Process the names and ids into a dictionary
			var rawtbl = response.getDataTable();
			var ref = {};
			for (var i = 0; i < rawtbl.getNumberOfRows(); i++){
				ref[rawtbl.getValue(i,0)] = rawtbl.getValue(i,1);
			}
			// Update names in table to match dictionary
			for (var i = 0; i < tbl.length; i++){
				tbl[i][1] = ref[tbl[i][0]];
			}
			// Update spreadsheet with new values
			var a1range = "A2"+":B"+(tbl.length+1);
			gapi.client.sheets.spreadsheets.values.update({
				"spreadsheetId": databaseId,
				"range": a1range,
				"valueInputOption": "USER_ENTERED",
				"resource": {
					"values": tbl
				}
			}).then(function(response){
				if (response.status != 200){
					throw new Error("Failed to perform name fix.");
				}
				else {
					catchEditStudentName();
				}
			});
		}, pageId);
	});
}

/// ******************
/// * SELECT QUERIES *
/// ******************

/// ***** INTERNAL FUNCTIONS *****

// Executes the Google Visualization query then passes the result into the callback function
function gvzQuery(query, callback, page){
	if (page == undefined) { page = "0"; }
	var request = new google.visualization.Query('https://docs.google.com/spreadsheets/d/'+databaseId+'/gviz/tq?headers=1&gid='+page+'&access_token='+encodeURIComponent(GoogleAuth.currentUser.get().getAuthResponse().access_token));
	request.setQuery(query);
	request.send(callback);
}

/// ***** ASYNC FUNCTIONS *****

// Queries the reference page for the name of a user given their id
// Returns through catch
-function getName(id, callback){
	if (pageId == 0 || pageId == undefined){ showError("bad-pageid"); }
	gvzQuery("SELECT A, B, COUNT(A), COUNT(B) WHERE A = "+id+" GROUP BY A, B LIMIT 1", callback, pageId);
}

// Queries the reference page for the name of a user given their id
// Returns through catch
function searchById(id){
	if (pageId == 0 || pageId == undefined){ showError("bad-pageid"); }
	gvzQuery("SELECT A, B, COUNT(A), COUNT(B) WHERE A = "+id+" GROUP BY A, B LIMIT 1", catchSearch, pageId);
}

// Gets list of names/ids pairs matching name
// Returns through catch
function searchByName(name, maxSize){
	if (pageId == 0 || pageId == undefined){ showError("bad-pageid"); }
	gvzQuery("SELECT A, B, COUNT(A), COUNT(B) WHERE lower(B) CONTAINS lower('"+name+"') GROUP BY A, B LIMIT "+maxSize, catchSearch, pageId);
}

//Selects single most recent date of given student id
// Returns through catch to a given callback
function getLastSeen(id, callback){
	gvzQuery("SELECT D WHERE A = "+id+" ORDER BY D DESC LIMIT 1", callback);
}

// Gets all table rows later than the given time
// Returns through catch
function getEventsAfter(dateObject){
	var dateString = dateObject.toLocaleString("en-CA-u-hc-h24",
				{day:"2-digit", month:"2-digit", year:"numeric",
				hour:"2-digit", minute:"2-digit", second:"2-digit"}).replace(",","");
	gvzQuery("SELECT A, B, C, D, E, F, G, H WHERE D > datetime '"+dateString+"' ORDER BY D ASC", catchEventsAfter);
}

// Gets all table rows with a student's id
// Returns through catch
function getStudentHistory(id){
	gvzQuery("SELECT A, B, C, D, E, F, G, H WHERE A = "+id+" ORDER BY D DESC", catchStudentHistory);
}