// create variable to hold db connection
let db;

// establish a connection to Index
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('pending', {autoIncrement: true});
};

request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onpugradeneeded event above), save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run checkDatabase() function to send all locaal db data to api
    if (navigator.online) {
        checkDatabase();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    // create a transaction on the pending db with readwrite access
    const transaction = db.transaction(['pending'], 'readwrite');

    const budgectObjectStore = transaction.objectStore('pending');

    // add record to your store with add method
    budgectObjectStore.add(record);
}

function checkDatabase() {
    // open a transaction on your pending db
    const transaction = db.transaction(['pending'], 'readwrite');

    // access your pending onject store
    const budgetObjectStore = transaction.objectStore('pending');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }

                const transaction =db.transaction(['pending'], 'readwrite');
                const budgetObjectStore = transaction.objectStore('pending');
                // clear all itmes in your store
                budgetObjectStore.clear();
            })
            .catch(err=> {
                // set reference to redirect back here
                console.log(err);
            });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);