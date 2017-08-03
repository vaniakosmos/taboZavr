(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const navbar_1 = require("./navbar");
const options_1 = require("./options");
const search_1 = require("./search");
const tabs_1 = require("./tabs");
const defaultOptions_1 = require("./defaultOptions");
const utils_1 = require("./utils");
const logger = new utils_1.Logger('app');
logger.log('inside');
function promiseOptions() {
    return new Promise(function (resolve) {
        chrome.storage.local.get('options', function (result) {
            let options;
            if (result['options']) {
                options = result['options'];
                logger.log('using options loaded from storage');
                logger.log('options:', options);
                resolve(options);
            } else {
                options = JSON.parse(JSON.stringify(defaultOptions_1.default));
                logger.log('using default options and save them into storage');
                logger.log('options:', options);
                chrome.storage.local.set({ 'options': options }, function () {
                    resolve(options);
                });
            }
        });
    });
}
promiseOptions().then(function (options) {
    setTimeout(navbar_1.setUpNavbar, 0);
    setTimeout(options_1.setUpOptions, 0, options);
    setTimeout(search_1.setUpSearch, 0, options.search);
    setTimeout(tabs_1.setUpTabs, 0, options.tabs);
});

},{"./defaultOptions":2,"./navbar":3,"./options":4,"./search":5,"./tabs":6,"./utils":7}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
let options = {
    theme: {
        title: 'New tab',
        header: 'hello ma dude',
        background: {
            def: 'color',
            color: '#a8a8a8',
            image: '',
            url: 'http://i.imgur.com/v558H68.png'
        },
        visibility: {
            opacity: 100,
            revealOnHover: true
        }
    },
    search: {
        def: 'google',
        engines: [{
            name: 'google',
            url: 'http://google.com/search?q='
        }, {
            name: 'images',
            url: 'https://www.google.com/images?q='
        }, {
            name: 'trakt',
            url: 'http://trakt.tv/search?q='
        }, {
            name: 'wiki',
            url: 'https://en.wikipedia.org/w/index.php?search='
        }],
        labelIsUrl: false
    },
    tabs: {
        def: 'Recent',
        grid: {
            cols: 5,
            rows: 5
        },
        entities: [{
            name: 'Fav',
            src: 'bookmark:Bookmarks Bar'
        }, {
            name: 'Top',
            src: 'top'
        }, {
            name: 'Recent',
            src: 'recent'
        }]
    }
};
exports.default = options;

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const logger = new utils_1.Logger('navbar');
function setUpNavbar() {
    setTimeout(setUpNavUrls, 0);
    setTimeout(setUpAddons, 0);
}
exports.setUpNavbar = setUpNavbar;
function setUpNavUrls() {
    logger.log('setting urls...');
    $('#history').click(utils_1.openLinkFunc('chrome://history/'));
    $('#bookmarks').click(utils_1.openLinkFunc('chrome://bookmarks/'));
    $('#extensions').click(utils_1.openLinkFunc('chrome://extensions/'));
    $('#all-apps').click(utils_1.openLinkFunc('chrome://apps/'));
}
function setUpAddons() {
    logger.log('setting add-ons...');
    const $source = $("#app-template").html();
    const appTemplate = Handlebars.compile($source);
    chrome.management.getAll(function (addons) {
        const $apps_list = $('#apps');
        for (let addon of addons) {
            if (addon.type.endsWith('_app')) {
                let icon = '';
                if (addon.icons) {
                    icon = addon.icons[addon.icons.length - 1].url;
                }
                const appHtml = appTemplate({
                    name: addon.name,
                    icon: icon
                });
                const $clickableApp = $(appHtml).click(() => chrome.management.launchApp(addon.id));
                $apps_list.append($clickableApp);
            }
        }
    });
}

},{"./utils":7}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const search_1 = require("./search");
const tabs_1 = require("./tabs");
const logger = new utils_1.Logger('options');
const fieldTemplate = Handlebars.compile($("#field-template").html());
function setUpOptions(options) {
    actions(options);
    themeOptions(options.theme);
    searchOptions(options);
    tabsOptions(options);
}
exports.setUpOptions = setUpOptions;
function fadeInOut($target, html, duration = 1000) {
    $target.html(html).addClass('uk-animation-slide-top-small').removeClass('uk-animation-slide-bottom-small uk-animation-reverse');
    setTimeout(function () {
        $target.remove('uk-animation-slide-top-small').addClass('uk-animation-slide-bottom-small uk-animation-reverse');
    }, duration);
}
function actions(options) {
    logger.log('setting save and set default buttons...');
    const $actionsInfo = $('#actions-info');
    $('#save-settings').click(function () {
        if (options.theme.background.def != 'image') options.theme.background.image = '';
        chrome.storage.local.set({ 'options': options }, function () {
            logger.log('saved');
            fadeInOut($actionsInfo, 'saved', 1500);
        });
    });
    $('#set-default-modal').find('button[name="ok"]').click(function () {
        chrome.storage.local.clear(function () {
            logger.log('cleared storage');
            chrome.tabs.getCurrent(function (tab) {
                chrome.tabs.reload(tab.id);
            });
        });
    });
}
function searchOptions(allOptions) {
    const options = allOptions.search;
    const $fieldsContainer = $('#opt-search-fields');
    const $searchOnLabel = $('#opt-search-labelclick');
    const $error = $('#opt-search-error');
    $searchOnLabel.prop('checked', options.labelIsUrl);
    $searchOnLabel.change(function () {
        options.labelIsUrl = $(this).prop('checked');
    });
    function addField({ name, url }) {
        let $html = $(fieldTemplate({ name: name, second: url, placeholder: 'url...', radioName: 'default-engine' }));
        $html.find('button[uk-close]').click(function () {
            $(this).parent().remove();
        });
        $html.find('input').on('input', function () {
            $(this).removeClass('uk-form-danger');
        });
        $fieldsContainer.append($html);
    }
    $('#opt-search-open').click(function () {
        $fieldsContainer.html('');
        $error.text('');
        options.engines.forEach(function (engine) {
            addField(engine);
        });
        $('#opt-search-add').click(function () {
            addField({ name: '', url: '' });
        });
        $fieldsContainer.find(`input[name="default-engine"][value="${options.def}"]`).prop('checked', true);
    });
    $('#opt-search-save').click(function () {
        const names = new Set();
        const engines = [];
        let error = 0;
        let newDefault = null;
        $fieldsContainer.find('div').each(function () {
            const $nameInput = $(this).find('input[name=first]');
            const $urlInput = $(this).find('input[name=second]');
            const $radio = $(this).find('input[type=radio]');
            const name = $nameInput.val();
            const url = $urlInput.val();
            if (name == '' || names.has(name)) {
                $nameInput.addClass('uk-form-danger');
                error = 1;
            } else if (!url.match(/^https?:\/\/.+\..+\?.+=$/i)) {
                $urlInput.addClass('uk-form-danger');
                error = 2;
            } else {
                names.add(name);
                engines.push({ name: name, url: url });
                if ($radio.prop('checked')) newDefault = name;
            }
        });
        if (newDefault == null && error == 0) error = 3;
        switch (error) {
            case 1:
                $error.text('name must be unique and not empty');
                break;
            case 2:
                $error.text('invalid url');
                break;
            case 3:
                $error.text('specify default search engine (check radio button)');
                break;
        }
        if (error == 0) {
            options.def = newDefault;
            options.engines = engines;
            chrome.storage.local.set({ 'options': allOptions }, function () {
                UIkit.modal($('#opt-search-modal')).hide();
                search_1.setUpEngines(options);
            });
        }
    });
}
function tabsOptions(allOptions) {
    const options = allOptions.tabs;
    const $fieldsContainer = $('#opt-tabs-fields');
    const $sizeInputs = $('#opt-tabs-size').find('input');
    const $error = $('#opt-tabs-error');
    function addField({ name, src }) {
        let $html = $(fieldTemplate({ name: name, second: src, placeholder: 'source...', radioName: 'default-tab' }));
        $html.find('button[uk-close]').click(function () {
            $(this).parent().remove();
        });
        $html.find('input').on('input', function () {
            $(this).removeClass('uk-form-danger');
        });
        $fieldsContainer.append($html);
    }
    $sizeInputs.on('input', function () {
        $(this).removeClass('uk-form-danger');
    });
    $('#opt-tabs-open').click(function () {
        $fieldsContainer.html('');
        $error.html('');
        $sizeInputs.eq(0).val(options.grid.cols);
        $sizeInputs.eq(1).val(options.grid.rows);
        options.entities.forEach(function (tab) {
            addField(tab);
        });
        $('#opt-tabs-add').click(function () {
            addField({ name: '', src: '' });
        });
        $fieldsContainer.find(`input[name="default-tab"][value="${options.def}"]`).prop('checked', true);
    });
    $('#opt-tabs-save').click(function () {
        const names = new Set();
        const tabs = [];
        let error = 0;
        let newDefault = null;
        $fieldsContainer.find('div').each(function () {
            const $nameInput = $(this).find('input[name=first]');
            const $srcInput = $(this).find('input[name=second]');
            const $radio = $(this).find('input[type=radio]');
            const name = $nameInput.val();
            const src = $srcInput.val();
            if (name == '' || names.has(name)) {
                $nameInput.addClass('uk-form-danger');
                error = 1;
            } else if (src != 'recent' && src != 'top' && !src.match(/^bookmark:[^\/]+(\/[^\/]+)*$/i)) {
                $srcInput.addClass('uk-form-danger');
                error = 2;
            } else {
                names.add(name);
                tabs.push({ name: name, src: src });
                if ($radio.prop('checked')) newDefault = name;
            }
        });
        if (newDefault == null && error == 0) error = 3;
        $sizeInputs.each(function () {
            let num = $(this).val();
            console.log(typeof num);
            console.log(num);
            if (num < 2 || num > 10) {
                error = 4;
                $(this).addClass('uk-form-danger');
            }
        });
        switch (error) {
            case 1:
                $error.text('name must be unique and not empty');
                break;
            case 2:
                $error.text('invalid source');
                break;
            case 3:
                $error.text('specify default tab (check radio button)');
                break;
            case 4:
                $error.text('cols and rows must in range [2, 10]');
                break;
        }
        if (error == 0) {
            options.def = newDefault;
            options.entities = tabs;
            options.grid = {
                cols: $sizeInputs.eq(0).val(),
                rows: $sizeInputs.eq(1).val()
            };
            chrome.storage.local.set({ 'options': allOptions }, function () {
                UIkit.modal($('#opt-tabs-modal')).hide();
                tabs_1.setUpTabs(options);
            });
        }
    });
}
function themeOptions(theme) {
    logger.log('setting visibility and background..');
    visibility(theme.visibility);
    background(theme.background);
    title(theme);
}
function title(theme) {
    const $titleInput = $('#title-input');
    $('title').text(theme.title);
    $titleInput.val(theme.title);
    $titleInput.on('input', function () {
        let title = $(this).val();
        theme.title = title;
        $('title').text(title);
    });
}
function background(options) {
    const $body = $('body');
    const $inputs = $('select[name=background]');
    const $colorInput = $('#bg-color-input');
    const $imageInput = $('#bg-image-input');
    const $urlInput = $('#bg-url-input');
    function setColor(color) {
        $body.css('background-color', color).css('background-image', 'none');
    }
    function setImage(image) {
        $body.css('background-color', '').css('background-image', `url("${image}")`);
    }
    function setBG() {
        if (options.def == 'image' && options.image != '') {
            setImage(options.image);
        } else if (options.def == 'url' && options.url != '') {
            setImage(options.url);
        } else {
            setColor(options.color);
        }
    }
    $inputs.val(options.def).change();
    $colorInput.val(options.color);
    $urlInput.val(options.url);
    setBG();
    $inputs.change(function () {
        options.def = $(this).val();
        setBG();
    });
    $colorInput.change(function () {
        let color = $(this).val();
        setColor(color);
        options.color = color;
    });
    $colorInput.click(function () {
        $inputs.val('color').change();
    });
    $imageInput.change(function () {
        const file = $(this).prop("files")[0];
        const reader = new FileReader();
        reader.onloadend = function () {
            let imageUrl = reader.result;
            setImage(imageUrl);
            options.image = imageUrl;
            $inputs.val('image').change();
        };
        if (file) reader.readAsDataURL(file);
    });
    $urlInput.on('input', function () {
        const url = $(this).val();
        if (url.match(/^https?:.*\.(png|jpg|jpeg)$/)) {
            setImage(url);
            options.url = url;
            $inputs.val('url').change();
        }
    });
}
function visibility(options) {
    const $block = $('#opt-visibility');
    const $opacity = $block.find('div').eq(0);
    const $hover = $block.find('div').eq(1);
    const $opacityInput = $opacity.find('input');
    const $hoverInput = $hover.find('input');
    $opacityInput.on('change mousemove', function () {
        const val = $(this).val();
        $opacity.find('span').html(`Opacity: ${val}%`);
        $('.hidable').css('opacity', val / 100);
        options.opacity = val;
    });
    $hoverInput.on('change', function () {
        options.revealOnHover = $(this).prop('checked');
    });
    $('.hidable').hover(function () {
        if ($hoverInput.is(':checked')) {
            $(this).addClass('visible');
        }
    }, function () {
        $(this).removeClass('visible');
    });
    $opacityInput.val(options.opacity).trigger('change');
    $hoverInput.prop('checked', options.revealOnHover);
}

},{"./search":5,"./tabs":6,"./utils":7}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const logger = new utils_1.Logger('search');
function setUpSearch(searchOptions) {
    logger.log('setting search and search engines...');
    const $searchInput = $('#search');
    const $searchButton = $('#search-btn');
    setUpEngines(searchOptions);
    $searchInput.on('keypress', e => {
        if (e.keyCode === 13) {
            e.preventDefault();
            doSearch();
        }
    });
    $searchButton.click(() => {
        doSearch();
    });
}
exports.setUpSearch = setUpSearch;
function setUpEngines(options) {
    const $enginesForm = $('#engines');
    const $source = $("#engine-template").html();
    const engineTemplate = Handlebars.compile($source);
    $enginesForm.html('');
    options.engines.forEach(function (engine) {
        const $engine = $(engineTemplate({
            name: engine.name,
            url: engine.url,
            checked: engine.name === options.def
        }));
        $engine.find('input').click(function () {
            $('#search').focus();
            if (options.labelIsUrl) doSearch($(this).attr('data-url'));
        });
        $enginesForm.append($engine);
    });
}
exports.setUpEngines = setUpEngines;
function doSearch(url = 'http://google.com/search?q=') {
    let query = $('#search').val();
    url = $('#engines').find('input[name=engine]:checked').attr('data-url') || url;
    if (query) {
        const destUrl = url + encodeURIComponent(query);
        chrome.tabs.getCurrent(function (tab) {
            chrome.tabs.update(tab.id, {
                url: destUrl
            });
        });
    }
}

},{"./utils":7}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const logger = new utils_1.Logger('tabs');
const tileTemplate = Handlebars.compile($("#tile-template").html());
const headerTemplate = Handlebars.compile($("#tab-title-template").html());
function setUpTabs(tabs) {
    logger.log('setting tabs...');
    const $tabs = $('#tabs');
    const $headers = $tabs.find('ul').eq(0);
    const $contents = $tabs.find('ul').eq(1);
    $headers.html('');
    $contents.html('');
    for (let tab of tabs.entities) {
        const header = headerTemplate({
            name: tab.name,
            active: tab.name === tabs.def
        });
        $headers.append(header);
        const $content = $('<li>');
        $contents.append($content);
        if (tab.src === 'top') {
            setUpTop($content, tabs.grid);
        } else if (tab.src === 'recent') {
            setUpRecent($content, tabs.grid);
        } else {
            setUpBookmarks(tab, $content, tabs.grid);
        }
    }
}
exports.setUpTabs = setUpTabs;
function addTile($content, data, cols) {
    const $tile = $(tileTemplate({
        favicon: `chrome://favicon/size/16@2x/${data.url}`,
        title: data.title,
        url: decodeURIComponent(data.url)
    }));
    $tile.css('width', `calc(100%/${cols} - 22px)`);
    if (data.url.startsWith('chrome')) {
        $tile.click(utils_1.openLinkFunc(data.url));
    }
    $content.append($tile);
}
function traverse(tree, path) {
    if (path.length === 0) return tree;
    for (let child of tree.children) {
        if (child.title === path[0]) {
            path = path.slice(1);
            return traverse(child, path);
        }
    }
    return null;
}
function setUpTop($content, { rows, cols }) {
    chrome.topSites.get(function (urls) {
        for (let i = 0; i < urls.length && i < rows * cols; i++) {
            addTile($content, urls[i], cols);
        }
    });
}
function setUpRecent($content, { rows, cols }) {
    chrome.sessions.getRecentlyClosed(function (sessions) {
        for (let i = 0; i < sessions.length && i < rows * cols; i++) {
            if (sessions[i].tab) addTile($content, sessions[i].tab, cols);
        }
    });
}
function setUpBookmarks(tab, $content, { rows, cols }) {
    if (!tab.src.startsWith('bookmark:')) return;
    tab.src = tab.src.replace(/\/$/, '');
    const path = tab.src.replace(/^bookmark:/, '').split('/');
    chrome.bookmarks.getTree(function (tree) {
        const bookmarkTree = tree[0];
        const folder = traverse(bookmarkTree, path);
        if (folder) {
            for (let i = 0; i < folder.children.length && i < rows * cols; i++) {
                const bookmark = folder.children[i];
                if (!bookmark.children) {
                    addTile($content, bookmark, cols);
                }
            }
        }
    });
}

},{"./utils":7}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class Logger {
    constructor(name) {
        this.name = name.toUpperCase();
    }
    log(...message) {
        console.log(this.name + ':', ...message);
    }
    error(...message) {
        console.error(this.name + ':', ...message);
    }
}
exports.Logger = Logger;
function openLinkFunc(url) {
    return function (event) {
        if (event.ctrlKey || event.shiftKey || event.metaKey || event.button && event.button === 1) {
            chrome.tabs.create({ url: url, active: false });
        } else {
            chrome.tabs.getCurrent(function (tab) {
                chrome.tabs.update(tab.id, { url: url });
            });
        }
    };
}
exports.openLinkFunc = openLinkFunc;
exports.chunkedStorage = {
    set(items, callback) {
        const storageObj = {};
        for (let key in items) {
            if (!items.hasOwnProperty(key)) continue;
            const objectToStore = items[key];
            let jsonstr = JSON.stringify(objectToStore);
            let i = 0;
            while (jsonstr.length > 0) {
                const index = key + "_" + i++;
                let valueLength = chrome.storage.sync.QUOTA_BYTES_PER_ITEM / 2;
                let segment = jsonstr.substr(0, valueLength);
                storageObj[index] = segment;
                jsonstr = jsonstr.substr(valueLength);
            }
            storageObj[key + '_ size'] = i;
        }
        chrome.storage.sync.set(storageObj, callback);
    },
    get(key, callback) {
        const sizeKey = key + '_ size';
        chrome.storage.sync.get(sizeKey, function (result) {
            if (result[sizeKey]) {
                console.log('chunks:', result[sizeKey]);
                const keys = [];
                for (let i = 0; i < result[sizeKey]; i++) {
                    keys.push(key + '_' + i);
                }
                chrome.storage.sync.get(keys, function (result) {
                    let jsonStr = keys.reduce(function (prev, curr) {
                        return prev + result[curr];
                    }, '');
                    callback({ [key]: JSON.parse(jsonStr) });
                });
            } else {
                callback({});
            }
        });
    },
    remove(key, callback) {}
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvYXBwLnRzIiwic3JjL3RzL2RlZmF1bHRPcHRpb25zLnRzIiwic3JjL3RzL25hdmJhci50cyIsInNyYy90cy9vcHRpb25zLnRzIiwic3JjL3RzL3NlYXJjaC50cyIsInNyYy90cy90YWJzLnRzIiwic3JjL3RzL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FDQ0EseUJBQW9DO0FBQ3BDLDBCQUF1QztBQUN2Qyx5QkFBb0M7QUFDcEMsdUJBQWdDO0FBRWhDLGlDQUE2QztBQUM3Qyx3QkFBOEI7QUFHOUIsTUFBTSxBQUFNLFNBQUcsSUFBSSxRQUFNLE9BQUMsQUFBSyxBQUFDLEFBQUM7QUFDakMsQUFBTSxPQUFDLEFBQUcsSUFBQyxBQUFRLEFBQUMsQUFBQztBQUVyQjtBQUNJLEFBQU0sZUFBSyxBQUFPLFFBQUMsVUFBVSxBQUFPO0FBQ2hDLEFBQU0sZUFBQyxBQUFPLFFBQUMsQUFBSyxNQUFDLEFBQUcsSUFBQyxBQUFTLFdBQUUsVUFBVSxBQUFNO0FBQ2hELGdCQUFJLEFBQWdCLEFBQUM7QUFDckIsQUFBRSxBQUFDLGdCQUFDLEFBQU0sT0FBQyxBQUFTLEFBQUMsQUFBQyxZQUFDLEFBQUM7QUFDcEIsQUFBTywwQkFBRyxBQUFNLE9BQUMsQUFBUyxBQUFZLEFBQUM7QUFDdkMsQUFBTSx1QkFBQyxBQUFHLElBQUMsQUFBbUMsQUFBQyxBQUFDO0FBQ2hELEFBQU0sdUJBQUMsQUFBRyxJQUFDLEFBQVUsWUFBRSxBQUFPLEFBQUMsQUFBQztBQUNoQyxBQUFPLHdCQUFDLEFBQU8sQUFBQyxBQUNwQjtBQUFDLEFBQ0QsQUFBSSxtQkFBQyxBQUFDO0FBQ0YsQUFBTywwQkFBRyxBQUFJLEtBQUMsQUFBSyxNQUFDLEFBQUksS0FBQyxBQUFTLFVBQUMsaUJBQWMsQUFBQyxBQUFDLEFBQUM7QUFDckQsQUFBTSx1QkFBQyxBQUFHLElBQUMsQUFBa0QsQUFBQyxB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Q0FBQyxBQUFHLEFBQUMsTUFBRSxBQUFJLEtBQUMsQUFBSyxNQUFDLEFBQU8sQUFBQyxBQUFDLEFBQUMsQUFBQyxBQUMzQztBQUFDLEFBQUMsQUFDTjtBQUFDLEFBQ0QsQUFBSSxtQkFBQyxBQUFDO0FBQ0YsQUFBUSx5QkFBQyxBQUFFLEFBQUMsQUFBQyxBQUNqQjtBQUFDLEFBQ0w7QUFBQyxBQUFDLEFBQUMsQUFDUDtBQUFDO0FBQ0QsQUFBTSxXQUFDLEFBQUcsS0FBRSxBQUFRLFVBRXBCLENBQUMsQUFDSixBQUFDO0FBNUQwQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQge09wdGlvbnN9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQge3NldFVwTmF2YmFyfSBmcm9tICcuL25hdmJhcidcbmltcG9ydCB7c2V0VXBPcHRpb25zfSBmcm9tIFwiLi9vcHRpb25zXCI7XG5pbXBvcnQge3NldFVwU2VhcmNofSBmcm9tICcuL3NlYXJjaCdcbmltcG9ydCB7c2V0VXBUYWJzfSBmcm9tICcuL3RhYnMnXG5cbmltcG9ydCBkZWZhdWx0T3B0aW9ucyBmcm9tICcuL2RlZmF1bHRPcHRpb25zJ1xuaW1wb3J0IHtMb2dnZXJ9IGZyb20gJy4vdXRpbHMnXG5cblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignYXBwJyk7XG5sb2dnZXIubG9nKCdpbnNpZGUnKTtcblxuZnVuY3Rpb24gcHJvbWlzZU9wdGlvbnMoKTogUHJvbWlzZTxPcHRpb25zPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgnb3B0aW9ucycsIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGxldCBvcHRpb25zOiBPcHRpb25zO1xuICAgICAgICAgICAgaWYgKHJlc3VsdFsnb3B0aW9ucyddKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHJlc3VsdFsnb3B0aW9ucyddIGFzIE9wdGlvbnM7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZygndXNpbmcgb3B0aW9ucyBsb2FkZWQgZnJvbSBzdG9yYWdlJyk7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZygnb3B0aW9uczonLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKG9wdGlvbnMpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkZWZhdWx0T3B0aW9ucykpOyAgLy8gZGVlcCBjb3B5XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZygndXNpbmcgZGVmYXVsdCBvcHRpb25zIGFuZCBzYXZlIHRoZW0gaW50byBzdG9yYWdlJyk7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZygnb3B0aW9uczonLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeydvcHRpb25zJzogb3B0aW9uc30sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShvcHRpb25zKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pO1xufVxuXG5wcm9taXNlT3B0aW9ucygpLnRoZW4oZnVuY3Rpb24gKG9wdGlvbnM6IE9wdGlvbnMpIHtcbiAgICBzZXRUaW1lb3V0KHNldFVwTmF2YmFyLCAwKTtcbiAgICBzZXRUaW1lb3V0KHNldFVwT3B0aW9ucywgMCwgb3B0aW9ucyk7XG4gICAgc2V0VGltZW91dChzZXRVcFNlYXJjaCwgMCwgb3B0aW9ucy5zZWFyY2gpO1xuICAgIHNldFRpbWVvdXQoc2V0VXBUYWJzLCAwLCBvcHRpb25zLnRhYnMpO1xufSk7XG4iLCJpbXBvcnQge09wdGlvbnN9IGZyb20gXCIuL3R5cGVzXCI7XG5cblxubGV0IG9wdGlvbnM6IE9wdGlvbnMgPSB7XG4gICAgdGhlbWU6IHtcbiAgICAgICAgdGl0bGU6ICdOZXcgdGFiJyxcbiAgICAgICAgaGVhZGVyOiAnaGVsbG8gbWEgZHVkZScsXG4gICAgICAgIGJhY2tncm91bmQ6IHtcbiAgICAgICAgICAgIGRlZjogJ2NvbG9yJyxcbiAgICAgICAgICAgIGNvbG9yOiAnI2E4YThhOCcsXG4gICAgICAgICAgICBpbWFnZTogJycsXG4gICAgICAgICAgICB1cmw6ICdodHRwOi8vaS5pbWd1ci5jb20vdjU1OEg2OC5wbmcnLFxuICAgICAgICB9LFxuICAgICAgICB2aXNpYmlsaXR5OiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxMDAsXG4gICAgICAgICAgICByZXZlYWxPbkhvdmVyOiB0cnVlLFxuICAgICAgICB9XG4gICAgfSxcbiAgICBzZWFyY2g6IHtcbiAgICAgICAgZGVmOiAnZ29vZ2xlJyxcbiAgICAgICAgZW5naW5lczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdnb29nbGUnLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHA6Ly9nb29nbGUuY29tL3NlYXJjaD9xPScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpbWFnZXMnLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vd3d3Lmdvb2dsZS5jb20vaW1hZ2VzP3E9JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3RyYWt0JyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwOi8vdHJha3QudHYvc2VhcmNoP3E9JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3dpa2knLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93L2luZGV4LnBocD9zZWFyY2g9JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGxhYmVsSXNVcmw6IGZhbHNlLFxuICAgIH0sXG4gICAgdGFiczoge1xuICAgICAgICBkZWY6ICdSZWNlbnQnLFxuICAgICAgICBncmlkOiB7XG4gICAgICAgICAgICBjb2xzOiA1LFxuICAgICAgICAgICAgcm93czogNSxcbiAgICAgICAgfSxcbiAgICAgICAgZW50aXRpZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnRmF2JyxcbiAgICAgICAgICAgICAgICBzcmM6ICdib29rbWFyazpCb29rbWFya3MgQmFyJyxcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnVG9wJyxcbiAgICAgICAgICAgICAgICBzcmM6ICd0b3AnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnUmVjZW50JyxcbiAgICAgICAgICAgICAgICBzcmM6ICdyZWNlbnQnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBvcHRpb25zO1xuIiwiaW1wb3J0IHtvcGVuTGlua0Z1bmMsIExvZ2dlcn0gZnJvbSBcIi4vdXRpbHNcIjtcblxuXG5jb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCduYXZiYXInKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldFVwTmF2YmFyKCkge1xuICAgIHNldFRpbWVvdXQoc2V0VXBOYXZVcmxzLCAwKTtcbiAgICBzZXRUaW1lb3V0KHNldFVwQWRkb25zLCAwKTtcbn1cblxuZnVuY3Rpb24gc2V0VXBOYXZVcmxzKCkge1xuICAgIGxvZ2dlci5sb2coJ3NldHRpbmcgdXJscy4uLicpO1xuICAgICQoJyNoaXN0b3J5JykuY2xpY2sob3BlbkxpbmtGdW5jKCdjaHJvbWU6Ly9oaXN0b3J5LycpKTtcbiAgICAkKCcjYm9va21hcmtzJykuY2xpY2sob3BlbkxpbmtGdW5jKCdjaHJvbWU6Ly9ib29rbWFya3MvJykpO1xuICAgICQoJyNleHRlbnNpb25zJykuY2xpY2sob3BlbkxpbmtGdW5jKCdjaHJvbWU6Ly9leHRlbnNpb25zLycpKTtcbiAgICAkKCcjYWxsLWFwcHMnKS5jbGljayhvcGVuTGlua0Z1bmMoJ2Nocm9tZTovL2FwcHMvJykpO1xufVxuXG5cbmZ1bmN0aW9uIHNldFVwQWRkb25zKCkge1xuICAgIGxvZ2dlci5sb2coJ3NldHRpbmcgYWRkLW9ucy4uLicpO1xuICAgIGNvbnN0ICRzb3VyY2UgPSAkKFwiI2FwcC10ZW1wbGF0ZVwiKS5odG1sKCk7XG4gICAgY29uc3QgYXBwVGVtcGxhdGUgPSBIYW5kbGViYXJzLmNvbXBpbGUoJHNvdXJjZSk7XG5cbiAgICBjaHJvbWUubWFuYWdlbWVudC5nZXRBbGwoZnVuY3Rpb24gKGFkZG9ucykge1xuICAgICAgICBjb25zdCAkYXBwc19saXN0ID0gJCgnI2FwcHMnKTtcbiAgICAgICAgZm9yIChsZXQgYWRkb24gb2YgYWRkb25zKSB7XG4gICAgICAgICAgICBpZiAoYWRkb24udHlwZS5lbmRzV2l0aCgnX2FwcCcpKSB7XG4gICAgICAgICAgICAgICAgbGV0IGljb24gPSAnJztcbiAgICAgICAgICAgICAgICBpZiAoYWRkb24uaWNvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWNvbiA9IGFkZG9uLmljb25zW2FkZG9uLmljb25zLmxlbmd0aC0xXS51cmw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGFwcEh0bWwgPSBhcHBUZW1wbGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGFkZG9uLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGljb246IGljb24sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgJGNsaWNrYWJsZUFwcCA9ICQoYXBwSHRtbCkuY2xpY2soKCkgPT4gY2hyb21lLm1hbmFnZW1lbnQubGF1bmNoQXBwKGFkZG9uLmlkKSk7XG4gICAgICAgICAgICAgICAgJGFwcHNfbGlzdC5hcHBlbmQoJGNsaWNrYWJsZUFwcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbiIsImltcG9ydCB7QmFja2dyb3VuZCwgRW5naW5lLCBPcHRpb25zLCBTZWFyY2gsIFRhYiwgVGhlbWUsIFZpc2liaWxpdHl9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCB7c2V0VXBFbmdpbmVzfSBmcm9tIFwiLi9zZWFyY2hcIjtcbmltcG9ydCB7c2V0VXBUYWJzfSBmcm9tIFwiLi90YWJzXCI7XG5cblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignb3B0aW9ucycpO1xuXG5jb25zdCBmaWVsZFRlbXBsYXRlID0gSGFuZGxlYmFycy5jb21waWxlKCQoXCIjZmllbGQtdGVtcGxhdGVcIikuaHRtbCgpKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldFVwT3B0aW9ucyhvcHRpb25zOiBPcHRpb25zKSB7XG4gICAgYWN0aW9ucyhvcHRpb25zKTtcbiAgICB0aGVtZU9wdGlvbnMob3B0aW9ucy50aGVtZSk7XG4gICAgc2VhcmNoT3B0aW9ucyhvcHRpb25zKTtcbiAgICB0YWJzT3B0aW9ucyhvcHRpb25zKTtcbn1cblxuZnVuY3Rpb24gZmFkZUluT3V0KCR0YXJnZXQ6IEpRdWVyeSwgaHRtbCwgZHVyYXRpb24gPSAxMDAwKSB7XG4gICAgJHRhcmdldFxuICAgICAgICAuaHRtbChodG1sKVxuICAgICAgICAuYWRkQ2xhc3MoJ3VrLWFuaW1hdGlvbi1zbGlkZS10b3Atc21hbGwnKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ3VrLWFuaW1hdGlvbi1zbGlkZS1ib3R0b20tc21hbGwgdWstYW5pbWF0aW9uLXJldmVyc2UnKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHRhcmdldFxuICAgICAgICAgICAgLnJlbW92ZSgndWstYW5pbWF0aW9uLXNsaWRlLXRvcC1zbWFsbCcpXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ3VrLWFuaW1hdGlvbi1zbGlkZS1ib3R0b20tc21hbGwgdWstYW5pbWF0aW9uLXJldmVyc2UnKTtcblxuICAgIH0sIGR1cmF0aW9uKVxufVxuXG5mdW5jdGlvbiBhY3Rpb25zKG9wdGlvbnMpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIHNhdmUgYW5kIHNldCBkZWZhdWx0IGJ1dHRvbnMuLi4nKTtcbiAgICBjb25zdCAkYWN0aW9uc0luZm8gPSAkKCcjYWN0aW9ucy1pbmZvJyk7XG5cbiAgICAkKCcjc2F2ZS1zZXR0aW5ncycpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMudGhlbWUuYmFja2dyb3VuZC5kZWYgIT0gJ2ltYWdlJylcbiAgICAgICAgICAgIG9wdGlvbnMudGhlbWUuYmFja2dyb3VuZC5pbWFnZSA9ICcnO1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeydvcHRpb25zJzogb3B0aW9uc30sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvZ2dlci5sb2coJ3NhdmVkJyk7XG4gICAgICAgICAgICBmYWRlSW5PdXQoJGFjdGlvbnNJbmZvLCAnc2F2ZWQnLCAxNTAwKVxuICAgICAgICB9KVxuICAgIH0pO1xuXG4gICAgJCgnI3NldC1kZWZhdWx0LW1vZGFsJykuZmluZCgnYnV0dG9uW25hbWU9XCJva1wiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuY2xlYXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9nZ2VyLmxvZygnY2xlYXJlZCBzdG9yYWdlJyk7XG4gICAgICAgICAgICAvLyB0b2RvOiBhcHBseSBkZWZhdWx0IG9wdGlvbnMgdy9vIHJlbG9hZGluZyAoYnV0IG5lZWQgdG8gZXhjbHVkZSBmcm9tIHJlbG9hZGluZyBldmVudCBsaXN0ZW5lcnMgYXBwbGllcnMpXG4gICAgICAgICAgICBjaHJvbWUudGFicy5nZXRDdXJyZW50KGZ1bmN0aW9uICh0YWIpIHtcbiAgICAgICAgICAgICAgICBjaHJvbWUudGFicy5yZWxvYWQodGFiLmlkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2VhcmNoT3B0aW9ucyhhbGxPcHRpb25zOiBPcHRpb25zKSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IGFsbE9wdGlvbnMuc2VhcmNoO1xuICAgIGNvbnN0ICRmaWVsZHNDb250YWluZXIgPSAkKCcjb3B0LXNlYXJjaC1maWVsZHMnKTtcbiAgICBjb25zdCAkc2VhcmNoT25MYWJlbCA9ICQoJyNvcHQtc2VhcmNoLWxhYmVsY2xpY2snKTtcbiAgICBjb25zdCAkZXJyb3IgPSAkKCcjb3B0LXNlYXJjaC1lcnJvcicpO1xuXG4gICAgJHNlYXJjaE9uTGFiZWwucHJvcCgnY2hlY2tlZCcsIG9wdGlvbnMubGFiZWxJc1VybCk7XG5cbiAgICAkc2VhcmNoT25MYWJlbC5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICBvcHRpb25zLmxhYmVsSXNVcmwgPSAkKHRoaXMpLnByb3AoJ2NoZWNrZWQnKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGFkZEZpZWxkKHtuYW1lLCB1cmx9KSB7XG4gICAgICAgIGxldCAkaHRtbCA9ICQoZmllbGRUZW1wbGF0ZSh7bmFtZTogbmFtZSwgc2Vjb25kOiB1cmwsIHBsYWNlaG9sZGVyOiAndXJsLi4uJywgcmFkaW9OYW1lOiAnZGVmYXVsdC1lbmdpbmUnfSkpO1xuICAgICAgICAkaHRtbC5maW5kKCdidXR0b25bdWstY2xvc2VdJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5yZW1vdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgICRodG1sLmZpbmQoJ2lucHV0Jykub24oJ2lucHV0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ3VrLWZvcm0tZGFuZ2VyJylcbiAgICAgICAgfSk7XG4gICAgICAgICRmaWVsZHNDb250YWluZXIuYXBwZW5kKCRodG1sKTtcbiAgICB9XG5cbiAgICAkKCcjb3B0LXNlYXJjaC1vcGVuJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAkZmllbGRzQ29udGFpbmVyLmh0bWwoJycpOyAgLy8gY2xlYXJcbiAgICAgICAgJGVycm9yLnRleHQoJycpO1xuXG4gICAgICAgIG9wdGlvbnMuZW5naW5lcy5mb3JFYWNoKGZ1bmN0aW9uIChlbmdpbmUpIHtcbiAgICAgICAgICAgIGFkZEZpZWxkKGVuZ2luZSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJCgnI29wdC1zZWFyY2gtYWRkJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYWRkRmllbGQoe25hbWU6ICcnLCB1cmw6ICcnfSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJGZpZWxkc0NvbnRhaW5lclxuICAgICAgICAgICAgLmZpbmQoYGlucHV0W25hbWU9XCJkZWZhdWx0LWVuZ2luZVwiXVt2YWx1ZT1cIiR7b3B0aW9ucy5kZWZ9XCJdYClcbiAgICAgICAgICAgIC5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG4gICAgfSk7XG5cbiAgICAkKCcjb3B0LXNlYXJjaC1zYXZlJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBuYW1lcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgY29uc3QgZW5naW5lczogRW5naW5lW10gPSBbXTtcbiAgICAgICAgbGV0IGVycm9yID0gMDtcbiAgICAgICAgbGV0IG5ld0RlZmF1bHQgPSBudWxsO1xuXG4gICAgICAgICRmaWVsZHNDb250YWluZXIuZmluZCgnZGl2JykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zdCAkbmFtZUlucHV0ID0gJCh0aGlzKS5maW5kKCdpbnB1dFtuYW1lPWZpcnN0XScpO1xuICAgICAgICAgICAgY29uc3QgJHVybElucHV0ID0gJCh0aGlzKS5maW5kKCdpbnB1dFtuYW1lPXNlY29uZF0nKTtcbiAgICAgICAgICAgIGNvbnN0ICRyYWRpbyA9ICQodGhpcykuZmluZCgnaW5wdXRbdHlwZT1yYWRpb10nKTtcblxuICAgICAgICAgICAgY29uc3QgbmFtZSA9ICRuYW1lSW5wdXQudmFsKCkgYXMgc3RyaW5nO1xuICAgICAgICAgICAgY29uc3QgdXJsID0gJHVybElucHV0LnZhbCgpIGFzIHN0cmluZztcblxuICAgICAgICAgICAgaWYgKG5hbWUgPT0gJycgfHwgbmFtZXMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgJG5hbWVJbnB1dC5hZGRDbGFzcygndWstZm9ybS1kYW5nZXInKTtcbiAgICAgICAgICAgICAgICBlcnJvciA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICghdXJsLm1hdGNoKC9eaHR0cHM/OlxcL1xcLy4rXFwuLitcXD8uKz0kL2kpKSB7XG4gICAgICAgICAgICAgICAgJHVybElucHV0LmFkZENsYXNzKCd1ay1mb3JtLWRhbmdlcicpO1xuICAgICAgICAgICAgICAgIGVycm9yID0gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG5hbWVzLmFkZChuYW1lKTtcbiAgICAgICAgICAgICAgICBlbmdpbmVzLnB1c2goe25hbWU6IG5hbWUsIHVybDogdXJsfSk7XG4gICAgICAgICAgICAgICAgaWYgKCRyYWRpby5wcm9wKCdjaGVja2VkJykpXG4gICAgICAgICAgICAgICAgICAgIG5ld0RlZmF1bHQgPSBuYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAobmV3RGVmYXVsdCA9PSBudWxsICYmIGVycm9yID09IDApXG4gICAgICAgICAgICBlcnJvciA9IDM7XG5cbiAgICAgICAgc3dpdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICRlcnJvci50ZXh0KCduYW1lIG11c3QgYmUgdW5pcXVlIGFuZCBub3QgZW1wdHknKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAkZXJyb3IudGV4dCgnaW52YWxpZCB1cmwnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAkZXJyb3IudGV4dCgnc3BlY2lmeSBkZWZhdWx0IHNlYXJjaCBlbmdpbmUgKGNoZWNrIHJhZGlvIGJ1dHRvbiknKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlcnJvciA9PSAwKSB7XG4gICAgICAgICAgICBvcHRpb25zLmRlZiA9IG5ld0RlZmF1bHQ7XG4gICAgICAgICAgICBvcHRpb25zLmVuZ2luZXMgPSBlbmdpbmVzO1xuICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsnb3B0aW9ucyc6IGFsbE9wdGlvbnN9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgVUlraXQubW9kYWwoJCgnI29wdC1zZWFyY2gtbW9kYWwnKSkuaGlkZSgpO1xuICAgICAgICAgICAgICAgIHNldFVwRW5naW5lcyhvcHRpb25zKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cblxuZnVuY3Rpb24gdGFic09wdGlvbnMoYWxsT3B0aW9uczogT3B0aW9ucykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBhbGxPcHRpb25zLnRhYnM7XG4gICAgY29uc3QgJGZpZWxkc0NvbnRhaW5lciA9ICQoJyNvcHQtdGFicy1maWVsZHMnKTtcbiAgICBjb25zdCAkc2l6ZUlucHV0cyA9ICQoJyNvcHQtdGFicy1zaXplJykuZmluZCgnaW5wdXQnKTtcbiAgICBjb25zdCAkZXJyb3IgPSAkKCcjb3B0LXRhYnMtZXJyb3InKTtcblxuICAgIGZ1bmN0aW9uIGFkZEZpZWxkKHtuYW1lLCBzcmN9KSB7XG4gICAgICAgIGxldCAkaHRtbCA9ICQoZmllbGRUZW1wbGF0ZSh7bmFtZTogbmFtZSwgc2Vjb25kOiBzcmMsIHBsYWNlaG9sZGVyOiAnc291cmNlLi4uJywgcmFkaW9OYW1lOiAnZGVmYXVsdC10YWInfSkpO1xuICAgICAgICAkaHRtbC5maW5kKCdidXR0b25bdWstY2xvc2VdJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5yZW1vdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgICRodG1sLmZpbmQoJ2lucHV0Jykub24oJ2lucHV0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygndWstZm9ybS1kYW5nZXInKVxuICAgICAgICB9KTtcbiAgICAgICAgJGZpZWxkc0NvbnRhaW5lci5hcHBlbmQoJGh0bWwpO1xuICAgIH1cblxuICAgICRzaXplSW5wdXRzLm9uKCdpbnB1dCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygndWstZm9ybS1kYW5nZXInKTtcbiAgICB9KTtcblxuICAgICQoJyNvcHQtdGFicy1vcGVuJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAkZmllbGRzQ29udGFpbmVyLmh0bWwoJycpO1xuICAgICAgICAkZXJyb3IuaHRtbCgnJyk7XG5cbiAgICAgICAgJHNpemVJbnB1dHMuZXEoMCkudmFsKG9wdGlvbnMuZ3JpZC5jb2xzKTtcbiAgICAgICAgJHNpemVJbnB1dHMuZXEoMSkudmFsKG9wdGlvbnMuZ3JpZC5yb3dzKTtcblxuICAgICAgICBvcHRpb25zLmVudGl0aWVzLmZvckVhY2goZnVuY3Rpb24gKHRhYikge1xuICAgICAgICAgICAgYWRkRmllbGQodGFiKVxuICAgICAgICB9KTtcblxuICAgICAgICAkKCcjb3B0LXRhYnMtYWRkJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYWRkRmllbGQoe25hbWU6ICcnLCBzcmM6ICcnfSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJGZpZWxkc0NvbnRhaW5lclxuICAgICAgICAgICAgLmZpbmQoYGlucHV0W25hbWU9XCJkZWZhdWx0LXRhYlwiXVt2YWx1ZT1cIiR7b3B0aW9ucy5kZWZ9XCJdYClcbiAgICAgICAgICAgIC5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG4gICAgfSk7XG5cbiAgICAkKCcjb3B0LXRhYnMtc2F2ZScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgbmFtZXMgPSBuZXcgU2V0KCk7XG4gICAgICAgIGNvbnN0IHRhYnM6IFRhYltdID0gW107XG4gICAgICAgIGxldCBlcnJvciA9IDA7XG4gICAgICAgIGxldCBuZXdEZWZhdWx0ID0gbnVsbDtcblxuICAgICAgICAkZmllbGRzQ29udGFpbmVyLmZpbmQoJ2RpdicpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc3QgJG5hbWVJbnB1dCA9ICQodGhpcykuZmluZCgnaW5wdXRbbmFtZT1maXJzdF0nKTtcbiAgICAgICAgICAgIGNvbnN0ICRzcmNJbnB1dCA9ICQodGhpcykuZmluZCgnaW5wdXRbbmFtZT1zZWNvbmRdJyk7XG4gICAgICAgICAgICBjb25zdCAkcmFkaW8gPSAkKHRoaXMpLmZpbmQoJ2lucHV0W3R5cGU9cmFkaW9dJyk7XG5cbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSAkbmFtZUlucHV0LnZhbCgpIGFzIHN0cmluZztcbiAgICAgICAgICAgIGNvbnN0IHNyYyA9ICRzcmNJbnB1dC52YWwoKSBhcyBzdHJpbmc7XG5cbiAgICAgICAgICAgIGlmIChuYW1lID09ICcnIHx8IG5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgICAgICRuYW1lSW5wdXQuYWRkQ2xhc3MoJ3VrLWZvcm0tZGFuZ2VyJyk7XG4gICAgICAgICAgICAgICAgZXJyb3IgPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc3JjICE9ICdyZWNlbnQnICYmXG4gICAgICAgICAgICAgICAgc3JjICE9ICd0b3AnICYmXG4gICAgICAgICAgICAgICAgIXNyYy5tYXRjaCgvXmJvb2ttYXJrOlteXFwvXSsoXFwvW15cXC9dKykqJC9pKSkge1xuICAgICAgICAgICAgICAgICRzcmNJbnB1dC5hZGRDbGFzcygndWstZm9ybS1kYW5nZXInKTtcbiAgICAgICAgICAgICAgICBlcnJvciA9IDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBuYW1lcy5hZGQobmFtZSk7XG4gICAgICAgICAgICAgICAgdGFicy5wdXNoKHtuYW1lOiBuYW1lLCBzcmM6IHNyY30pO1xuICAgICAgICAgICAgICAgIGlmICgkcmFkaW8ucHJvcCgnY2hlY2tlZCcpKVxuICAgICAgICAgICAgICAgICAgICBuZXdEZWZhdWx0ID0gbmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG5ld0RlZmF1bHQgPT0gbnVsbCAmJiBlcnJvciA9PSAwKVxuICAgICAgICAgICAgZXJyb3IgPSAzO1xuXG4gICAgICAgICRzaXplSW5wdXRzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbGV0IG51bSA9ICQodGhpcykudmFsKCkgYXMgbnVtYmVyO1xuICAgICAgICAgICAgY29uc29sZS5sb2codHlwZW9mIG51bSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhudW0pO1xuICAgICAgICAgICAgaWYgKG51bSA8IDIgfHwgbnVtID4gMTApIHtcbiAgICAgICAgICAgICAgICBlcnJvciA9IDQ7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygndWstZm9ybS1kYW5nZXInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cblxuICAgICAgICBzd2l0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgJGVycm9yLnRleHQoJ25hbWUgbXVzdCBiZSB1bmlxdWUgYW5kIG5vdCBlbXB0eScpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICRlcnJvci50ZXh0KCdpbnZhbGlkIHNvdXJjZScpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICRlcnJvci50ZXh0KCdzcGVjaWZ5IGRlZmF1bHQgdGFiIChjaGVjayByYWRpbyBidXR0b24pJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgJGVycm9yLnRleHQoJ2NvbHMgYW5kIHJvd3MgbXVzdCBpbiByYW5nZSBbMiwgMTBdJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXJyb3IgPT0gMCkge1xuICAgICAgICAgICAgb3B0aW9ucy5kZWYgPSBuZXdEZWZhdWx0O1xuICAgICAgICAgICAgb3B0aW9ucy5lbnRpdGllcyA9IHRhYnM7XG4gICAgICAgICAgICBvcHRpb25zLmdyaWQgPSB7XG4gICAgICAgICAgICAgICAgY29sczogJHNpemVJbnB1dHMuZXEoMCkudmFsKCkgYXMgbnVtYmVyLFxuICAgICAgICAgICAgICAgIHJvd3M6ICRzaXplSW5wdXRzLmVxKDEpLnZhbCgpIGFzIG51bWJlcixcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeydvcHRpb25zJzogYWxsT3B0aW9uc30sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBVSWtpdC5tb2RhbCgkKCcjb3B0LXRhYnMtbW9kYWwnKSkuaGlkZSgpO1xuICAgICAgICAgICAgICAgIHNldFVwVGFicyhvcHRpb25zKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHRoZW1lT3B0aW9ucyh0aGVtZTogVGhlbWUpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIHZpc2liaWxpdHkgYW5kIGJhY2tncm91bmQuLicpO1xuICAgIHZpc2liaWxpdHkodGhlbWUudmlzaWJpbGl0eSk7XG4gICAgYmFja2dyb3VuZCh0aGVtZS5iYWNrZ3JvdW5kKTtcbiAgICB0aXRsZSh0aGVtZSk7XG59XG5cbmZ1bmN0aW9uIHRpdGxlKHRoZW1lOiBUaGVtZSkge1xuICAgIGNvbnN0ICR0aXRsZUlucHV0ID0gJCgnI3RpdGxlLWlucHV0Jyk7XG5cbiAgICAkKCd0aXRsZScpLnRleHQodGhlbWUudGl0bGUpO1xuICAgICR0aXRsZUlucHV0LnZhbCh0aGVtZS50aXRsZSk7XG5cbiAgICAkdGl0bGVJbnB1dC5vbignaW5wdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCB0aXRsZSA9ICQodGhpcykudmFsKCkgYXMgc3RyaW5nO1xuICAgICAgICB0aGVtZS50aXRsZSA9IHRpdGxlO1xuICAgICAgICAkKCd0aXRsZScpLnRleHQodGl0bGUpO1xuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGJhY2tncm91bmQob3B0aW9uczogQmFja2dyb3VuZCkge1xuICAgIGNvbnN0ICRib2R5ID0gJCgnYm9keScpO1xuICAgIGNvbnN0ICRpbnB1dHMgPSAkKCdzZWxlY3RbbmFtZT1iYWNrZ3JvdW5kXScpO1xuXG4gICAgY29uc3QgJGNvbG9ySW5wdXQgPSAkKCcjYmctY29sb3ItaW5wdXQnKTtcbiAgICBjb25zdCAkaW1hZ2VJbnB1dCA9ICQoJyNiZy1pbWFnZS1pbnB1dCcpO1xuICAgIGNvbnN0ICR1cmxJbnB1dCA9ICQoJyNiZy11cmwtaW5wdXQnKTtcblxuICAgIGZ1bmN0aW9uIHNldENvbG9yKGNvbG9yKSB7XG4gICAgICAgICRib2R5XG4gICAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgY29sb3IpXG4gICAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgJ25vbmUnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRJbWFnZShpbWFnZSkge1xuICAgICAgICAkYm9keVxuICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsICcnKVxuICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1pbWFnZScsIGB1cmwoXCIke2ltYWdlfVwiKWApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldEJHKCkge1xuICAgICAgICBpZiAob3B0aW9ucy5kZWYgPT0gJ2ltYWdlJyAmJiBvcHRpb25zLmltYWdlICE9ICcnKSB7XG4gICAgICAgICAgICBzZXRJbWFnZShvcHRpb25zLmltYWdlKVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuZGVmID09ICd1cmwnICYmIG9wdGlvbnMudXJsICE9ICcnKSB7XG4gICAgICAgICAgICBzZXRJbWFnZShvcHRpb25zLnVybClcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNldENvbG9yKG9wdGlvbnMuY29sb3IpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzZXQgdXAgb3B0aW9ucyBjdXJyZW50IHZhbHVlc1xuICAgICRpbnB1dHMudmFsKG9wdGlvbnMuZGVmKS5jaGFuZ2UoKTtcbiAgICAkY29sb3JJbnB1dC52YWwob3B0aW9ucy5jb2xvcik7XG4gICAgJHVybElucHV0LnZhbChvcHRpb25zLnVybCk7XG5cbiAgICAvLyBzZXQgdXAgYmdcbiAgICBzZXRCRygpO1xuXG4gICAgLy8gc2V0IHVwIGxpc3RlbmVyc1xuICAgICRpbnB1dHMuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgb3B0aW9ucy5kZWYgPSAkKHRoaXMpLnZhbCgpIGFzIHN0cmluZztcbiAgICAgICAgc2V0QkcoKTtcbiAgICB9KTtcblxuICAgICRjb2xvcklucHV0LmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBjb2xvciA9ICQodGhpcykudmFsKCkgYXMgc3RyaW5nO1xuICAgICAgICBzZXRDb2xvcihjb2xvcik7XG4gICAgICAgIG9wdGlvbnMuY29sb3IgPSBjb2xvcjtcbiAgICB9KTtcblxuICAgICRjb2xvcklucHV0LmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJGlucHV0cy52YWwoJ2NvbG9yJykuY2hhbmdlKCk7XG4gICAgfSk7XG5cbiAgICAkaW1hZ2VJbnB1dC5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBmaWxlID0gJCh0aGlzKS5wcm9wKFwiZmlsZXNcIilbMF07XG4gICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWRlbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsZXQgaW1hZ2VVcmwgPSByZWFkZXIucmVzdWx0O1xuICAgICAgICAgICAgc2V0SW1hZ2UoaW1hZ2VVcmwpO1xuICAgICAgICAgICAgb3B0aW9ucy5pbWFnZSA9IGltYWdlVXJsO1xuICAgICAgICAgICAgJGlucHV0cy52YWwoJ2ltYWdlJykuY2hhbmdlKCk7XG4gICAgICAgIH07XG4gICAgICAgIGlmIChmaWxlKVxuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgfSk7XG5cbiAgICAkdXJsSW5wdXQub24oJ2lucHV0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCB1cmwgPSAkKHRoaXMpLnZhbCgpIGFzIHN0cmluZztcbiAgICAgICAgaWYgKHVybC5tYXRjaCgvXmh0dHBzPzouKlxcLihwbmd8anBnfGpwZWcpJC8pKSB7XG4gICAgICAgICAgICBzZXRJbWFnZSh1cmwpO1xuICAgICAgICAgICAgb3B0aW9ucy51cmwgPSB1cmw7XG4gICAgICAgICAgICAkaW5wdXRzLnZhbCgndXJsJykuY2hhbmdlKCk7XG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5mdW5jdGlvbiB2aXNpYmlsaXR5KG9wdGlvbnM6IFZpc2liaWxpdHkpIHtcbiAgICBjb25zdCAkYmxvY2sgPSAkKCcjb3B0LXZpc2liaWxpdHknKTtcbiAgICBjb25zdCAkb3BhY2l0eSA9ICRibG9jay5maW5kKCdkaXYnKS5lcSgwKTtcbiAgICBjb25zdCAkaG92ZXIgPSAkYmxvY2suZmluZCgnZGl2JykuZXEoMSk7XG4gICAgY29uc3QgJG9wYWNpdHlJbnB1dCA9ICRvcGFjaXR5LmZpbmQoJ2lucHV0Jyk7XG4gICAgY29uc3QgJGhvdmVySW5wdXQgPSAkaG92ZXIuZmluZCgnaW5wdXQnKTtcblxuICAgICRvcGFjaXR5SW5wdXQub24oJ2NoYW5nZSBtb3VzZW1vdmUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9ICQodGhpcykudmFsKCkgYXMgbnVtYmVyO1xuICAgICAgICAkb3BhY2l0eS5maW5kKCdzcGFuJykuaHRtbChgT3BhY2l0eTogJHt2YWx9JWApO1xuICAgICAgICAkKCcuaGlkYWJsZScpLmNzcygnb3BhY2l0eScsIHZhbCAvIDEwMCk7XG4gICAgICAgIG9wdGlvbnMub3BhY2l0eSA9IHZhbDtcbiAgICB9KTtcblxuICAgICRob3ZlcklucHV0Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG9wdGlvbnMucmV2ZWFsT25Ib3ZlciA9ICQodGhpcykucHJvcCgnY2hlY2tlZCcpO1xuICAgIH0pO1xuXG4gICAgJCgnLmhpZGFibGUnKS5ob3ZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICgkaG92ZXJJbnB1dC5pcygnOmNoZWNrZWQnKSkge1xuICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygndmlzaWJsZScpO1xuICAgICAgICB9XG4gICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XG4gICAgfSk7XG5cbiAgICAkb3BhY2l0eUlucHV0LnZhbChvcHRpb25zLm9wYWNpdHkpLnRyaWdnZXIoJ2NoYW5nZScpO1xuICAgICRob3ZlcklucHV0LnByb3AoJ2NoZWNrZWQnLCBvcHRpb25zLnJldmVhbE9uSG92ZXIpO1xufVxuIiwiaW1wb3J0IHtFbmdpbmUsIFNlYXJjaH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7TG9nZ2VyfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5cbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ3NlYXJjaCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0VXBTZWFyY2goc2VhcmNoT3B0aW9uczogU2VhcmNoKSB7XG4gICAgbG9nZ2VyLmxvZygnc2V0dGluZyBzZWFyY2ggYW5kIHNlYXJjaCBlbmdpbmVzLi4uJyk7XG4gICAgY29uc3QgJHNlYXJjaElucHV0ID0gJCgnI3NlYXJjaCcpO1xuICAgIGNvbnN0ICRzZWFyY2hCdXR0b24gPSAkKCcjc2VhcmNoLWJ0bicpO1xuICAgIHNldFVwRW5naW5lcyhzZWFyY2hPcHRpb25zKTtcblxuICAgICRzZWFyY2hJbnB1dC5vbigna2V5cHJlc3MnLCBlID0+IHtcbiAgICAgICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGRvU2VhcmNoKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc2VhcmNoQnV0dG9uLmNsaWNrKCgpID0+IHtcbiAgICAgICAgZG9TZWFyY2goKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFVwRW5naW5lcyhvcHRpb25zOiBTZWFyY2gpOiB2b2lkIHtcbiAgICBjb25zdCAkZW5naW5lc0Zvcm0gPSAkKCcjZW5naW5lcycpO1xuICAgIGNvbnN0ICRzb3VyY2UgPSAkKFwiI2VuZ2luZS10ZW1wbGF0ZVwiKS5odG1sKCk7XG4gICAgY29uc3QgZW5naW5lVGVtcGxhdGUgPSBIYW5kbGViYXJzLmNvbXBpbGUoJHNvdXJjZSk7XG5cbiAgICAkZW5naW5lc0Zvcm0uaHRtbCgnJyk7ICAvLyBjbGVhclxuXG4gICAgb3B0aW9ucy5lbmdpbmVzLmZvckVhY2goZnVuY3Rpb24gKGVuZ2luZSkge1xuICAgICAgICBjb25zdCAkZW5naW5lID0gJChlbmdpbmVUZW1wbGF0ZSh7XG4gICAgICAgICAgICBuYW1lOiBlbmdpbmUubmFtZSxcbiAgICAgICAgICAgIHVybDogZW5naW5lLnVybCxcbiAgICAgICAgICAgIGNoZWNrZWQ6IGVuZ2luZS5uYW1lID09PSBvcHRpb25zLmRlZixcbiAgICAgICAgfSkpO1xuICAgICAgICAkZW5naW5lLmZpbmQoJ2lucHV0JykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCgnI3NlYXJjaCcpLmZvY3VzKCk7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5sYWJlbElzVXJsKVxuICAgICAgICAgICAgICAgIGRvU2VhcmNoKCQodGhpcykuYXR0cignZGF0YS11cmwnKSk7XG4gICAgICAgIH0pO1xuICAgICAgICAkZW5naW5lc0Zvcm0uYXBwZW5kKCRlbmdpbmUpXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGRvU2VhcmNoKHVybCA9ICdodHRwOi8vZ29vZ2xlLmNvbS9zZWFyY2g/cT0nKSB7XG4gICAgbGV0IHF1ZXJ5ID0gJCgnI3NlYXJjaCcpLnZhbCgpO1xuICAgIHVybCA9ICQoJyNlbmdpbmVzJykuZmluZCgnaW5wdXRbbmFtZT1lbmdpbmVdOmNoZWNrZWQnKS5hdHRyKCdkYXRhLXVybCcpIHx8IHVybDtcbiAgICBpZiAocXVlcnkpIHtcbiAgICAgICAgY29uc3QgZGVzdFVybCA9IHVybCArIGVuY29kZVVSSUNvbXBvbmVudChxdWVyeSBhcyBzdHJpbmcpO1xuICAgICAgICBjaHJvbWUudGFicy5nZXRDdXJyZW50KGZ1bmN0aW9uICh0YWIpIHtcbiAgICAgICAgICAgIGNocm9tZS50YWJzLnVwZGF0ZSh0YWIuaWQsIHtcbiAgICAgICAgICAgICAgICB1cmw6IGRlc3RVcmwsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtUYWIsIFRhYnN9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQge29wZW5MaW5rRnVuYywgTG9nZ2VyfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IEJvb2ttYXJrVHJlZU5vZGUgPSBjaHJvbWUuYm9va21hcmtzLkJvb2ttYXJrVHJlZU5vZGU7XG5cblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcigndGFicycpO1xuXG5pbnRlcmZhY2UgVGl0bGVVcmwge1xuICAgIHRpdGxlOiBzdHJpbmcsXG4gICAgdXJsOiBzdHJpbmdcbn1cblxuY29uc3QgdGlsZVRlbXBsYXRlID0gSGFuZGxlYmFycy5jb21waWxlKCQoXCIjdGlsZS10ZW1wbGF0ZVwiKS5odG1sKCkpO1xuY29uc3QgaGVhZGVyVGVtcGxhdGUgPSBIYW5kbGViYXJzLmNvbXBpbGUoJChcIiN0YWItdGl0bGUtdGVtcGxhdGVcIikuaHRtbCgpKTtcblxuXG5leHBvcnQgZnVuY3Rpb24gc2V0VXBUYWJzKHRhYnM6IFRhYnMpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIHRhYnMuLi4nKTtcbiAgICBjb25zdCAkdGFicyA9ICQoJyN0YWJzJyk7XG4gICAgY29uc3QgJGhlYWRlcnMgPSAkdGFicy5maW5kKCd1bCcpLmVxKDApO1xuICAgIGNvbnN0ICRjb250ZW50cyA9ICR0YWJzLmZpbmQoJ3VsJykuZXEoMSk7XG5cbiAgICAkaGVhZGVycy5odG1sKCcnKTtcbiAgICAkY29udGVudHMuaHRtbCgnJyk7XG5cbiAgICBmb3IgKGxldCB0YWIgb2YgdGFicy5lbnRpdGllcykge1xuICAgICAgICBjb25zdCBoZWFkZXIgPSBoZWFkZXJUZW1wbGF0ZSh7XG4gICAgICAgICAgICBuYW1lOiB0YWIubmFtZSxcbiAgICAgICAgICAgIGFjdGl2ZTogdGFiLm5hbWUgPT09IHRhYnMuZGVmLFxuICAgICAgICB9KTtcbiAgICAgICAgJGhlYWRlcnMuYXBwZW5kKGhlYWRlcik7XG4gICAgICAgIGNvbnN0ICRjb250ZW50ID0gJCgnPGxpPicpO1xuICAgICAgICAkY29udGVudHMuYXBwZW5kKCRjb250ZW50KTtcblxuICAgICAgICBpZiAodGFiLnNyYyA9PT0gJ3RvcCcpIHtcbiAgICAgICAgICAgIHNldFVwVG9wKCRjb250ZW50LCB0YWJzLmdyaWQpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGFiLnNyYyA9PT0gJ3JlY2VudCcpIHtcbiAgICAgICAgICAgIHNldFVwUmVjZW50KCRjb250ZW50LCB0YWJzLmdyaWQpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzZXRVcEJvb2ttYXJrcyh0YWIsICRjb250ZW50LCB0YWJzLmdyaWQpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhZGRUaWxlKCRjb250ZW50OiBKUXVlcnksIGRhdGE6IFRpdGxlVXJsLCBjb2xzOiBudW1iZXIpIHtcbiAgICBjb25zdCAkdGlsZSA9ICQodGlsZVRlbXBsYXRlKHtcbiAgICAgICAgZmF2aWNvbjogYGNocm9tZTovL2Zhdmljb24vc2l6ZS8xNkAyeC8ke2RhdGEudXJsfWAsXG4gICAgICAgIHRpdGxlOiBkYXRhLnRpdGxlLFxuICAgICAgICB1cmw6IGRlY29kZVVSSUNvbXBvbmVudChkYXRhLnVybClcbiAgICB9KSk7XG5cbiAgICAkdGlsZS5jc3MoJ3dpZHRoJywgYGNhbGMoMTAwJS8ke2NvbHN9IC0gMjJweClgKTtcblxuICAgIGlmIChkYXRhLnVybC5zdGFydHNXaXRoKCdjaHJvbWUnKSkge1xuICAgICAgICAkdGlsZS5jbGljayhvcGVuTGlua0Z1bmMoZGF0YS51cmwpKTtcbiAgICB9XG5cbiAgICAkY29udGVudC5hcHBlbmQoJHRpbGUpO1xufVxuXG5mdW5jdGlvbiB0cmF2ZXJzZSh0cmVlOiBCb29rbWFya1RyZWVOb2RlLCBwYXRoOiBzdHJpbmdbXSk6IEJvb2ttYXJrVHJlZU5vZGUge1xuICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMClcbiAgICAgICAgcmV0dXJuIHRyZWU7XG4gICAgZm9yIChsZXQgY2hpbGQgb2YgdHJlZS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoY2hpbGQudGl0bGUgPT09IHBhdGhbMF0pIHtcbiAgICAgICAgICAgIHBhdGggPSBwYXRoLnNsaWNlKDEpO1xuICAgICAgICAgICAgcmV0dXJuIHRyYXZlcnNlKGNoaWxkLCBwYXRoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gc2V0VXBUb3AoJGNvbnRlbnQ6IEpRdWVyeSwge3Jvd3MsIGNvbHN9KSB7XG4gICAgY2hyb21lLnRvcFNpdGVzLmdldChmdW5jdGlvbiAodXJscykge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHVybHMubGVuZ3RoICYmIGkgPCByb3dzICogY29sczsgaSsrKSB7XG4gICAgICAgICAgICBhZGRUaWxlKCRjb250ZW50LCB1cmxzW2ldLCBjb2xzKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzZXRVcFJlY2VudCgkY29udGVudDogSlF1ZXJ5LCB7cm93cywgY29sc30pIHtcbiAgICBjaHJvbWUuc2Vzc2lvbnMuZ2V0UmVjZW50bHlDbG9zZWQoZnVuY3Rpb24gKHNlc3Npb25zKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2Vzc2lvbnMubGVuZ3RoICYmIGkgPCByb3dzICogY29sczsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoc2Vzc2lvbnNbaV0udGFiKVxuICAgICAgICAgICAgICAgIGFkZFRpbGUoJGNvbnRlbnQsIHNlc3Npb25zW2ldLnRhYiBhcyBUaXRsZVVybCwgY29scyk7XG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5mdW5jdGlvbiBzZXRVcEJvb2ttYXJrcyh0YWI6IFRhYiwgJGNvbnRlbnQ6IEpRdWVyeSwge3Jvd3MsIGNvbHN9KSB7XG4gICAgaWYgKCF0YWIuc3JjLnN0YXJ0c1dpdGgoJ2Jvb2ttYXJrOicpKSByZXR1cm47XG4gICAgdGFiLnNyYyA9IHRhYi5zcmMucmVwbGFjZSgvXFwvJC8sICcnKTsgIC8vIGRlbGV0ZSB0cmFpbGluZyBzbGFzaCBpZiBwcmVzZW50XG4gICAgY29uc3QgcGF0aCA9IHRhYi5zcmMucmVwbGFjZSgvXmJvb2ttYXJrOi8sICcnKS5zcGxpdCgnLycpO1xuICAgIGNocm9tZS5ib29rbWFya3MuZ2V0VHJlZShmdW5jdGlvbiAodHJlZSkge1xuICAgICAgICBjb25zdCBib29rbWFya1RyZWUgPSB0cmVlWzBdO1xuICAgICAgICBjb25zdCBmb2xkZXIgPSB0cmF2ZXJzZShib29rbWFya1RyZWUsIHBhdGgpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygncGF0aCcsIHBhdGgpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnZm9sZGVyJywgZm9sZGVyKTtcbiAgICAgICAgaWYgKGZvbGRlcikge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmb2xkZXIuY2hpbGRyZW4ubGVuZ3RoICYmIGkgPCByb3dzICogY29sczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYm9va21hcmsgPSBmb2xkZXIuY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgaWYgKCFib29rbWFyay5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBhZGRUaWxlKCRjb250ZW50LCBib29rbWFyayBhcyBUaXRsZVVybCwgY29scyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSlcbn1cbiIsImV4cG9ydCBjbGFzcyBMb2dnZXIge1xuICAgIHByaXZhdGUgbmFtZTogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWUudG9VcHBlckNhc2UoKTtcbiAgICB9XG4gICAgbG9nKC4uLm1lc3NhZ2U6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMubmFtZSArICc6JywgLi4ubWVzc2FnZSk7XG4gICAgfVxuICAgIGVycm9yKC4uLm1lc3NhZ2U6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5uYW1lICsgJzonLCAuLi5tZXNzYWdlKTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvcGVuTGlua0Z1bmModXJsOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5jdHJsS2V5IHx8XG4gICAgICAgICAgICBldmVudC5zaGlmdEtleSB8fFxuICAgICAgICAgICAgZXZlbnQubWV0YUtleSB8fCAgLy8gY21kXG4gICAgICAgICAgICAoZXZlbnQuYnV0dG9uICYmIGV2ZW50LmJ1dHRvbiA9PT0gMSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjaHJvbWUudGFicy5jcmVhdGUoe3VybDogdXJsLCBhY3RpdmU6IGZhbHNlfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjaHJvbWUudGFicy5nZXRDdXJyZW50KGZ1bmN0aW9uICh0YWIpIHtcbiAgICAgICAgICAgICAgICBjaHJvbWUudGFicy51cGRhdGUodGFiLmlkLCB7dXJsOiB1cmx9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBsZXQgY2h1bmtlZFN0b3JhZ2UgPSB7XG4gICAgc2V0KGl0ZW1zOiBPYmplY3QsIGNhbGxiYWNrPykge1xuICAgICAgICBjb25zdCBzdG9yYWdlT2JqID0ge307XG4gICAgICAgIGZvciAobGV0IGtleSBpbiBpdGVtcykge1xuICAgICAgICAgICAgaWYgKCFpdGVtcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSBjb250aW51ZTtcbiAgICAgICAgICAgIGNvbnN0IG9iamVjdFRvU3RvcmUgPSBpdGVtc1trZXldO1xuICAgICAgICAgICAgbGV0IGpzb25zdHIgPSBKU09OLnN0cmluZ2lmeShvYmplY3RUb1N0b3JlKTtcbiAgICAgICAgICAgIGxldCBpID0gMDtcblxuICAgICAgICAgICAgLy8gc3BsaXQganNvbnN0ciBpbnRvIGNodW5rcyBhbmQgc3RvcmUgdGhlbSBpbiBhbiBvYmplY3QgaW5kZXhlZCBieSBga2V5X2lgXG4gICAgICAgICAgICB3aGlsZSAoanNvbnN0ci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBrZXkgKyBcIl9cIiArIGkrKztcblxuICAgICAgICAgICAgICAgIC8vIHNpbmNlIHRoZSBrZXkgdXNlcyB1cCBzb21lIHBlci1pdGVtIHF1b3RhLCBzZWUgaG93IG11Y2ggaXMgbGVmdCBmb3IgdGhlIHZhbHVlXG4gICAgICAgICAgICAgICAgLy8gYWxzbyB0cmltIG9mZiAyIGZvciBxdW90ZXMgYWRkZWQgYnkgc3RvcmFnZS10aW1lIGBzdHJpbmdpZnlgXG4gICAgICAgICAgICAgICAgLy8gbGV0IHZhbHVlTGVuZ3RoID0gY2hyb21lLnN0b3JhZ2Uuc3luYy5RVU9UQV9CWVRFU19QRVJfSVRFTSAtIGluZGV4Lmxlbmd0aCAtIDI7XG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlTGVuZ3RoID0gY2hyb21lLnN0b3JhZ2Uuc3luYy5RVU9UQV9CWVRFU19QRVJfSVRFTSAvIDI7XG4gICAgICAgICAgICAgICAgLy8gbGV0IHZhbHVlTGVuZ3RoID0gMTAwO1xuXG4gICAgICAgICAgICAgICAgLy8gdHJpbSBkb3duIHNlZ21lbnQgc28gaXQgd2lsbCBiZSBzbWFsbCBlbm91Z2ggZXZlbiB3aGVuIHJ1biB0aHJvdWdoIGBKU09OLnN0cmluZ2lmeWAgYWdhaW4gYXQgc3RvcmFnZSB0aW1lXG4gICAgICAgICAgICAgICAgbGV0IHNlZ21lbnQgPSBqc29uc3RyLnN1YnN0cigwLCB2YWx1ZUxlbmd0aCk7XG4gICAgICAgICAgICAgICAgLy8gd2hpbGUgKEpTT04uc3RyaW5naWZ5KHNlZ21lbnQpLmxlbmd0aCA+IHZhbHVlTGVuZ3RoKVxuICAgICAgICAgICAgICAgIC8vICAgICBzZWdtZW50ID0ganNvbnN0ci5zdWJzdHIoMCwgLS12YWx1ZUxlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICBzdG9yYWdlT2JqW2luZGV4XSA9IHNlZ21lbnQ7XG4gICAgICAgICAgICAgICAganNvbnN0ciA9IGpzb25zdHIuc3Vic3RyKHZhbHVlTGVuZ3RoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RvcmFnZU9ialtrZXkgKyAnXyBzaXplJ10gPSBpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHN0b3JlIGFsbCB0aGUgY2h1bmtzXG4gICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHN0b3JhZ2VPYmosIGNhbGxiYWNrKTtcbiAgICB9LFxuXG4gICAgZ2V0KGtleTogc3RyaW5nLCBjYWxsYmFjazogKHJlc3VsdDogYW55KSA9PiBhbnkpIHtcbiAgICAgICAgY29uc3Qgc2l6ZUtleSA9IGtleSArICdfIHNpemUnO1xuXG4gICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KHNpemVLZXksIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGlmIChyZXN1bHRbc2l6ZUtleV0pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnY2h1bmtzOicsIHJlc3VsdFtzaXplS2V5XSk7XG4gICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzdWx0W3NpemVLZXldOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAga2V5cy5wdXNoKGtleSArICdfJyArIGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLmdldChrZXlzLCBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFzc3VtZSB0aGF0IGtleXMgYXJlIHByZXNlbnRcbiAgICAgICAgICAgICAgICAgICAgbGV0IGpzb25TdHIgPSBrZXlzLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3Vycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByZXYgKyByZXN1bHRbY3Vycl07XG4gICAgICAgICAgICAgICAgICAgIH0sICcnKTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soe1trZXldOiBKU09OLnBhcnNlKGpzb25TdHIpfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHt9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICByZW1vdmUoa2V5LCBjYWxsYmFjaykge1xuICAgICAgICAvLyB0b2RvXG4gICAgfVxufTtcblxuIl19
