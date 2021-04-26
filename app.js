const { remote } = require('electron');
const { dialog } = remote;
const NodeID3 = require('node-id3')
const {
    createListItemTemplate,
    getFileNameFromPath,
} = require('./utils');


const PREFIX_TYPES = {
    OP: "OP",
    ED: "ED",
    OST: "OST",
    MUSIC: "MUSIC",
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
    indexInput = document.querySelector('.js-index-input');

    domParser = new DOMParser();
    selectedItems = [];
    selectedType = null;
    titleInputValue = '';
    postfixInputValue = 'AnimeNewMusic';

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
        if (this.selectedType === PREFIX_TYPES.OST) {
            this.indexInput.disabled = false;
        } else {
            this.indexInput.disabled = true;
        }
    };

    toggleErrorMsg(show = true) {
        this.errorMsgEl.style.display = show ? 'block' : 'none';
    }

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

    runProcess = () => {
        this.renameSelectedItems();
        this.finishProcess();
    };

    finishProcess = (alertText = "success") => {
        alert(alertText);
        window.location.reload();
    }

    generatePrefix = ({ item, isFirst, index }) => {
        let typeStr = this.selectedType;
        switch(this.selectedType) {
            case PREFIX_TYPES.OP:
            case PREFIX_TYPES.ED:
                typeStr = isFirst ? this.selectedType : PREFIX_TYPES.OST;
                break;
            case PREFIX_TYPES.OST:
                // typeStr = `${this.selectedType}${this.selectedItems.indexOf(JSON.stringify(item)) + 1}`;
                typeStr = `${this.selectedType}${index}`;
                break;
            case PREFIX_TYPES.MUSIC:
                // const orderNumber = this.selectedItems.indexOf(JSON.stringify(item)) + 1;
                const orderNumber = `${this.selectedType}${index}`;
                typeStr = `_${orderNumber <= 9 ? "0" : ''}${orderNumber}`;
                return `[${this.titleInputValue}${typeStr}]`;
            default:
                break;
        }
        return `[${this.titleInputValue} ${typeStr}]`;
    };

    generateTitle = (opts) => {
        const { title } = opts;
        const prefix = this.generatePrefix(opts);
        switch(this.selectedType) {
            case PREFIX_TYPES.MUSIC:
            case PREFIX_TYPES.OP:
            case PREFIX_TYPES.ED:
            case PREFIX_TYPES.OST:
            default:
                return `${title} ${prefix}[${this.postfixInputValue}]`;
        }
    }

    renameSelectedItems = () => {
        const t = this;
        const startIndex = Number(this.indexInput.value) || 1;
        this.selectedItems.forEach((selectedItem, index) => {
            t.renameItem(
                JSON.parse(selectedItem), 
                index === 0,
                startIndex + index,
            );
        });
    };

    readTitleFromMeta = (path) => {
        const options = {
            include: ['TIT2'],
        };
        const tags = NodeID3.read(path, options);
        return tags.title;
    }

    processFile = (opts) => {
        const title = this.generateTitle(opts);
        try {
            const options = {
                include: ['TIT2', "TPE1", "TP1", "TALB", "TAL", "PIC"],
            };

            NodeID3.update(
                { title }, 
                opts.item.path,
                options
            );
        } catch (e) {
            console.error(e);
            this.finishProcess("error");
        }
    }

    renameItem = (item, isFirst, index) => {
        const title = this.readTitleFromMeta(item.path);
        this.processFile({ 
            item, 
            isFirst, 
            title, 
            index,
        });
    };
}

module.exports = App;
