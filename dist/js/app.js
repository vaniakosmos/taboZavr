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
    options.engines.forEach(function (engine) {
        addField(engine);
    });
    $('#opt-search-add').click(function () {
        addField({ name: '', url: '' });
    });
    $fieldsContainer.find(`input[name="default-engine"][value="${options.def}"]`).prop('checked', true);
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
    $sizeInputs.eq(0).val(options.grid.cols);
    $sizeInputs.eq(1).val(options.grid.rows);
    $sizeInputs.on('input', function () {
        $(this).removeClass('uk-form-danger');
    });
    options.entities.forEach(function (tab) {
        addField(tab);
    });
    $('#opt-tabs-add').click(function () {
        addField({ name: '', src: '' });
    });
    $fieldsContainer.find(`input[name="default-tab"][value="${options.def}"]`).prop('checked', true);
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
    $tile.css('width', `calc(100%/${cols} - 23px)`);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvYXBwLnRzIiwic3JjL3RzL2RlZmF1bHRPcHRpb25zLnRzIiwic3JjL3RzL25hdmJhci50cyIsInNyYy90cy9vcHRpb25zLnRzIiwic3JjL3RzL3NlYXJjaC50cyIsInNyYy90cy90YWJzLnRzIiwic3JjL3RzL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FDQ0EseUJBQW9DO0FBQ3BDLDBCQUF1QztBQUN2Qyx5QkFBb0M7QUFDcEMsdUJBQWdDO0FBRWhDLGlDQUE2QztBQUM3Qyx3QkFBOEI7QUFHOUIsTUFBTSxBQUFNLFNBQUcsSUFBSSxRQUFNLE9BQUMsQUFBSyxBQUFDLEFBQUM7QUFDakMsQUFBTSxPQUFDLEFBQUcsSUFBQyxBQUFRLEFBQUMsQUFBQztBQUVyQjtBQUNJLEFBQU0sZUFBSyxBQUFPLFFBQUMsVUFBVSxBQUFPO0FBQ2hDLEFBQU0sZUFBQyxBQUFPLFFBQUMsQUFBSyxNQUFDLEFBQUcsSUFBQyxBQUFTLFdBQUUsVUFBVSxBQUFNO0FBQ2hELGdCQUFJLEFBQWdCLEFBQUM7QUFDckIsQUFBRSxBQUFDLGdCQUFDLEFBQU0sT0FBQyxBQUFTLEFBQUMsQUFBQyxZQUFDLEFBQUM7QUFDcEIsQUFBTywwQkFBRyxBQUFNLE9BQUMsQUFBUyxBQUFZLEFBQUM7QUFDdkMsQUFBTSx1QkFBQyxBQUFHLElBQUMsQUFBbUMsQUFBQyxBQUFDO0FBQ2hELEFBQU0sdUJBQUMsQUFBRyxJQUFDLEFBQVUsWUFBRSxBQUFPLEFBQUMsQUFBQztBQUNoQyxBQUFPLHdCQUFDLEFBQU8sQUFBQyxBQUNwQjtBQUFDLEFBQ0QsQUFBSSxtQkFBQyxBQUFDO0FBQ0YsQUFBTywwQkFBRyxBQUFJLEtBQUMsQUFBSyxNQUFDLEFBQUksS0FBQyxBQUFTLFVBQUMsaUJBQWMsQUFBQyxBQUFDLEFBQUM7QUFDckQsQUFBTSx1QkFBQyxBQUFHLElBQUMsQUFBa0QsQUFBQyxB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IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IHtPcHRpb25zfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHtzZXRVcE5hdmJhcn0gZnJvbSAnLi9uYXZiYXInXG5pbXBvcnQge3NldFVwT3B0aW9uc30gZnJvbSBcIi4vb3B0aW9uc1wiO1xuaW1wb3J0IHtzZXRVcFNlYXJjaH0gZnJvbSAnLi9zZWFyY2gnXG5pbXBvcnQge3NldFVwVGFic30gZnJvbSAnLi90YWJzJ1xuXG5pbXBvcnQgZGVmYXVsdE9wdGlvbnMgZnJvbSAnLi9kZWZhdWx0T3B0aW9ucydcbmltcG9ydCB7TG9nZ2VyfSBmcm9tICcuL3V0aWxzJ1xuXG5cbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ2FwcCcpO1xubG9nZ2VyLmxvZygnaW5zaWRlJyk7XG5cbmZ1bmN0aW9uIHByb21pc2VPcHRpb25zKCk6IFByb21pc2U8T3B0aW9ucz4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoJ29wdGlvbnMnLCBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBsZXQgb3B0aW9uczogT3B0aW9ucztcbiAgICAgICAgICAgIGlmIChyZXN1bHRbJ29wdGlvbnMnXSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSByZXN1bHRbJ29wdGlvbnMnXSBhcyBPcHRpb25zO1xuICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coJ3VzaW5nIG9wdGlvbnMgbG9hZGVkIGZyb20gc3RvcmFnZScpO1xuICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coJ29wdGlvbnM6Jywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShvcHRpb25zKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGVmYXVsdE9wdGlvbnMpKTsgIC8vIGRlZXAgY29weVxuICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coJ3VzaW5nIGRlZmF1bHQgb3B0aW9ucyBhbmQgc2F2ZSB0aGVtIGludG8gc3RvcmFnZScpO1xuICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coJ29wdGlvbnM6Jywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsnb3B0aW9ucyc6IG9wdGlvbnN9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUob3B0aW9ucylcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KTtcbn1cblxucHJvbWlzZU9wdGlvbnMoKS50aGVuKGZ1bmN0aW9uIChvcHRpb25zOiBPcHRpb25zKSB7XG4gICAgc2V0VGltZW91dChzZXRVcE5hdmJhciwgMCk7XG4gICAgc2V0VGltZW91dChzZXRVcE9wdGlvbnMsIDAsIG9wdGlvbnMpO1xuICAgIHNldFRpbWVvdXQoc2V0VXBTZWFyY2gsIDAsIG9wdGlvbnMuc2VhcmNoKTtcbiAgICBzZXRUaW1lb3V0KHNldFVwVGFicywgMCwgb3B0aW9ucy50YWJzKTtcbn0pO1xuIiwiaW1wb3J0IHtPcHRpb25zfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5cbmxldCBvcHRpb25zOiBPcHRpb25zID0ge1xuICAgIHRoZW1lOiB7XG4gICAgICAgIHRpdGxlOiAnTmV3IHRhYicsXG4gICAgICAgIGhlYWRlcjogJ2hlbGxvIG1hIGR1ZGUnLFxuICAgICAgICBiYWNrZ3JvdW5kOiB7XG4gICAgICAgICAgICBkZWY6ICdjb2xvcicsXG4gICAgICAgICAgICBjb2xvcjogJyNhOGE4YTgnLFxuICAgICAgICAgICAgaW1hZ2U6ICcnLFxuICAgICAgICAgICAgdXJsOiAnaHR0cDovL2kuaW1ndXIuY29tL3Y1NThINjgucG5nJyxcbiAgICAgICAgfSxcbiAgICAgICAgdmlzaWJpbGl0eToge1xuICAgICAgICAgICAgb3BhY2l0eTogMTAwLFxuICAgICAgICAgICAgcmV2ZWFsT25Ib3ZlcjogdHJ1ZSxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2VhcmNoOiB7XG4gICAgICAgIGRlZjogJ2dvb2dsZScsXG4gICAgICAgIGVuZ2luZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ29vZ2xlJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwOi8vZ29vZ2xlLmNvbS9zZWFyY2g/cT0nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaW1hZ2VzJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL3d3dy5nb29nbGUuY29tL2ltYWdlcz9xPScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0cmFrdCcsXG4gICAgICAgICAgICAgICAgdXJsOiAnaHR0cDovL3RyYWt0LnR2L3NlYXJjaD9xPScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd3aWtpJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL2VuLndpa2lwZWRpYS5vcmcvdy9pbmRleC5waHA/c2VhcmNoPScsXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBsYWJlbElzVXJsOiBmYWxzZSxcbiAgICB9LFxuICAgIHRhYnM6IHtcbiAgICAgICAgZGVmOiAnUmVjZW50JyxcbiAgICAgICAgZ3JpZDoge1xuICAgICAgICAgICAgY29sczogNSxcbiAgICAgICAgICAgIHJvd3M6IDUsXG4gICAgICAgIH0sXG4gICAgICAgIGVudGl0aWVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0ZhdicsXG4gICAgICAgICAgICAgICAgc3JjOiAnYm9va21hcms6Qm9va21hcmtzIEJhcicsXG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ1RvcCcsXG4gICAgICAgICAgICAgICAgc3JjOiAndG9wJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ1JlY2VudCcsXG4gICAgICAgICAgICAgICAgc3JjOiAncmVjZW50JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgb3B0aW9ucztcbiIsImltcG9ydCB7b3BlbkxpbmtGdW5jLCBMb2dnZXJ9IGZyb20gXCIuL3V0aWxzXCI7XG5cblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignbmF2YmFyJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRVcE5hdmJhcigpIHtcbiAgICBzZXRUaW1lb3V0KHNldFVwTmF2VXJscywgMCk7XG4gICAgc2V0VGltZW91dChzZXRVcEFkZG9ucywgMCk7XG59XG5cbmZ1bmN0aW9uIHNldFVwTmF2VXJscygpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIHVybHMuLi4nKTtcbiAgICAkKCcjaGlzdG9yeScpLmNsaWNrKG9wZW5MaW5rRnVuYygnY2hyb21lOi8vaGlzdG9yeS8nKSk7XG4gICAgJCgnI2Jvb2ttYXJrcycpLmNsaWNrKG9wZW5MaW5rRnVuYygnY2hyb21lOi8vYm9va21hcmtzLycpKTtcbiAgICAkKCcjZXh0ZW5zaW9ucycpLmNsaWNrKG9wZW5MaW5rRnVuYygnY2hyb21lOi8vZXh0ZW5zaW9ucy8nKSk7XG4gICAgJCgnI2FsbC1hcHBzJykuY2xpY2sob3BlbkxpbmtGdW5jKCdjaHJvbWU6Ly9hcHBzLycpKTtcbn1cblxuXG5mdW5jdGlvbiBzZXRVcEFkZG9ucygpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIGFkZC1vbnMuLi4nKTtcbiAgICBjb25zdCAkc291cmNlID0gJChcIiNhcHAtdGVtcGxhdGVcIikuaHRtbCgpO1xuICAgIGNvbnN0IGFwcFRlbXBsYXRlID0gSGFuZGxlYmFycy5jb21waWxlKCRzb3VyY2UpO1xuXG4gICAgY2hyb21lLm1hbmFnZW1lbnQuZ2V0QWxsKGZ1bmN0aW9uIChhZGRvbnMpIHtcbiAgICAgICAgY29uc3QgJGFwcHNfbGlzdCA9ICQoJyNhcHBzJyk7XG4gICAgICAgIGZvciAobGV0IGFkZG9uIG9mIGFkZG9ucykge1xuICAgICAgICAgICAgaWYgKGFkZG9uLnR5cGUuZW5kc1dpdGgoJ19hcHAnKSkge1xuICAgICAgICAgICAgICAgIGxldCBpY29uID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKGFkZG9uLmljb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGljb24gPSBhZGRvbi5pY29uc1thZGRvbi5pY29ucy5sZW5ndGgtMV0udXJsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBhcHBIdG1sID0gYXBwVGVtcGxhdGUoe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBhZGRvbi5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBpY29uOiBpY29uLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0ICRjbGlja2FibGVBcHAgPSAkKGFwcEh0bWwpLmNsaWNrKCgpID0+IGNocm9tZS5tYW5hZ2VtZW50LmxhdW5jaEFwcChhZGRvbi5pZCkpO1xuICAgICAgICAgICAgICAgICRhcHBzX2xpc3QuYXBwZW5kKCRjbGlja2FibGVBcHApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG4iLCJpbXBvcnQge0JhY2tncm91bmQsIEVuZ2luZSwgT3B0aW9ucywgU2VhcmNoLCBUYWIsIFRoZW1lLCBWaXNpYmlsaXR5fSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQge3NldFVwRW5naW5lc30gZnJvbSBcIi4vc2VhcmNoXCI7XG5pbXBvcnQge3NldFVwVGFic30gZnJvbSBcIi4vdGFic1wiO1xuXG5cbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ29wdGlvbnMnKTtcblxuY29uc3QgZmllbGRUZW1wbGF0ZSA9IEhhbmRsZWJhcnMuY29tcGlsZSgkKFwiI2ZpZWxkLXRlbXBsYXRlXCIpLmh0bWwoKSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRVcE9wdGlvbnMob3B0aW9uczogT3B0aW9ucykge1xuICAgIGFjdGlvbnMob3B0aW9ucyk7XG4gICAgdGhlbWVPcHRpb25zKG9wdGlvbnMudGhlbWUpO1xuICAgIHNlYXJjaE9wdGlvbnMob3B0aW9ucyk7XG4gICAgdGFic09wdGlvbnMob3B0aW9ucyk7XG59XG5cbmZ1bmN0aW9uIGZhZGVJbk91dCgkdGFyZ2V0OiBKUXVlcnksIGh0bWwsIGR1cmF0aW9uID0gMTAwMCkge1xuICAgICR0YXJnZXRcbiAgICAgICAgLmh0bWwoaHRtbClcbiAgICAgICAgLmFkZENsYXNzKCd1ay1hbmltYXRpb24tc2xpZGUtdG9wLXNtYWxsJylcbiAgICAgICAgLnJlbW92ZUNsYXNzKCd1ay1hbmltYXRpb24tc2xpZGUtYm90dG9tLXNtYWxsIHVrLWFuaW1hdGlvbi1yZXZlcnNlJyk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICR0YXJnZXRcbiAgICAgICAgICAgIC5yZW1vdmUoJ3VrLWFuaW1hdGlvbi1zbGlkZS10b3Atc21hbGwnKVxuICAgICAgICAgICAgLmFkZENsYXNzKCd1ay1hbmltYXRpb24tc2xpZGUtYm90dG9tLXNtYWxsIHVrLWFuaW1hdGlvbi1yZXZlcnNlJyk7XG5cbiAgICB9LCBkdXJhdGlvbilcbn1cblxuZnVuY3Rpb24gYWN0aW9ucyhvcHRpb25zKSB7XG4gICAgbG9nZ2VyLmxvZygnc2V0dGluZyBzYXZlIGFuZCBzZXQgZGVmYXVsdCBidXR0b25zLi4uJyk7XG4gICAgY29uc3QgJGFjdGlvbnNJbmZvID0gJCgnI2FjdGlvbnMtaW5mbycpO1xuXG4gICAgJCgnI3NhdmUtc2V0dGluZ3MnKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChvcHRpb25zLnRoZW1lLmJhY2tncm91bmQuZGVmICE9ICdpbWFnZScpXG4gICAgICAgICAgICBvcHRpb25zLnRoZW1lLmJhY2tncm91bmQuaW1hZ2UgPSAnJztcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsnb3B0aW9ucyc6IG9wdGlvbnN9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsb2dnZXIubG9nKCdzYXZlZCcpO1xuICAgICAgICAgICAgZmFkZUluT3V0KCRhY3Rpb25zSW5mbywgJ3NhdmVkJywgMTUwMClcbiAgICAgICAgfSlcbiAgICB9KTtcblxuICAgICQoJyNzZXQtZGVmYXVsdC1tb2RhbCcpLmZpbmQoJ2J1dHRvbltuYW1lPVwib2tcIl0nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmNsZWFyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvZ2dlci5sb2coJ2NsZWFyZWQgc3RvcmFnZScpO1xuICAgICAgICAgICAgLy8gdG9kbzogYXBwbHkgZGVmYXVsdCBvcHRpb25zIHcvbyByZWxvYWRpbmcgKGJ1dCBuZWVkIHRvIGV4Y2x1ZGUgZnJvbSByZWxvYWRpbmcgZXZlbnQgbGlzdGVuZXJzIGFwcGxpZXJzKVxuICAgICAgICAgICAgY2hyb21lLnRhYnMuZ2V0Q3VycmVudChmdW5jdGlvbiAodGFiKSB7XG4gICAgICAgICAgICAgICAgY2hyb21lLnRhYnMucmVsb2FkKHRhYi5pZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNlYXJjaE9wdGlvbnMoYWxsT3B0aW9uczogT3B0aW9ucykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBhbGxPcHRpb25zLnNlYXJjaDtcbiAgICBjb25zdCAkZmllbGRzQ29udGFpbmVyID0gJCgnI29wdC1zZWFyY2gtZmllbGRzJyk7XG4gICAgY29uc3QgJHNlYXJjaE9uTGFiZWwgPSAkKCcjb3B0LXNlYXJjaC1sYWJlbGNsaWNrJyk7XG4gICAgY29uc3QgJGVycm9yID0gJCgnI29wdC1zZWFyY2gtZXJyb3InKTtcblxuICAgICRzZWFyY2hPbkxhYmVsLnByb3AoJ2NoZWNrZWQnLCBvcHRpb25zLmxhYmVsSXNVcmwpO1xuXG4gICAgJHNlYXJjaE9uTGFiZWwuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgb3B0aW9ucy5sYWJlbElzVXJsID0gJCh0aGlzKS5wcm9wKCdjaGVja2VkJyk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBhZGRGaWVsZCh7bmFtZSwgdXJsfSkge1xuICAgICAgICBsZXQgJGh0bWwgPSAkKGZpZWxkVGVtcGxhdGUoe25hbWU6IG5hbWUsIHNlY29uZDogdXJsLCBwbGFjZWhvbGRlcjogJ3VybC4uLicsIHJhZGlvTmFtZTogJ2RlZmF1bHQtZW5naW5lJ30pKTtcbiAgICAgICAgJGh0bWwuZmluZCgnYnV0dG9uW3VrLWNsb3NlXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQodGhpcykucGFyZW50KCkucmVtb3ZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkaHRtbC5maW5kKCdpbnB1dCcpLm9uKCdpbnB1dCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCd1ay1mb3JtLWRhbmdlcicpXG4gICAgICAgIH0pO1xuICAgICAgICAkZmllbGRzQ29udGFpbmVyLmFwcGVuZCgkaHRtbCk7XG4gICAgfVxuXG4gICAgb3B0aW9ucy5lbmdpbmVzLmZvckVhY2goZnVuY3Rpb24gKGVuZ2luZSkge1xuICAgICAgICBhZGRGaWVsZChlbmdpbmUpXG4gICAgfSk7XG5cbiAgICAkKCcjb3B0LXNlYXJjaC1hZGQnKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGFkZEZpZWxkKHtuYW1lOiAnJywgdXJsOiAnJ30pXG4gICAgfSk7XG5cbiAgICAkZmllbGRzQ29udGFpbmVyXG4gICAgICAgIC5maW5kKGBpbnB1dFtuYW1lPVwiZGVmYXVsdC1lbmdpbmVcIl1bdmFsdWU9XCIke29wdGlvbnMuZGVmfVwiXWApXG4gICAgICAgIC5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG5cbiAgICAkKCcjb3B0LXNlYXJjaC1zYXZlJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBuYW1lcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgY29uc3QgZW5naW5lczogRW5naW5lW10gPSBbXTtcbiAgICAgICAgbGV0IGVycm9yID0gMDtcbiAgICAgICAgbGV0IG5ld0RlZmF1bHQgPSBudWxsO1xuXG4gICAgICAgICRmaWVsZHNDb250YWluZXIuZmluZCgnZGl2JykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zdCAkbmFtZUlucHV0ID0gJCh0aGlzKS5maW5kKCdpbnB1dFtuYW1lPWZpcnN0XScpO1xuICAgICAgICAgICAgY29uc3QgJHVybElucHV0ID0gJCh0aGlzKS5maW5kKCdpbnB1dFtuYW1lPXNlY29uZF0nKTtcbiAgICAgICAgICAgIGNvbnN0ICRyYWRpbyA9ICQodGhpcykuZmluZCgnaW5wdXRbdHlwZT1yYWRpb10nKTtcblxuICAgICAgICAgICAgY29uc3QgbmFtZSA9ICRuYW1lSW5wdXQudmFsKCkgYXMgc3RyaW5nO1xuICAgICAgICAgICAgY29uc3QgdXJsID0gJHVybElucHV0LnZhbCgpIGFzIHN0cmluZztcblxuICAgICAgICAgICAgaWYgKG5hbWUgPT0gJycgfHwgbmFtZXMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgJG5hbWVJbnB1dC5hZGRDbGFzcygndWstZm9ybS1kYW5nZXInKTtcbiAgICAgICAgICAgICAgICBlcnJvciA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICghdXJsLm1hdGNoKC9eaHR0cHM/OlxcL1xcLy4rXFwuLitcXD8uKz0kL2kpKSB7XG4gICAgICAgICAgICAgICAgJHVybElucHV0LmFkZENsYXNzKCd1ay1mb3JtLWRhbmdlcicpO1xuICAgICAgICAgICAgICAgIGVycm9yID0gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG5hbWVzLmFkZChuYW1lKTtcbiAgICAgICAgICAgICAgICBlbmdpbmVzLnB1c2goe25hbWU6IG5hbWUsIHVybDogdXJsfSk7XG4gICAgICAgICAgICAgICAgaWYgKCRyYWRpby5wcm9wKCdjaGVja2VkJykpXG4gICAgICAgICAgICAgICAgICAgIG5ld0RlZmF1bHQgPSBuYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAobmV3RGVmYXVsdCA9PSBudWxsICYmIGVycm9yID09IDApXG4gICAgICAgICAgICBlcnJvciA9IDM7XG5cbiAgICAgICAgc3dpdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICRlcnJvci50ZXh0KCduYW1lIG11c3QgYmUgdW5pcXVlIGFuZCBub3QgZW1wdHknKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAkZXJyb3IudGV4dCgnaW52YWxpZCB1cmwnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAkZXJyb3IudGV4dCgnc3BlY2lmeSBkZWZhdWx0IHNlYXJjaCBlbmdpbmUgKGNoZWNrIHJhZGlvIGJ1dHRvbiknKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlcnJvciA9PSAwKSB7XG4gICAgICAgICAgICBvcHRpb25zLmRlZiA9IG5ld0RlZmF1bHQ7XG4gICAgICAgICAgICBvcHRpb25zLmVuZ2luZXMgPSBlbmdpbmVzO1xuICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsnb3B0aW9ucyc6IGFsbE9wdGlvbnN9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgVUlraXQubW9kYWwoJCgnI29wdC1zZWFyY2gtbW9kYWwnKSkuaGlkZSgpO1xuICAgICAgICAgICAgICAgIHNldFVwRW5naW5lcyhvcHRpb25zKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cblxuZnVuY3Rpb24gdGFic09wdGlvbnMoYWxsT3B0aW9uczogT3B0aW9ucykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBhbGxPcHRpb25zLnRhYnM7XG4gICAgY29uc3QgJGZpZWxkc0NvbnRhaW5lciA9ICQoJyNvcHQtdGFicy1maWVsZHMnKTtcbiAgICBjb25zdCAkc2l6ZUlucHV0cyA9ICQoJyNvcHQtdGFicy1zaXplJykuZmluZCgnaW5wdXQnKTtcbiAgICBjb25zdCAkZXJyb3IgPSAkKCcjb3B0LXRhYnMtZXJyb3InKTtcblxuICAgIGZ1bmN0aW9uIGFkZEZpZWxkKHtuYW1lLCBzcmN9KSB7XG4gICAgICAgIGxldCAkaHRtbCA9ICQoZmllbGRUZW1wbGF0ZSh7bmFtZTogbmFtZSwgc2Vjb25kOiBzcmMsIHBsYWNlaG9sZGVyOiAnc291cmNlLi4uJywgcmFkaW9OYW1lOiAnZGVmYXVsdC10YWInfSkpO1xuICAgICAgICAkaHRtbC5maW5kKCdidXR0b25bdWstY2xvc2VdJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5yZW1vdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgICRodG1sLmZpbmQoJ2lucHV0Jykub24oJ2lucHV0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygndWstZm9ybS1kYW5nZXInKVxuICAgICAgICB9KTtcbiAgICAgICAgJGZpZWxkc0NvbnRhaW5lci5hcHBlbmQoJGh0bWwpO1xuICAgIH1cblxuICAgICRzaXplSW5wdXRzLmVxKDApLnZhbChvcHRpb25zLmdyaWQuY29scyk7XG4gICAgJHNpemVJbnB1dHMuZXEoMSkudmFsKG9wdGlvbnMuZ3JpZC5yb3dzKTtcbiAgICAkc2l6ZUlucHV0cy5vbignaW5wdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ3VrLWZvcm0tZGFuZ2VyJyk7XG4gICAgfSk7XG5cbiAgICBvcHRpb25zLmVudGl0aWVzLmZvckVhY2goZnVuY3Rpb24gKHRhYikge1xuICAgICAgICBhZGRGaWVsZCh0YWIpXG4gICAgfSk7XG5cbiAgICAkKCcjb3B0LXRhYnMtYWRkJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBhZGRGaWVsZCh7bmFtZTogJycsIHNyYzogJyd9KVxuICAgIH0pO1xuXG4gICAgJGZpZWxkc0NvbnRhaW5lclxuICAgICAgICAuZmluZChgaW5wdXRbbmFtZT1cImRlZmF1bHQtdGFiXCJdW3ZhbHVlPVwiJHtvcHRpb25zLmRlZn1cIl1gKVxuICAgICAgICAucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xuXG4gICAgJCgnI29wdC10YWJzLXNhdmUnKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IG5hbWVzID0gbmV3IFNldCgpO1xuICAgICAgICBjb25zdCB0YWJzOiBUYWJbXSA9IFtdO1xuICAgICAgICBsZXQgZXJyb3IgPSAwO1xuICAgICAgICBsZXQgbmV3RGVmYXVsdCA9IG51bGw7XG5cbiAgICAgICAgJGZpZWxkc0NvbnRhaW5lci5maW5kKCdkaXYnKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnN0ICRuYW1lSW5wdXQgPSAkKHRoaXMpLmZpbmQoJ2lucHV0W25hbWU9Zmlyc3RdJyk7XG4gICAgICAgICAgICBjb25zdCAkc3JjSW5wdXQgPSAkKHRoaXMpLmZpbmQoJ2lucHV0W25hbWU9c2Vjb25kXScpO1xuICAgICAgICAgICAgY29uc3QgJHJhZGlvID0gJCh0aGlzKS5maW5kKCdpbnB1dFt0eXBlPXJhZGlvXScpO1xuXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gJG5hbWVJbnB1dC52YWwoKSBhcyBzdHJpbmc7XG4gICAgICAgICAgICBjb25zdCBzcmMgPSAkc3JjSW5wdXQudmFsKCkgYXMgc3RyaW5nO1xuXG4gICAgICAgICAgICBpZiAobmFtZSA9PSAnJyB8fCBuYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgICAgICAkbmFtZUlucHV0LmFkZENsYXNzKCd1ay1mb3JtLWRhbmdlcicpO1xuICAgICAgICAgICAgICAgIGVycm9yID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHNyYyAhPSAncmVjZW50JyAmJlxuICAgICAgICAgICAgICAgIHNyYyAhPSAndG9wJyAmJlxuICAgICAgICAgICAgICAgICFzcmMubWF0Y2goL15ib29rbWFyazpbXlxcL10rKFxcL1teXFwvXSspKiQvaSkpIHtcbiAgICAgICAgICAgICAgICAkc3JjSW5wdXQuYWRkQ2xhc3MoJ3VrLWZvcm0tZGFuZ2VyJyk7XG4gICAgICAgICAgICAgICAgZXJyb3IgPSAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgICAgIHRhYnMucHVzaCh7bmFtZTogbmFtZSwgc3JjOiBzcmN9KTtcbiAgICAgICAgICAgICAgICBpZiAoJHJhZGlvLnByb3AoJ2NoZWNrZWQnKSlcbiAgICAgICAgICAgICAgICAgICAgbmV3RGVmYXVsdCA9IG5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChuZXdEZWZhdWx0ID09IG51bGwgJiYgZXJyb3IgPT0gMClcbiAgICAgICAgICAgIGVycm9yID0gMztcblxuICAgICAgICAkc2l6ZUlucHV0cy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxldCBudW0gPSAkKHRoaXMpLnZhbCgpIGFzIG51bWJlcjtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHR5cGVvZiBudW0pO1xuICAgICAgICAgICAgY29uc29sZS5sb2cobnVtKTtcbiAgICAgICAgICAgIGlmIChudW0gPCAyIHx8IG51bSA+IDEwKSB7XG4gICAgICAgICAgICAgICAgZXJyb3IgPSA0O1xuICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ3VrLWZvcm0tZGFuZ2VyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgc3dpdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICRlcnJvci50ZXh0KCduYW1lIG11c3QgYmUgdW5pcXVlIGFuZCBub3QgZW1wdHknKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAkZXJyb3IudGV4dCgnaW52YWxpZCBzb3VyY2UnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAkZXJyb3IudGV4dCgnc3BlY2lmeSBkZWZhdWx0IHRhYiAoY2hlY2sgcmFkaW8gYnV0dG9uKScpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICRlcnJvci50ZXh0KCdjb2xzIGFuZCByb3dzIG11c3QgaW4gcmFuZ2UgWzIsIDEwXScpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVycm9yID09IDApIHtcbiAgICAgICAgICAgIG9wdGlvbnMuZGVmID0gbmV3RGVmYXVsdDtcbiAgICAgICAgICAgIG9wdGlvbnMuZW50aXRpZXMgPSB0YWJzO1xuICAgICAgICAgICAgb3B0aW9ucy5ncmlkID0ge1xuICAgICAgICAgICAgICAgIGNvbHM6ICRzaXplSW5wdXRzLmVxKDApLnZhbCgpIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICByb3dzOiAkc2l6ZUlucHV0cy5lcSgxKS52YWwoKSBhcyBudW1iZXIsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsnb3B0aW9ucyc6IGFsbE9wdGlvbnN9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgVUlraXQubW9kYWwoJCgnI29wdC10YWJzLW1vZGFsJykpLmhpZGUoKTtcbiAgICAgICAgICAgICAgICBzZXRVcFRhYnMob3B0aW9ucyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiB0aGVtZU9wdGlvbnModGhlbWU6IFRoZW1lKSB7XG4gICAgbG9nZ2VyLmxvZygnc2V0dGluZyB2aXNpYmlsaXR5IGFuZCBiYWNrZ3JvdW5kLi4nKTtcbiAgICB2aXNpYmlsaXR5KHRoZW1lLnZpc2liaWxpdHkpO1xuICAgIGJhY2tncm91bmQodGhlbWUuYmFja2dyb3VuZCk7XG4gICAgdGl0bGUodGhlbWUpO1xufVxuXG5mdW5jdGlvbiB0aXRsZSh0aGVtZTogVGhlbWUpIHtcbiAgICBjb25zdCAkdGl0bGVJbnB1dCA9ICQoJyN0aXRsZS1pbnB1dCcpO1xuXG4gICAgJCgndGl0bGUnKS50ZXh0KHRoZW1lLnRpdGxlKTtcbiAgICAkdGl0bGVJbnB1dC52YWwodGhlbWUudGl0bGUpO1xuXG4gICAgJHRpdGxlSW5wdXQub24oJ2lucHV0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgdGl0bGUgPSAkKHRoaXMpLnZhbCgpIGFzIHN0cmluZztcbiAgICAgICAgdGhlbWUudGl0bGUgPSB0aXRsZTtcbiAgICAgICAgJCgndGl0bGUnKS50ZXh0KHRpdGxlKTtcbiAgICB9KVxufVxuXG5mdW5jdGlvbiBiYWNrZ3JvdW5kKG9wdGlvbnM6IEJhY2tncm91bmQpIHtcbiAgICBjb25zdCAkYm9keSA9ICQoJ2JvZHknKTtcbiAgICBjb25zdCAkaW5wdXRzID0gJCgnc2VsZWN0W25hbWU9YmFja2dyb3VuZF0nKTtcblxuICAgIGNvbnN0ICRjb2xvcklucHV0ID0gJCgnI2JnLWNvbG9yLWlucHV0Jyk7XG4gICAgY29uc3QgJGltYWdlSW5wdXQgPSAkKCcjYmctaW1hZ2UtaW5wdXQnKTtcbiAgICBjb25zdCAkdXJsSW5wdXQgPSAkKCcjYmctdXJsLWlucHV0Jyk7XG5cbiAgICBmdW5jdGlvbiBzZXRDb2xvcihjb2xvcikge1xuICAgICAgICAkYm9keVxuICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIGNvbG9yKVxuICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1pbWFnZScsICdub25lJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0SW1hZ2UoaW1hZ2UpIHtcbiAgICAgICAgJGJvZHlcbiAgICAgICAgICAgIC5jc3MoJ2JhY2tncm91bmQtY29sb3InLCAnJylcbiAgICAgICAgICAgIC5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBgdXJsKFwiJHtpbWFnZX1cIilgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRCRygpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuZGVmID09ICdpbWFnZScgJiYgb3B0aW9ucy5pbWFnZSAhPSAnJykge1xuICAgICAgICAgICAgc2V0SW1hZ2Uob3B0aW9ucy5pbWFnZSlcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLmRlZiA9PSAndXJsJyAmJiBvcHRpb25zLnVybCAhPSAnJykge1xuICAgICAgICAgICAgc2V0SW1hZ2Uob3B0aW9ucy51cmwpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzZXRDb2xvcihvcHRpb25zLmNvbG9yKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gc2V0IHVwIG9wdGlvbnMgY3VycmVudCB2YWx1ZXNcbiAgICAkaW5wdXRzLnZhbChvcHRpb25zLmRlZikuY2hhbmdlKCk7XG4gICAgJGNvbG9ySW5wdXQudmFsKG9wdGlvbnMuY29sb3IpO1xuICAgICR1cmxJbnB1dC52YWwob3B0aW9ucy51cmwpO1xuXG4gICAgLy8gc2V0IHVwIGJnXG4gICAgc2V0QkcoKTtcblxuICAgIC8vIHNldCB1cCBsaXN0ZW5lcnNcbiAgICAkaW5wdXRzLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIG9wdGlvbnMuZGVmID0gJCh0aGlzKS52YWwoKSBhcyBzdHJpbmc7XG4gICAgICAgIHNldEJHKCk7XG4gICAgfSk7XG5cbiAgICAkY29sb3JJbnB1dC5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgY29sb3IgPSAkKHRoaXMpLnZhbCgpIGFzIHN0cmluZztcbiAgICAgICAgc2V0Q29sb3IoY29sb3IpO1xuICAgICAgICBvcHRpb25zLmNvbG9yID0gY29sb3I7XG4gICAgfSk7XG5cbiAgICAkY29sb3JJbnB1dC5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICRpbnB1dHMudmFsKCdjb2xvcicpLmNoYW5nZSgpO1xuICAgIH0pO1xuXG4gICAgJGltYWdlSW5wdXQuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgZmlsZSA9ICQodGhpcykucHJvcChcImZpbGVzXCIpWzBdO1xuICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkZW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbGV0IGltYWdlVXJsID0gcmVhZGVyLnJlc3VsdDtcbiAgICAgICAgICAgIHNldEltYWdlKGltYWdlVXJsKTtcbiAgICAgICAgICAgIG9wdGlvbnMuaW1hZ2UgPSBpbWFnZVVybDtcbiAgICAgICAgICAgICRpbnB1dHMudmFsKCdpbWFnZScpLmNoYW5nZSgpO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoZmlsZSlcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgIH0pO1xuXG4gICAgJHVybElucHV0Lm9uKCdpbnB1dCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgdXJsID0gJCh0aGlzKS52YWwoKSBhcyBzdHJpbmc7XG4gICAgICAgIGlmICh1cmwubWF0Y2goL15odHRwcz86LipcXC4ocG5nfGpwZ3xqcGVnKSQvKSkge1xuICAgICAgICAgICAgc2V0SW1hZ2UodXJsKTtcbiAgICAgICAgICAgIG9wdGlvbnMudXJsID0gdXJsO1xuICAgICAgICAgICAgJGlucHV0cy52YWwoJ3VybCcpLmNoYW5nZSgpO1xuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gdmlzaWJpbGl0eShvcHRpb25zOiBWaXNpYmlsaXR5KSB7XG4gICAgY29uc3QgJGJsb2NrID0gJCgnI29wdC12aXNpYmlsaXR5Jyk7XG4gICAgY29uc3QgJG9wYWNpdHkgPSAkYmxvY2suZmluZCgnZGl2JykuZXEoMCk7XG4gICAgY29uc3QgJGhvdmVyID0gJGJsb2NrLmZpbmQoJ2RpdicpLmVxKDEpO1xuICAgIGNvbnN0ICRvcGFjaXR5SW5wdXQgPSAkb3BhY2l0eS5maW5kKCdpbnB1dCcpO1xuICAgIGNvbnN0ICRob3ZlcklucHV0ID0gJGhvdmVyLmZpbmQoJ2lucHV0Jyk7XG5cbiAgICAkb3BhY2l0eUlucHV0Lm9uKCdjaGFuZ2UgbW91c2Vtb3ZlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCB2YWwgPSAkKHRoaXMpLnZhbCgpIGFzIG51bWJlcjtcbiAgICAgICAgJG9wYWNpdHkuZmluZCgnc3BhbicpLmh0bWwoYE9wYWNpdHk6ICR7dmFsfSVgKTtcbiAgICAgICAgJCgnLmhpZGFibGUnKS5jc3MoJ29wYWNpdHknLCB2YWwgLyAxMDApO1xuICAgICAgICBvcHRpb25zLm9wYWNpdHkgPSB2YWw7XG4gICAgfSk7XG5cbiAgICAkaG92ZXJJbnB1dC5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBvcHRpb25zLnJldmVhbE9uSG92ZXIgPSAkKHRoaXMpLnByb3AoJ2NoZWNrZWQnKTtcbiAgICB9KTtcblxuICAgICQoJy5oaWRhYmxlJykuaG92ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJGhvdmVySW5wdXQuaXMoJzpjaGVja2VkJykpIHtcbiAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xuICAgIH0pO1xuXG4gICAgJG9wYWNpdHlJbnB1dC52YWwob3B0aW9ucy5vcGFjaXR5KS50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICAkaG92ZXJJbnB1dC5wcm9wKCdjaGVja2VkJywgb3B0aW9ucy5yZXZlYWxPbkhvdmVyKTtcbn1cbiIsImltcG9ydCB7RW5naW5lLCBTZWFyY2h9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcIi4vdXRpbHNcIjtcblxuXG5jb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCdzZWFyY2gnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldFVwU2VhcmNoKHNlYXJjaE9wdGlvbnM6IFNlYXJjaCkge1xuICAgIGxvZ2dlci5sb2coJ3NldHRpbmcgc2VhcmNoIGFuZCBzZWFyY2ggZW5naW5lcy4uLicpO1xuICAgIGNvbnN0ICRzZWFyY2hJbnB1dCA9ICQoJyNzZWFyY2gnKTtcbiAgICBjb25zdCAkc2VhcmNoQnV0dG9uID0gJCgnI3NlYXJjaC1idG4nKTtcbiAgICBzZXRVcEVuZ2luZXMoc2VhcmNoT3B0aW9ucyk7XG5cbiAgICAkc2VhcmNoSW5wdXQub24oJ2tleXByZXNzJywgZSA9PiB7XG4gICAgICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBkb1NlYXJjaCgpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHNlYXJjaEJ1dHRvbi5jbGljaygoKSA9PiB7XG4gICAgICAgIGRvU2VhcmNoKCk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRVcEVuZ2luZXMob3B0aW9uczogU2VhcmNoKTogdm9pZCB7XG4gICAgY29uc3QgJGVuZ2luZXNGb3JtID0gJCgnI2VuZ2luZXMnKTtcbiAgICBjb25zdCAkc291cmNlID0gJChcIiNlbmdpbmUtdGVtcGxhdGVcIikuaHRtbCgpO1xuICAgIGNvbnN0IGVuZ2luZVRlbXBsYXRlID0gSGFuZGxlYmFycy5jb21waWxlKCRzb3VyY2UpO1xuXG4gICAgJGVuZ2luZXNGb3JtLmh0bWwoJycpOyAgLy8gY2xlYXJcblxuICAgIG9wdGlvbnMuZW5naW5lcy5mb3JFYWNoKGZ1bmN0aW9uIChlbmdpbmUpIHtcbiAgICAgICAgY29uc3QgJGVuZ2luZSA9ICQoZW5naW5lVGVtcGxhdGUoe1xuICAgICAgICAgICAgbmFtZTogZW5naW5lLm5hbWUsXG4gICAgICAgICAgICB1cmw6IGVuZ2luZS51cmwsXG4gICAgICAgICAgICBjaGVja2VkOiBlbmdpbmUubmFtZSA9PT0gb3B0aW9ucy5kZWYsXG4gICAgICAgIH0pKTtcbiAgICAgICAgJGVuZ2luZS5maW5kKCdpbnB1dCcpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQoJyNzZWFyY2gnKS5mb2N1cygpO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMubGFiZWxJc1VybClcbiAgICAgICAgICAgICAgICBkb1NlYXJjaCgkKHRoaXMpLmF0dHIoJ2RhdGEtdXJsJykpO1xuICAgICAgICB9KTtcbiAgICAgICAgJGVuZ2luZXNGb3JtLmFwcGVuZCgkZW5naW5lKVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBkb1NlYXJjaCh1cmwgPSAnaHR0cDovL2dvb2dsZS5jb20vc2VhcmNoP3E9Jykge1xuICAgIGxldCBxdWVyeSA9ICQoJyNzZWFyY2gnKS52YWwoKTtcbiAgICB1cmwgPSAkKCcjZW5naW5lcycpLmZpbmQoJ2lucHV0W25hbWU9ZW5naW5lXTpjaGVja2VkJykuYXR0cignZGF0YS11cmwnKSB8fCB1cmw7XG4gICAgaWYgKHF1ZXJ5KSB7XG4gICAgICAgIGNvbnN0IGRlc3RVcmwgPSB1cmwgKyBlbmNvZGVVUklDb21wb25lbnQocXVlcnkgYXMgc3RyaW5nKTtcbiAgICAgICAgY2hyb21lLnRhYnMuZ2V0Q3VycmVudChmdW5jdGlvbiAodGFiKSB7XG4gICAgICAgICAgICBjaHJvbWUudGFicy51cGRhdGUodGFiLmlkLCB7XG4gICAgICAgICAgICAgICAgdXJsOiBkZXN0VXJsLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7VGFiLCBUYWJzfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHtvcGVuTGlua0Z1bmMsIExvZ2dlcn0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCBCb29rbWFya1RyZWVOb2RlID0gY2hyb21lLmJvb2ttYXJrcy5Cb29rbWFya1RyZWVOb2RlO1xuXG5cbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ3RhYnMnKTtcblxuaW50ZXJmYWNlIFRpdGxlVXJsIHtcbiAgICB0aXRsZTogc3RyaW5nLFxuICAgIHVybDogc3RyaW5nXG59XG5cbmNvbnN0IHRpbGVUZW1wbGF0ZSA9IEhhbmRsZWJhcnMuY29tcGlsZSgkKFwiI3RpbGUtdGVtcGxhdGVcIikuaHRtbCgpKTtcbmNvbnN0IGhlYWRlclRlbXBsYXRlID0gSGFuZGxlYmFycy5jb21waWxlKCQoXCIjdGFiLXRpdGxlLXRlbXBsYXRlXCIpLmh0bWwoKSk7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFVwVGFicyh0YWJzOiBUYWJzKSB7XG4gICAgbG9nZ2VyLmxvZygnc2V0dGluZyB0YWJzLi4uJyk7XG4gICAgY29uc3QgJHRhYnMgPSAkKCcjdGFicycpO1xuICAgIGNvbnN0ICRoZWFkZXJzID0gJHRhYnMuZmluZCgndWwnKS5lcSgwKTtcbiAgICBjb25zdCAkY29udGVudHMgPSAkdGFicy5maW5kKCd1bCcpLmVxKDEpO1xuXG4gICAgJGhlYWRlcnMuaHRtbCgnJyk7XG4gICAgJGNvbnRlbnRzLmh0bWwoJycpO1xuXG4gICAgZm9yIChsZXQgdGFiIG9mIHRhYnMuZW50aXRpZXMpIHtcbiAgICAgICAgY29uc3QgaGVhZGVyID0gaGVhZGVyVGVtcGxhdGUoe1xuICAgICAgICAgICAgbmFtZTogdGFiLm5hbWUsXG4gICAgICAgICAgICBhY3RpdmU6IHRhYi5uYW1lID09PSB0YWJzLmRlZixcbiAgICAgICAgfSk7XG4gICAgICAgICRoZWFkZXJzLmFwcGVuZChoZWFkZXIpO1xuICAgICAgICBjb25zdCAkY29udGVudCA9ICQoJzxsaT4nKTtcbiAgICAgICAgJGNvbnRlbnRzLmFwcGVuZCgkY29udGVudCk7XG5cbiAgICAgICAgaWYgKHRhYi5zcmMgPT09ICd0b3AnKSB7XG4gICAgICAgICAgICBzZXRVcFRvcCgkY29udGVudCwgdGFicy5ncmlkKVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRhYi5zcmMgPT09ICdyZWNlbnQnKSB7XG4gICAgICAgICAgICBzZXRVcFJlY2VudCgkY29udGVudCwgdGFicy5ncmlkKVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2V0VXBCb29rbWFya3ModGFiLCAkY29udGVudCwgdGFicy5ncmlkKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gYWRkVGlsZSgkY29udGVudDogSlF1ZXJ5LCBkYXRhOiBUaXRsZVVybCwgY29sczogbnVtYmVyKSB7XG4gICAgY29uc3QgJHRpbGUgPSAkKHRpbGVUZW1wbGF0ZSh7XG4gICAgICAgIGZhdmljb246IGBjaHJvbWU6Ly9mYXZpY29uL3NpemUvMTZAMngvJHtkYXRhLnVybH1gLFxuICAgICAgICB0aXRsZTogZGF0YS50aXRsZSxcbiAgICAgICAgdXJsOiBkZWNvZGVVUklDb21wb25lbnQoZGF0YS51cmwpXG4gICAgfSkpO1xuXG4gICAgJHRpbGUuY3NzKCd3aWR0aCcsIGBjYWxjKDEwMCUvJHtjb2xzfSAtIDIzcHgpYCk7XG5cbiAgICBpZiAoZGF0YS51cmwuc3RhcnRzV2l0aCgnY2hyb21lJykpIHtcbiAgICAgICAgJHRpbGUuY2xpY2sob3BlbkxpbmtGdW5jKGRhdGEudXJsKSk7XG4gICAgfVxuXG4gICAgJGNvbnRlbnQuYXBwZW5kKCR0aWxlKTtcbn1cblxuZnVuY3Rpb24gdHJhdmVyc2UodHJlZTogQm9va21hcmtUcmVlTm9kZSwgcGF0aDogc3RyaW5nW10pOiBCb29rbWFya1RyZWVOb2RlIHtcbiAgICBpZiAocGF0aC5sZW5ndGggPT09IDApXG4gICAgICAgIHJldHVybiB0cmVlO1xuICAgIGZvciAobGV0IGNoaWxkIG9mIHRyZWUuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGNoaWxkLnRpdGxlID09PSBwYXRoWzBdKSB7XG4gICAgICAgICAgICBwYXRoID0gcGF0aC5zbGljZSgxKTtcbiAgICAgICAgICAgIHJldHVybiB0cmF2ZXJzZShjaGlsZCwgcGF0aCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHNldFVwVG9wKCRjb250ZW50OiBKUXVlcnksIHtyb3dzLCBjb2xzfSkge1xuICAgIGNocm9tZS50b3BTaXRlcy5nZXQoZnVuY3Rpb24gKHVybHMpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1cmxzLmxlbmd0aCAmJiBpIDwgcm93cyAqIGNvbHM7IGkrKykge1xuICAgICAgICAgICAgYWRkVGlsZSgkY29udGVudCwgdXJsc1tpXSwgY29scyk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2V0VXBSZWNlbnQoJGNvbnRlbnQ6IEpRdWVyeSwge3Jvd3MsIGNvbHN9KSB7XG4gICAgY2hyb21lLnNlc3Npb25zLmdldFJlY2VudGx5Q2xvc2VkKGZ1bmN0aW9uIChzZXNzaW9ucykge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlc3Npb25zLmxlbmd0aCAmJiBpIDwgcm93cyAqIGNvbHM7IGkrKykge1xuICAgICAgICAgICAgaWYgKHNlc3Npb25zW2ldLnRhYilcbiAgICAgICAgICAgICAgICBhZGRUaWxlKCRjb250ZW50LCBzZXNzaW9uc1tpXS50YWIgYXMgVGl0bGVVcmwsIGNvbHMpO1xuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gc2V0VXBCb29rbWFya3ModGFiOiBUYWIsICRjb250ZW50OiBKUXVlcnksIHtyb3dzLCBjb2xzfSkge1xuICAgIGlmICghdGFiLnNyYy5zdGFydHNXaXRoKCdib29rbWFyazonKSkgcmV0dXJuO1xuICAgIHRhYi5zcmMgPSB0YWIuc3JjLnJlcGxhY2UoL1xcLyQvLCAnJyk7ICAvLyBkZWxldGUgdHJhaWxpbmcgc2xhc2ggaWYgcHJlc2VudFxuICAgIGNvbnN0IHBhdGggPSB0YWIuc3JjLnJlcGxhY2UoL15ib29rbWFyazovLCAnJykuc3BsaXQoJy8nKTtcbiAgICBjaHJvbWUuYm9va21hcmtzLmdldFRyZWUoZnVuY3Rpb24gKHRyZWUpIHtcbiAgICAgICAgY29uc3QgYm9va21hcmtUcmVlID0gdHJlZVswXTtcbiAgICAgICAgY29uc3QgZm9sZGVyID0gdHJhdmVyc2UoYm9va21hcmtUcmVlLCBwYXRoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3BhdGgnLCBwYXRoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2ZvbGRlcicsIGZvbGRlcik7XG4gICAgICAgIGlmIChmb2xkZXIpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZm9sZGVyLmNoaWxkcmVuLmxlbmd0aCAmJiBpIDwgcm93cyAqIGNvbHM7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJvb2ttYXJrID0gZm9sZGVyLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGlmICghYm9va21hcmsuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkVGlsZSgkY29udGVudCwgYm9va21hcmsgYXMgVGl0bGVVcmwsIGNvbHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pXG59XG4iLCJleHBvcnQgY2xhc3MgTG9nZ2VyIHtcbiAgICBwcml2YXRlIG5hbWU6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgfVxuICAgIGxvZyguLi5tZXNzYWdlOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLm5hbWUgKyAnOicsIC4uLm1lc3NhZ2UpO1xuICAgIH1cbiAgICBlcnJvciguLi5tZXNzYWdlOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMubmFtZSArICc6JywgLi4ubWVzc2FnZSk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3BlbkxpbmtGdW5jKHVybDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuY3RybEtleSB8fFxuICAgICAgICAgICAgZXZlbnQuc2hpZnRLZXkgfHxcbiAgICAgICAgICAgIGV2ZW50Lm1ldGFLZXkgfHwgIC8vIGNtZFxuICAgICAgICAgICAgKGV2ZW50LmJ1dHRvbiAmJiBldmVudC5idXR0b24gPT09IDEpXG4gICAgICAgICkge1xuICAgICAgICAgICAgY2hyb21lLnRhYnMuY3JlYXRlKHt1cmw6IHVybCwgYWN0aXZlOiBmYWxzZX0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY2hyb21lLnRhYnMuZ2V0Q3VycmVudChmdW5jdGlvbiAodGFiKSB7XG4gICAgICAgICAgICAgICAgY2hyb21lLnRhYnMudXBkYXRlKHRhYi5pZCwge3VybDogdXJsfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgbGV0IGNodW5rZWRTdG9yYWdlID0ge1xuICAgIHNldChpdGVtczogT2JqZWN0LCBjYWxsYmFjaz8pIHtcbiAgICAgICAgY29uc3Qgc3RvcmFnZU9iaiA9IHt9O1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gaXRlbXMpIHtcbiAgICAgICAgICAgIGlmICghaXRlbXMuaGFzT3duUHJvcGVydHkoa2V5KSkgY29udGludWU7XG4gICAgICAgICAgICBjb25zdCBvYmplY3RUb1N0b3JlID0gaXRlbXNba2V5XTtcbiAgICAgICAgICAgIGxldCBqc29uc3RyID0gSlNPTi5zdHJpbmdpZnkob2JqZWN0VG9TdG9yZSk7XG4gICAgICAgICAgICBsZXQgaSA9IDA7XG5cbiAgICAgICAgICAgIC8vIHNwbGl0IGpzb25zdHIgaW50byBjaHVua3MgYW5kIHN0b3JlIHRoZW0gaW4gYW4gb2JqZWN0IGluZGV4ZWQgYnkgYGtleV9pYFxuICAgICAgICAgICAgd2hpbGUgKGpzb25zdHIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0ga2V5ICsgXCJfXCIgKyBpKys7XG5cbiAgICAgICAgICAgICAgICAvLyBzaW5jZSB0aGUga2V5IHVzZXMgdXAgc29tZSBwZXItaXRlbSBxdW90YSwgc2VlIGhvdyBtdWNoIGlzIGxlZnQgZm9yIHRoZSB2YWx1ZVxuICAgICAgICAgICAgICAgIC8vIGFsc28gdHJpbSBvZmYgMiBmb3IgcXVvdGVzIGFkZGVkIGJ5IHN0b3JhZ2UtdGltZSBgc3RyaW5naWZ5YFxuICAgICAgICAgICAgICAgIC8vIGxldCB2YWx1ZUxlbmd0aCA9IGNocm9tZS5zdG9yYWdlLnN5bmMuUVVPVEFfQllURVNfUEVSX0lURU0gLSBpbmRleC5sZW5ndGggLSAyO1xuICAgICAgICAgICAgICAgIGxldCB2YWx1ZUxlbmd0aCA9IGNocm9tZS5zdG9yYWdlLnN5bmMuUVVPVEFfQllURVNfUEVSX0lURU0gLyAyO1xuICAgICAgICAgICAgICAgIC8vIGxldCB2YWx1ZUxlbmd0aCA9IDEwMDtcblxuICAgICAgICAgICAgICAgIC8vIHRyaW0gZG93biBzZWdtZW50IHNvIGl0IHdpbGwgYmUgc21hbGwgZW5vdWdoIGV2ZW4gd2hlbiBydW4gdGhyb3VnaCBgSlNPTi5zdHJpbmdpZnlgIGFnYWluIGF0IHN0b3JhZ2UgdGltZVxuICAgICAgICAgICAgICAgIGxldCBzZWdtZW50ID0ganNvbnN0ci5zdWJzdHIoMCwgdmFsdWVMZW5ndGgpO1xuICAgICAgICAgICAgICAgIC8vIHdoaWxlIChKU09OLnN0cmluZ2lmeShzZWdtZW50KS5sZW5ndGggPiB2YWx1ZUxlbmd0aClcbiAgICAgICAgICAgICAgICAvLyAgICAgc2VnbWVudCA9IGpzb25zdHIuc3Vic3RyKDAsIC0tdmFsdWVMZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgc3RvcmFnZU9ialtpbmRleF0gPSBzZWdtZW50O1xuICAgICAgICAgICAgICAgIGpzb25zdHIgPSBqc29uc3RyLnN1YnN0cih2YWx1ZUxlbmd0aCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0b3JhZ2VPYmpba2V5ICsgJ18gc2l6ZSddID0gaTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzdG9yZSBhbGwgdGhlIGNodW5rc1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldChzdG9yYWdlT2JqLCBjYWxsYmFjayk7XG4gICAgfSxcblxuICAgIGdldChrZXk6IHN0cmluZywgY2FsbGJhY2s6IChyZXN1bHQ6IGFueSkgPT4gYW55KSB7XG4gICAgICAgIGNvbnN0IHNpemVLZXkgPSBrZXkgKyAnXyBzaXplJztcblxuICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLmdldChzaXplS2V5LCBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0W3NpemVLZXldKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2NodW5rczonLCByZXN1bHRbc2l6ZUtleV0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlc3VsdFtzaXplS2V5XTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGtleXMucHVzaChrZXkgKyAnXycgKyBpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQoa2V5cywgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBhc3N1bWUgdGhhdCBrZXlzIGFyZSBwcmVzZW50XG4gICAgICAgICAgICAgICAgICAgIGxldCBqc29uU3RyID0ga2V5cy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcmV2ICsgcmVzdWx0W2N1cnJdO1xuICAgICAgICAgICAgICAgICAgICB9LCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHtba2V5XTogSlNPTi5wYXJzZShqc29uU3RyKX0pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh7fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVtb3ZlKGtleSwgY2FsbGJhY2spIHtcbiAgICAgICAgLy8gdG9kb1xuICAgIH1cbn07XG5cbiJdfQ==
