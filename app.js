const { remote } = require('electron');
const { dialog } = remote;
const jsmediatags = require('jsmediatags');
const ID3Writer = require('browser-id3-writer');
const fs = require('fs');
const {
    createListItemTemplate,
    getFileNameFromPath,
} = require('./utils');


const PREFIX_TYPES = {
    OP: "OP",
    ED: "ED",
    OST: "OST",
}

class App {

    selectFileBtn = document.querySelector('.js-select-file-btn');
    selectTypeRadios = document.querySelectorAll('.js-type');
    titleInput = document.querySelector('.js-title-input');
    postfixInput = document.querySelector('.js-postfix-input');
    controlsForm = document.querySelector('.js-controls-form');
    runBtn = document.querySelector('.js-run-btn');
    itemsList = document.querySelector('.js-items-list');
    errorMsgEl = document.querySelector('.js-error-msg');
    actualFilesInput = document.querySelector('.js-actual-files-input');
    successMsg = document.querySelector('.js-success-msg');

    domParser = new DOMParser();
    selectedItems = [];
    selectedType = null;
    titleInputValue = '';
    postfixInputValue = 'AnimeNewMusic';
    doneItemsCounter = 0;

    constructor() {
        this.init();
    }

    init() {
        this.addListeners();
    }

    addListeners() {
        this.selectFileBtn.addEventListener(
            'click',
            this.onFilesSelect.bind(this),
            false
        );
        this.titleInput.addEventListener(
            'keyup',
            this.onTitleInputChange,
            false
        );
        this.selectTypeRadios.forEach((radio) => {
            radio.addEventListener('change', this.onTypeChange, false);
        });
        this.controlsForm.addEventListener(
            'submit',
            this.onBeforeStart,
            false
        );
    }

    getSelectedType() {
        let selectedType;
        this.selectTypeRadios.forEach((radio) => {
            if (radio.checked) {
                selectedType = radio.value;
            }
        });
        return selectedType;
    }

    onTitleInputChange = (e) => {
        this.titleInputValue = e.target.value;
    };

    onTypeChange = (e) => {
        this.selectedType = e.target.value;
    };

    toggleErrorMsg(show = true) {
        this.errorMsgEl.style.display = show ? 'block' : 'none';
    }

    toggleSuccessMsg = (show = true) => {
        this.successMsg.style.display = show ? 'block' : 'none';
    };

    onFilesSelect() {
        const t = this;
        dialog
            .showOpenDialog({
                properties: ['openFile', 'multiSelections'],
                filters: [
                    {
                        name: 'MP3 Files',
                        extensions: ['mp3'],
                    },
                ],
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
                    t.renderItemsList(filePaths);
                }
            });
    }

    renderItemsList(filePaths) {
        const preparedItems = this.prepareItems(filePaths);
        if (preparedItems && preparedItems.length) {
            preparedItems.forEach((item) => {
                this.itemsList.appendChild(item);
            });
        }
    }

    prepareItems(filePaths) {
        return filePaths.map((path) => {
            const fileName = getFileNameFromPath(path);
            const itemData = { fileName, path };
            const newItemEl = this.domParser.parseFromString(
                createListItemTemplate(itemData),
                'text/html'
            ).body.childNodes[0];
            this.selectedItems.push(JSON.stringify(itemData));
            this.addListItemListener(newItemEl);
            return newItemEl;
        });
    }

    addListItemListener(item) {
        item.querySelector('input').addEventListener(
            'change',
            this.toggleItemSelected
        );
    }

    removeListItemListener(item) {
        item.querySelector('input').removeEventListener(
            'change',
            this.toggleItemSelected
        );
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
    };

    clearListItemsListeners = () => {
        [...this.itemsList.children].forEach((item) =>
            this.removeListItemListener(item)
        );
    };

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
    };

    resetTypeRadios = () => {
        this.selectedType = null;
        this.selectTypeRadios.forEach((radio) => {
            radio.checked = false;
        });
    };

    resetAppData = () => {
        this.doneItemsCounter = 0;
        this.resetTitleInputVal();
        this.resetTypeRadios();
        this.clearItemsList();
    };

    onBeforeStart = (e) => {
        e.preventDefault();
        if (
            !this.titleInputValue ||
            !this.selectedItems.length ||
            !this.selectedType
        ) {
            this.toggleErrorMsg();
            setTimeout(
                function () {
                    this.toggleErrorMsg(false);
                }.bind(this),
                2000
            );
            return;
        }
        return this.runProcess();
    };

    runProcess = async () => {
        await this.renameSelectedItems();
    };

    finishProcess = () => {
        this.toggleSuccessMsg();
        setTimeout(
            function () {
                this.toggleSuccessMsg(false);
            }.bind(this),
            3500
        );
        this.resetAppData();
    }

    generatePrefix = (item, isFirst) => {
        let typeStr = this.selectedType;
        switch(this.selectedType) {
            case PREFIX_TYPES.OP:
            case PREFIX_TYPES.ED:
                typeStr = isFirst ? this.selectedType : PREFIX_TYPES.OST;
                break;
            case PREFIX_TYPES.OST:
                typeStr = `${this.selectedType}${this.selectedItems.indexOf(JSON.stringify(item)) + 1}`;
                break;
            default:
                break;
        }
        return `[${this.titleInputValue} ${typeStr}]`;
    };

    renameSelectedItems = async () => {
        const t = this;
        await this.selectedItems.forEach(async (selectedItem, index) => {
            await t.renameItem(
                JSON.parse(selectedItem), 
                index === 0,
                index === t.selectedItems.length - 1
            );
        });
    };

    readTitleFromMeta = async (opts) => {
        const { item, successCallback } = opts;
        return await new jsmediatags.Reader(item.path)
            .setTagsToRead(['TIT2', 'TT2'])
            .read({
                onSuccess: (tag) => {
                    return successCallback(tag.tags, opts);
                },
                onError: function(err) {
                    console.error(err);
                }
            });
    }

    processFile = (tags, opts) => {
        const { item, isFirst, isLast } = opts;
        const prefix = this.generatePrefix(item, isFirst);
        try {
            const initialFileBuffer = fs.readFileSync(item.path);
            const writer = new ID3Writer(initialFileBuffer);
            writer.setFrame(
                'TIT2',
                `${tags.title} ${prefix}[${this.postfixInputValue}]`
            );
            writer.addTag();
            const taggedSongBuffer = Buffer.from(writer.arrayBuffer);
            fs.writeFileSync(item.path, taggedSongBuffer);
            this.doneItemsCounter++;
            if (isLast) {
                alert('Success');
                this.finishProcess();
                window.location.reload();
            }
        } catch (e) {
            console.error(e);
        }
    }

    renameItem = async (item, isFirst, isLast) => {
        await this.readTitleFromMeta({
            item, isFirst, isLast, successCallback: this.processFile,
        });
    };
}

module.exports = App;
