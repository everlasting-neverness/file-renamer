const { remote } = require('electron');
const { dialog } = remote;
const fs = require('fs');

const { createListItemTemplate, getFileNameFromPath } = require('./utils');


class App {

    selectFileBtn = null;
    selectTypeRadios = null;
    titleInput = null;
    runBtn = null;
    itemsList = null;
    errorMsgEl = null;
    actualFilesInput = null;

    domParser = new DOMParser();
    selectedItems = [];

    constructor() {
        this.init();
    }

    init() {
        this.getLayoutEls();
        this.addListeners();
    }

    getLayoutEls() {
        this.selectFileBtn = document.querySelector('.js-select-file-btn');
        this.selectTypeRadios = document.querySelectorAll('.js-type');
        this.titleInput = document.querySelector('.js-title-input');
        this.runBtn = document.querySelector('.js-run-btn');
        this.itemsList = document.querySelector('.js-items-list');
        this.errorMsgEl = document.querySelector('.js-error-msg');
        this.actualFilesInput = document.querySelector('.js-actual-files-input');
    }

    addListeners() {
        this.selectFileBtn.addEventListener('click', this.onFilesSelect.bind(this), false);
    }

    getSelectedType() {
        let selectedType;
        this.selectTypeRadios.forEach(radio => {
            if (radio.checked) {
                selectedType = radio.value;
            }
        })
        return selectedType;
    }

    toggleErrorMsg(show = true) {
        this.errorMsgEl.style.display = show ? 'block' : 'none';
    }

    onFilesSelect() {
        const t = this;
        dialog.showOpenDialog().then(function (dialogProps) {
            const { filePaths, canceled } = dialogProps;
            if (canceled) {
                return;
            }
            t.clearItemsList();
            if (filePaths === undefined) {
                console.log('No file selected');
            } else {
                // t.actualFilesInput.value = fileNames[0];
                // t.readFile(fileNames[0]);
                t.renderItemsList(filePaths)
            }
        });
    }

    // readFile(filepath) {
    //     fs.readFile(filepath, 'utf-8', function (err, data) {
    //         if (err) {
    //             alert('An error ocurred reading the file :' + err.message);
    //             return;
    //         }
    
    //         document.getElementById('content-editor').value = data;
    //     });
    // }

    renderItemsList(filePaths) {
        console.log(filePaths)
        const preparedItems = this.prepareItems(filePaths);
        if (preparedItems && preparedItems.length) {
            preparedItems.forEach(item => {
                this.itemsList.appendChild(item);
            });
        }
    }

    prepareItems(filePaths) {
        return filePaths.map(path => {
            // TODO: read file name
            const fileName = getFileNameFromPath(path);
            const newItemEl = this.domParser.parseFromString(
                createListItemTemplate(fileName),
                'text/html'
            ).body.childNodes[0];
            this.addListItemListener(newItemEl);
            return newItemEl;
        });
    }

    addListItemListener(item) {
        item.getElementByClassName('js-item-checkbox').addEventListener('change', this.toggleItemSelected);
    }

    removeListItemListener(item) {
        item.getElementByClassName('js-item-checkbox').removeEventListener('change', this.toggleItemSelected);
    }

    toggleItemSelected = (e) => {
        const item = e.targer.value;
        if (item) {
            if (this.selectedItems.includes(items)) {
                // this.selectedItems = [ ...this.selectedItems ]
            } else {
                this.selectedItems.push(item);
            }
        }
    }

    clearListItemsListeners = () => {
        [...this.itemsList.children].forEach(item => this.removeListItemListener(item));
    }

    clearSelectedItems() {
        this.selectedItems = [];
    }

    clearItemsList() {
        this.clearSelectedItems();
        this.clearListItemsListeners();
        this.itemsList.innerHTML = '';
    }
}

// document.querySelector('.js-select-file-btn').addEventListener(
//     'click',
//     function () {
//         dialog.showOpenDialog(function (fileNames) {
//             if (fileNames === undefined) {
//                 console.log('No file selected');
//             } else {
//                 document.getElementById('actual-file').value = fileNames[0];
//                 readFile(fileNames[0]);
//             }
//         });
//     },
//     false
// );

// document.getElementById('save-changes').addEventListener(
//     'click',
//     function () {
//         const actualFilePath = document.getElementById('actual-file').value;

//         if (actualFilePath) {
//             saveChanges(
//                 actualFilePath,
//                 document.getElementById('content-editor').value
//             );
//         } else {
//             alert('Please select a file first');
//         }
//     },
//     false
// );

// document.getElementById('delete-file').addEventListener(
//     'click',
//     function () {
//         const actualFilePath = document.getElementById('actual-file').value;

//         if (actualFilePath) {
//             deleteFile(actualFilePath);
//             document.getElementById('actual-file').value = '';
//             document.getElementById('content-editor').value = '';
//         } else {
//             alert('Please select a file first');
//         }
//     },
//     false
// );

// document.getElementById('create-new-file').addEventListener(
//     'click',
//     function () {
//         const content = document.getElementById('content-editor').value;

//         dialog.showSaveDialog(function (fileName) {
//             if (fileName === undefined) {
//                 console.log("You didn't save the file");
//                 return;
//             }

//             fs.writeFile(fileName, content, function (err) {
//                 if (err) {
//                     alert('An error ocurred creating the file ' + err.message);
//                 }

//                 alert('The file has been succesfully saved');
//             });
//         });
//     },
//     false
// );




// function deleteFile(filepath) {
//     fs.exists(filepath, function (exists) {
//         if (exists) {
//             // File exists deletings
//             fs.unlink(filepath, function (err) {
//                 if (err) {
//                     alert('An error ocurred updating the file' + err.message);
//                     console.log(err);
//                     return;
//                 }
//             });
//         } else {
//             alert("This file doesn't exist, cannot delete");
//         }
//     });
// }

// function saveChanges(filepath, content) {
//     fs.writeFile(filepath, content, function (err) {
//         if (err) {
//             alert('An error ocurred updating the file' + err.message);
//             console.log(err);
//             return;
//         }

//         alert('The file has been succesfully saved');
//     });
// }

new App();


// module.exports = {
//     App
// }