/* global variables */
let BreezeSpeedDial;
let bookmarksList;
let currentId;

const container = document.querySelector(".buttons");
const items = document.querySelectorAll(".button");
let currentDraggedItem = null;


/* functions */
function init(){
	browser.bookmarks.search({title: 'Breeze Speed Dial'}).then(bookmarks => {
		let found = false;
		bookmarks.forEach(bookmark => {
			if(bookmark.parentId == 'unfiled_____'){
				console.log("Already present.");
				BreezeSpeedDial = bookmark.id;
				found = true;
			}
		});
		if(!found){
			console.log("Not found, creating it");
			browser.bookmarks.create({parentId: "unfiled_____", type: "folder", title: "Breeze Speed Dial"}).then(bookmark => {
				BreezeSpeedDial = bookmark.id;
			});
			createDefaultBookmarks();
		}

		getBookmarkList();
	});
}

function getBookmarkList(){
	browser.bookmarks.getChildren(BreezeSpeedDial).then(bookmarks => {
		bookmarksList = bookmarks;
		fetchImages();
		addBookmarks();
	});
}

function createDefaultBookmarks(){
	if(BreezeSpeedDial){
		browser.bookmarks.create({parentId: BreezeSpeedDial, type: "bookmark", title: "KDE", url: "https://kde.org/"});
		browser.bookmarks.create({parentId: BreezeSpeedDial, type: "bookmark", title: "Linux", url: "https://linux.org/"});
		browser.bookmarks.create({parentId: BreezeSpeedDial, type: "bookmark", title: "Mozilla", url: "https://mozilla.org/"});
	}
}

function fetchImages(){
	bookmarksList.forEach(bookmark => {
		getFavicon(bookmark);
	});
}

function getFavicon(bookmark){
	let favicon = localStorage.getItem(bookmark.id);
	if(!favicon){
		favicon = getDefaultFavicon(bookmark.url);
	}
	bookmark.img = favicon;
}

function getDefaultFavicon(url){
	const domainRegex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im;
	const match = url.match(domainRegex);
	if (match) {
		return match[0] + "/favicon.ico";
	}
	return null; // or return the whole URL if no domain found	  
}

function addBookmark(name, url, imageUrl, isnew=false){ // add a new bookmark 
	document.querySelector("#button-template .IMG").src = imageUrl;
	document.querySelector("#button-template").href = url;
	document.querySelector("#button-template .TITLE").textContent = name;

	var node = document.getElementById("button-template").cloneNode(true);
	node.id = "";
	
	document.getElementById("buttons-container").appendChild(node);

	if(isnew){
		// create firefox bookmark
		browser.bookmarks.create({parentId: BreezeSpeedDial, type: "bookmark", title: name, url: url});
	}
}

function addBookmarks(){
	bookmarksList.forEach(bookmark => {
		addBookmark(bookmark.title, bookmark.url, bookmark.img);
	});
}

function updateBookmark(name, url, imageUrl, target){ // update an existing bookmark
	console.log("updating bookmark");
	target.querySelector(".IMG").src = imageUrl;
	target.href = url;
	target.querySelector(".TITLE").textContent = name;
	bookmarksList[currentId] = imageUrl;
}


function configureBookmark(event){ // open the popup to edit an existing bookmark
	event.preventDefault();
	let currentButton = document.querySelector(".breeze-button:hover"); // this may be done better like ".breeze-button .breeze-button:active" or something lke this
	let name = currentButton.querySelector(".TITLE").textContent;
	let url = currentButton.href;
	let imageUrl = currentButton.querySelector(".IMG").src;
	currentId = currentButton["data-id"];
	console.log("currentId =", currentId);
	configureTarget = currentButton;
	showPopup("Edit bookmark", name, url, imageUrl);
}

function showPopup(popupTitle="Add new bookmark", name="", url="", imageUrl=""){
	configureImage.value = imageUrl;
	configureUrl.value = url;
	configureName.value = name;
	configureTitle.textContent = popupTitle;
	popup.style.display = "block";
}

function hidePopup(){
	configureTarget = null;
	popup.style.display = "none";
	saveConfig();
	currentId = null;
}

function saveConfig(){
	console.log("saving");
	bookmarksList.forEach((bookmark) => {
		localStorage.setItem(bookmark.id, bookmark.img);
	});	
}

function search(query){ // searches for the given query using the default search engine
	browser.tabs.query({ active: true, currentWindow: true })
	.then((tabs) => {
		let currentTab = tabs[0];
		let currentTabId = currentTab.id;
		browser.search.search({query: query, tabId: currentTabId});
	});
}



function setListener(){
	document.addEventListener('click', function(event) {
		if (event.target.classList.contains('edit-button')) {
			configureBookmark(event);
		}
	});
	
	addNew.onclick = function() {showPopup();} // show popup when the + button is clicked
	
	window.onclick = function(event) { // When the user clicks anywhere outside of the popup, close it and save nothing
		if (event.target == popup) {
			hidePopup();
		}
	}
	
	window.addEventListener("keydown", (event) => { // When the user clicks ESC, close the popup and save nothing
		if(event.code === "Escape"){
			hidePopup();
		}
	});
	
	newBookmark.onsubmit = function(event){ // handle the save button click, or the enter button pressed
		event.preventDefault();
		
		let imageUrl = configureImage.value;
		let url = configureUrl.value;
		let name = configureName.value;
	
		if(configureTarget === null){
			addBookmark(name, url, imageUrl, isnew=true);
			// hereee
		} else {
			updateBookmark(name, url, imageUrl, configureTarget);
		}
		
		hidePopup();
	}
	
	configureTrash.onclick = function(event){ // handle the trash button click
		event.preventDefault();
		if(configureTarget === null){
			// just close the popup
			hidePopup();
		} else {
			configureTarget.remove();
			console.log("removing bookmark");
			hidePopup();
		}
	}
	
	document.getElementById("search-form").onsubmit = function(event){
		event.preventDefault();
		search(document.querySelector('#search-form input').value);
	}
}

function setDragAndDrop(){
	for (const item of items) {
		item.addEventListener("dragstart", function(e) {
			currentDraggedItem = this;
			e.dataTransfer.setData("text/plain", this.textContent);
		});
	
		item.addEventListener("dragover", function(e) {
			e.preventDefault();
		});
	
		item.addEventListener("drop", function(e) {
			e.preventDefault();
			if (currentDraggedItem !== this) {
			container.removeChild(currentDraggedItem);
			container.insertBefore(currentDraggedItem, this.nextSibling); // TODO FIX THIS
			saveConfig()
			}
		});
	}
}

/* main */
init();
setListener();
setDragAndDrop(); // to be fixed








/* legacy code * / 
let configureTarget = null;
let bookmarks;
try {
	bookmarks = JSON.parse(localStorage.getItem("bookmarksJSON"))
	if(bookmarks === null || bookmarks === undefined){
		throw new Error('empty saving');
	}
} catch (e) {
	// default values
	bookmarks = [
		{
			title: "KDE",
			url: "https://kde.org/",
			img: "https://kde.org/stuff/clipart/logo/kde-logo-white-blue-rounded-source.svg"
		},
		{
			title: "Linux.org",
			url: "https://linux.org/",
			img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Tux.png/220px-Tux.png"
		},
		{
			title: "Mozilla",
			url: "https://mozilla.org/",
			img: "https://www.mozilla.org/media/protocol/img/logos/mozilla/logo-word-hor.e20791bb4dd4.svg"
		}
	]
}


for (let bookmark of bookmarks) {
	addBookmark(bookmark.title, bookmark.url, bookmark.img);
}

function updateBookmark(name, url, imageUrl, target){ // update an existing bookmark
	console.log("updating bookmark")
	target.querySelector(".IMG").src = imageUrl
	target.href = url
	target.querySelector(".TITLE").textContent = name
}

function addBookmark(name, url, imageUrl){ // create a new bookmark
	document.querySelector("#button-template .IMG").src = imageUrl
	document.querySelector("#button-template").href = url
	document.querySelector("#button-template .TITLE").textContent = name

	var node = document.getElementById("button-template").cloneNode(true);
	node.id = "";
	
	document.getElementById("buttons-container").appendChild(node)
}

function configureBookmark(event){ // open the popup to edit an existing bookmark
	event.preventDefault();
	let currentButton = document.querySelector(".breeze-button:hover");
	let name = currentButton.querySelector(".TITLE").textContent
	let url = currentButton.href
	let imageUrl = currentButton.querySelector(".IMG").src
	configureTarget = currentButton;
	showPopup("Edit bookmark", name, url, imageUrl);
}

function showPopup(popupTitle="Add new bookmark", name="", url="", imageUrl=""){
	configureImage.value = imageUrl
	configureUrl.value = url
	configureName.value = name
	configureTitle.textContent = popupTitle
	popup.style.display = "block";
}

function hidePopup(){
	configureTarget = null;
	popup.style.display = "none";
	saveConfig();
}

function saveConfig(){
	console.log("saving")
	localStorage.setItem("bookmarks", document.getElementById("buttons-container").textContent)
	let data = getButtonData();
	console.log(data)
	localStorage.setItem("bookmarksJSON", JSON.stringify(data))	
}

function deleteStorage(){ // this will remove all saved bookmarks. Use with caution
	console.log("deleting storaged bookmarks")
	localStorage.setItem("bookmarks", null)
	localStorage.setItem("bookmarksJSON", null)
}

function search(query){ // searches for the given query using the default search engine
	browser.tabs.query({ active: true, currentWindow: true })
	.then((tabs) => {
		let currentTab = tabs[0];
		let currentTabId = currentTab.id;
		browser.search.search({query: query, tabId: currentTabId})
	});
}

function getButtonData() {
	const buttonData = [];
	const buttonsContainer = document.getElementById("buttons-container");
	const buttons = buttonsContainer.querySelectorAll("a:not(#button-template)");
	buttons.forEach((button) => {
		const img = button.querySelector(".IMG").src //getAttribute("src");
		const title = button.querySelector(".TITLE").textContent;
		const url = button.href
		const data = {
			title: title,
			url: url,
			img: img
		}
		buttonData.push(data);
	});

	return buttonData;
}

document.addEventListener('click', function(event) {
	if (event.target.classList.contains('edit-button')) {
		configureBookmark(event);
	}
});


addNew.onclick = function() {showPopup()} // show popup when the + button is clicked

window.onclick = function(event) { // When the user clicks anywhere outside of the popup, close it
	if (event.target == popup) {
		hidePopup();
	}
}

window.addEventListener("keydown", (event) => { // When the user clicks ESC, close the popup
	if(event.code === "Escape"){
		hidePopup();
	}
});

newBookmark.onsubmit = function(event){ // handle the save button click, or the enter button pressed
	event.preventDefault();
	
	let imageUrl = configureImage.value;
	let url = configureUrl.value;
	let name = configureName.value;

	if(configureTarget === null){
		addBookmark(name, url, imageUrl)
	} else {
		updateBookmark(name, url, imageUrl, configureTarget)
	}
	
	hidePopup();
}

configureTrash.onclick = function(event){ // handle the trash button click
	event.preventDefault();
	if(configureTarget === null){
		// just close the popup
		hidePopup();
	} else {
		configureTarget.remove()
		console.log("removing bookmark")
		hidePopup();
	}
}

document.getElementById("search-form").onsubmit = function(event){
	event.preventDefault()
	search(document.querySelector('#search-form input').value)
}


/***************************************************************** /

// TODO fix drag n drop
const container = document.querySelector(".buttons");
const items = document.querySelectorAll(".button");

let currentDraggedItem = null;

for (const item of items) {
  item.addEventListener("dragstart", function(e) {
    currentDraggedItem = this;
    e.dataTransfer.setData("text/plain", this.textContent);
  });

  item.addEventListener("dragover", function(e) {
    e.preventDefault();
  });

  item.addEventListener("drop", function(e) {
    e.preventDefault();
    if (currentDraggedItem !== this) {
      container.removeChild(currentDraggedItem);
      container.insertBefore(currentDraggedItem, this.nextSibling); // TODO FIX THIS
	  saveConfig()
    }
  });
}*/