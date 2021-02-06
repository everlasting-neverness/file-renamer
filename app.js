const { remote } = require('electron');
const { dialog } = remote;
const fs = require('fs');

const { createListItemTemplate, getFileNameFromPath } = require('./utils');


class App {

    selectFileBtn = document.querySelector('.js-select-file-btn');
    selectTypeRadios = document.querySelectorAll('.js-type');
    titleInput = document.querySelector('.js-title-input');
    controlsForm = document.querySelector('.js-controls-form')
    runBtn = document.querySelector('.js-run-btn');
    itemsList = document.querySelector('.js-items-list');
    errorMsgEl = document.querySelector('.js-error-msg');
    actualFilesInput = document.querySelector('.js-actual-files-input');
    successMsg = document.querySelector('.js-success-msg');

    domParser = new DOMParser();
    selectedItems = [];
    selectedType = null;
    titleInputValue = '';

    constructor() {
        this.init();
    }

    init() {
        this.addListeners();
    }

    addListeners() {
        this.selectFileBtn.addEventListener('click', this.onFilesSelect.bind(this), false);
        this.titleInput.addEventListener('keyup', this.onTitleInputChange, false);
        this.selectTypeRadios.forEach(radio => {
            radio.addEventListener('change', this.onTypeChange, false);
        });
        this.controlsForm.addEventListener('submit', this.onBeforeProccess, false);
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

    onTitleInputChange = (e) => {
        this.titleInputValue = e.target.value;
    }

    onTypeChange = (e) => {
        this.selectedType = e.target.value;
    }

    toggleErrorMsg(show = true) {
        this.errorMsgEl.style.display = show ? 'block' : 'none';
    }

    toggleSuccessMsg = (show = true) => {
        this.successMsg.style.display = show ? 'block' : 'none';
    }

    onFilesSelect() {
        const t = this;
        dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections']
        })
            .then(function (dialogProps) {
                const { filePaths, canceled } = dialogProps;
                if (canceled) {
                    return;
                }
                t.clearItemsList();
                if (filePaths === undefined) {
                    alert('No file selected');
                } else {
                    t.renderItemsList(filePaths)
                }
            });
    }

    renderItemsList(filePaths) {
        const preparedItems = this.prepareItems(filePaths);
        if (preparedItems && preparedItems.length) {
            preparedItems.forEach(item => {
                this.itemsList.appendChild(item);
            });
        }
    }

    prepareItems(filePaths) {
        return filePaths.map(path => {
            const fileName = getFileNameFromPath(path);
            const newItemEl = this.domParser.parseFromString(
                createListItemTemplate({ fileName, path }),
                'text/html'
            ).body.childNodes[0];
            this.addListItemListener(newItemEl);
            return newItemEl;
        });
    }

    addListItemListener(item) {
        item.querySelector('input').addEventListener('change', this.toggleItemSelected);
    }

    removeListItemListener(item) {
        item.querySelector('input').removeEventListener('change', this.toggleItemSelected);
    }

    toggleItemSelected = (e) => {
        const item = e.target.value;
        if (item) {
            if (this.selectedItems.includes(item)) {
                this.selectedItems.splice(this.selectedItems.indexOf(item), 1);
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

    resetTitleInputVal = () => {
        this.titleInput.value = this.titleInputValue = '';
    }

    resetTypeRadios = () => {
        this.selectedType = null;
        this.selectTypeRadios.forEach(radio => {
            radio.checked = false;
        });
    }

    resetAppData = () => {
        this.resetTitleInputVal();
        this.resetTypeRadios();
        this.clearItemsList();
    }

    onBeforeProccess = (e) => {
        e.preventDefault();
        if (!this.titleInputValue || !this.selectedItems.length 
            || !this.selectedType) {
                this.toggleErrorMsg();
                setTimeout(function () {
                    this.toggleErrorMsg(false);
                }.bind(this), 2000);
                return;
        }
        return this.runProccess();
    } 

    runProccess = () => {
        this.renameSelectedItems();
        this.toggleSuccessMsg();
        setTimeout(function() {
            this.toggleSuccessMsg(false);
        }.bind(this), 3500);
        this.resetAppData();
    }

    generatePrefix = () => `${this.selectedType} - ${this.titleInputValue} - `;

    renameSelectedItems = () => {
        const t = this;
        const prefix = this.generatePrefix();
        this.selectedItems.forEach((selectedItem) => {
            t.renameItem(JSON.parse(selectedItem), prefix);
        })
    }

    renameItem = (item, prefix) => {
        const newPath = item.path.replace(item.fileName, `${prefix}${item.fileName}`);
        fs.rename(item.path, newPath, function (err, data) {
            if (err) {
                alert('An error ocurred updating the file' + err.message);
                console.error(err);
                return;
            }
            console.log(`renamed ${item.fileName} to ${prefix}${item.fileName}`);
        })
    }

}


new App();