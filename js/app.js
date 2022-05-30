$(document).ready(createTaskList());

// Auto focus on input of add task modal //
$('#add-task-container').on('shown.bs.modal', function () {
    $('#new-task').trigger('focus');
});


async function createTaskList() {
    // Get account from the Ganache EVM //
    try {
        await getAccount();
        // Set contract and set gas //
        contract = new web3.eth.Contract(contractABI, contractAddress);
        try {
            numberOfTask = await contract.methods.getTaskCount().call({ from: web3.eth.defaultAccount });
            /*  The actual number of task may differ because
                when an task is removed the task element is
                removed and the index value now has nothing.
            */
            console.log('Number of Tasks are ' + numberOfTask);
            // If there are task present //
            if (numberOfTask != 0) {
                // Fetch one task after the other until no task remain // 
                console.log('Start fetching task ...');
                let taskIterator = 0;
                while (taskIterator < numberOfTask) {
                    try {
                        let task = await contract.methods.getTask(taskIterator).call({ from: web3.eth.defaultAccount });
                        if (task[0] != '') {
                            // addTaskToList add this task as children to the ul tag //
                            addTaskToList(taskIterator, task[0], task[1], task[2]);
                        }
                        else {
                            console.log('The index ' + taskIterator + ' is empty');
                        }
                    } catch {
                        console.log('Failed to get Task ' + taskIterator);
                    }
                    taskIterator++;
                }
                // Update the task count in HTML //
                updateTasksCount();
            }
        } catch {
            console.log('Failed to get task count from blockchain');
        }
    } catch {
        console.log('Failed to get the acount');
    }

}


function addTaskToList(id, name, date, status) {
    console.log('addTaskToList(): Add Task ' + (id) + ' ' + [name, date, status]);
    /*  Get the id of ul element so to be able to 
        add children to it 
    */
    //let list = document.getElementById('list');
    /*  Create a li element and add the class 
        required to make look good  and 
        set the id of it
    */
    /*let item = document.createElement('li');
    //let item2 = document.createElement('li');
    item.classList.add('list-group-item', 'border-1', 'd-flex', 'justify-content-between', 'align-items-center');
    item.id = 'item-' + id;*/
    // Create a text to add it to the li element//
    let task = document.createTextNode(name);
    let taskdate = document.createTextNode(date);
    
    /*  Create a checkbox and set its id and checked 
        value to add it to the li element 
    */
    var checkbox = document.createElement("INPUT");
    checkbox.setAttribute("type", "checkbox");
    checkbox.setAttribute("id", "item-" + id + "-checkbox");
    checkbox.checked = status;
    /*  if status is true then add task-done class to li
        element so that the text gets a linethrough 
    */
    if (status) {
        row.classList.add("task-done");
    }
    // Add the li element to ul element //
    //list.appendChild(item);
    //list.appendChild(item);
    /* Set a ondblclick event to able to remove the
       item when double clicked on it 
    
    // Append the text of task //
    //item.appendChild(task);
    // Append the date of task //
    //item.appendChild(taskdate);
    //item2.appendChild(taskdate);*/
    
    var details = document.createElement("BUTTON");
    details.innerHTML = "Details";
    var delbutton = document.createElement("BUTTON");
    delbutton.innerHTML = "Delete";
    // Append the checkbox for task //
    //item.appendChild(checkbox);
    //item2.appendChild(checkbox);
    // Add onclick to the checkbox // 
    checkbox.onclick = function () { changeTaskStatus(checkbox.id, id); };
    //table part
    var tasklist = document.getElementById('tasklist');
    var row = tasklist.insertRow(-1);
    row.setAttribute("class","row-data")
    // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
    var cell1 = row.insertCell(0);
    cell1.setAttribute("class","row-heading")
    var cell2 = row.insertCell(1);
    cell2.setAttribute("class","row-heading")
    var cell3 = row.insertCell(2);
    cell3.setAttribute("class","row-heading")
    //row.classList.add('border-1');
    row.id = 'item-' + id;
    // Add some text to the new cells:
    cell1.appendChild(task);
    cell2.appendChild(taskdate);
    cell3.appendChild(details);
    cell3.appendChild(checkbox);
    cell3.appendChild(delbutton);
    delbutton.onclick = function () {
        if(checkbox.checked = true)
            removeTask(row.id);
        else
            alert("Please checkbox the item to delete !");
    }

    /*details.onclick = function(){
        console.log("get details :" + id);
        showTransactionDetails(id);
    }*/
    details.addEventListener('click',async function (event) {
        // Stop all events //
        event.preventDefault();
        event.stopPropagation();
        var receipt = await contract.methods.getTask(id).call({ from: web3.eth.defaultAccount });
        try{
        if(receipt)
            console.log(receipt)
            alert(receipt['task'] + " at " + receipt['time'])
        }
        catch{
            console.log("Failed to access task data !");
        }  
    });
}


async function removeTask(taskIndex) {
    console.log("removeTask(): Remove Task " + taskIndex);
    // Create the selector for the Task //
    let taskSelector = '#' + taskIndex;
    // Make taskIndex to have only task index number
    taskIndex = taskIndex.replace('item-', '');
    try {
        await contract.methods.deleteTask(taskIndex).send({ from: web3.eth.defaultAccount });
        console.log('Remove Task ' + taskIndex + ' from the blockchain');
        // Remove the task from the HTML //
        $(taskSelector).remove();
        // Update the task count in HTML//
        updateTasksCount();
    } catch {
        console.log('Issue occured while removing task item-' + taskIndex);
    }
}

async function changeTaskStatus(id, taskIndex) {
    // Get checkbox element //
    let checkbox = document.getElementById(id);
    // Get the id of the li element //
    let textId = id.replace('-checkbox', '');
    // Get the li element //
    let text = document.getElementById(textId);
    try {
        await contract.methods.updateStatus(taskIndex, checkbox.checked).send({ from: web3.eth.defaultAccount });
        console.log('changeTaskStatus(): Change status of task ' + textId + ' to ' + checkbox.checked);
        if (checkbox.checked) {
            text.classList.add("task-done");
        } else {
            text.classList.remove("task-done");
        }
    } catch (error) {
        console.log('Failed to change Status of task ' + textId + ' in blockchain');
    }
}


function updateTasksCount() {
    // Get the element of ul tag //
    let list = document.getElementById('tbody');
    // Get the count of the ul element //
    let taskCount = list.childElementCount-1;
    console.log('updateTaskCount(): The number of task are ' + taskCount);
    // Set the count to the taskCount id element //
    let count = document.getElementById('taskCount');
    count.innerText = taskCount + " Tasks";
}


async function addTask(name, date) {
    // Get the form element containing the new task //
    let form = document.getElementById('add-task-form');
    // Check if the input is valid and then add it//
    if (form.checkValidity()) {
        console.log('Get the number of task from blockchain');
        // Set blank value for text in the addtask modal //
        document.getElementById('new-task').value = '';
        // Remove the mentioned class because it might be 
        // present if a task was added before
        form.classList.remove('was-validated');
        // Get the number of task from blockchain // 
        contract.methods.getTaskCount().call({ from: web3.eth.defaultAccount }).then(numberOfTask => {
            // Add the task to the HTML //
            addTaskToList(numberOfTask, name, date, false);
            // Update the task count in HTML//
            updateTasksCount();
        }, err => {
            console.log('Failed to get the number of task in blockchain ' + err);
        });
        try {
            var result = await contract.methods.addTask(name, date).send({ from: web3.eth.defaultAccount });
            //this.web3.eth.getPendingTransactions().then(console.log);
            //start of database
            /*
            console.log("error start connection");
            await MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db("taskit");
                dbo.collection("transactions").insertOne(result, function(err, res) {
                  if (err) throw err;
                  console.log("1 document inserted");
                  db.close();
                });
              });
            //end of database*/
            console.log(result)
            alert("Transaction details :\nTransactionHash :"+ result['transactionHash']+"\nFrom :"+ result['from']+"\nTo :"+ result['to']+"\nGasUsed :"+ result['gasUsed']);
            console.log('Added task ' + name + ' to blockchain');
            //var trans = addTransaction(name,receipt);
        } catch {
            console.log('Failed to add task to EVM');
        }

    } else {
        form.addEventListener('submit', function (event) {
            // Stop all events //
            event.preventDefault();
            event.stopPropagation();
            // Add the mentioned class to able to display
            // error to user
            form.classList.add('was-validated');
            // Set blank value for text in the addtask modal //
            document.getElementById('new-task').value = '';
        }, false);
    }
}