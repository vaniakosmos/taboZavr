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
        def: 'recent',
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
const logger = new utils_1.Logger('options');
const fieldTemplate = Handlebars.compile($("#field-template").html());
function setUpOptions(options) {
    setActions(options);
    setUpTheme(options.theme);
    setUpSearch(options.search);
}
exports.setUpOptions = setUpOptions;
function fadeInOut($target, html, duration = 1000) {
    $target.html(html).addClass('uk-animation-slide-top-small').removeClass('uk-animation-slide-bottom-small uk-animation-reverse');
    setTimeout(function () {
        $target.remove('uk-animation-slide-top-small').addClass('uk-animation-slide-bottom-small uk-animation-reverse');
    }, duration);
}
function setActions(options) {
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
function setUpSearch(options) {
    const $fieldsContainer = $('#opt-search-fields');
    const $searchOnLabel = $('#opt-search-labelclick');
    $searchOnLabel.prop('checked', options.labelIsUrl);
    $searchOnLabel.change(function () {
        console.log('click');
        options.labelIsUrl = $(this).prop('checked');
    });
    function addField({ name, url }) {
        let $html = $(fieldTemplate({ name: name, second: url, placeholder: 'url...' }));
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
    $fieldsContainer.find(`input[name="engines"][value="${options.def}"]`).prop('checked', true);
    $('#opt-search-ok').click(function () {
        const names = new Set();
        const engines = [];
        let ok = true;
        let newDefault = '';
        $fieldsContainer.find('div').each(function () {
            const $nameInput = $(this).find('input[name=first]');
            const $urlInput = $(this).find('input[name=second]');
            const $radio = $(this).find('input[type=radio]');
            const name = $nameInput.val();
            const url = $urlInput.val();
            if (name == '' || names.has(name)) {
                $nameInput.addClass('uk-form-danger');
                ok = false;
            } else if (!url.match(/^https?:\/\/.+\..+\?.+=$/i)) {
                $urlInput.addClass('uk-form-danger');
                ok = false;
            } else {
                names.add(name);
                engines.push({ name: name, url: url });
                if ($radio.prop('checked')) newDefault = name;
            }
        });
        if (ok) {
            console.log('save');
            options.def = newDefault;
            options.engines = engines;
            search_1.setUpEngines(options);
            UIkit.modal($('#opt-search-modal')).hide();
        } else {
            console.log('reject');
        }
        console.log(options);
    });
}
function setUpTheme(theme) {
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

},{"./search":5,"./utils":7}],5:[function(require,module,exports){
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
    for (let tab of tabs.entities) {
        const header = headerTemplate({
            name: tab.name,
            active: tab.name.toLowerCase() === tabs.def.toLowerCase()
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
function addTile($content, data) {
    const $tile = $(tileTemplate({
        favicon: `chrome://favicon/size/16@2x/${data.url}`,
        title: data.title,
        url: decodeURIComponent(data.url)
    }));
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
            addTile($content, urls[i]);
        }
    });
}
function setUpRecent($content, { rows, cols }) {
    chrome.sessions.getRecentlyClosed(function (sessions) {
        for (let i = 0; i < sessions.length && i < rows * cols; i++) {
            if (sessions[i].tab) addTile($content, sessions[i].tab);
        }
    });
}
function setUpBookmarks(tab, $content, { rows, cols }) {
    if (!tab.src.startsWith('bookmark:')) return;
    const path = tab.src.replace(/^bookmark:/, '').split('/');
    chrome.bookmarks.getTree(function (tree) {
        const bookmarkTree = tree[0];
        const folder = traverse(bookmarkTree, path);
        if (folder) {
            for (let i = 0; i < folder.children.length && i < rows * cols; i++) {
                const bookmark = folder.children[i];
                if (!bookmark.children) {
                    addTile($content, bookmark);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvYXBwLnRzIiwic3JjL3RzL2RlZmF1bHRPcHRpb25zLnRzIiwic3JjL3RzL25hdmJhci50cyIsInNyYy90cy9vcHRpb25zLnRzIiwic3JjL3RzL3NlYXJjaC50cyIsInNyYy90cy90YWJzLnRzIiwic3JjL3RzL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FDQ0EseUJBQW9DO0FBQ3BDLDBCQUF1QztBQUN2Qyx5QkFBb0M7QUFDcEMsdUJBQWdDO0FBRWhDLGlDQUE2QztBQUM3Qyx3QkFBOEI7QUFHOUIsTUFBTSxBQUFNLFNBQUcsSUFBSSxRQUFNLE9BQUMsQUFBSyxBQUFDLEFBQUM7QUFDakMsQUFBTSxPQUFDLEFBQUcsSUFBQyxBQUFRLEFBQUMsQUFBQztBQUVyQjtBQUNJLEFBQU0sZUFBSyxBQUFPLFFBQUMsVUFBVSxBQUFPO0FBQ2hDLEFBQU0sZUFBQyxBQUFPLFFBQUMsQUFBSyxNQUFDLEFBQUcsSUFBQyxBQUFTLFdBQUUsVUFBVSxBQUFNO0FBQ2hELGdCQUFJLEFBQWdCLEFBQUM7QUFDckIsQUFBRSxBQUFDLGdCQUFDLEFBQU0sT0FBQyxBQUFTLEFBQUMsQUFBQyxZQUFDLEFBQUM7QUFDcEIsQUFBTywwQkFBRyxBQUFNLE9BQUMsQUFBUyxBQUFZLEFBQUM7QUFDdkMsQUFBTSx1QkFBQyxBQUFHLElBQUMsQUFBbUMsQUFBQyxBQUFDO0FBQ2hELEFBQU0sdUJBQUMsQUFBRyxJQUFDLEFBQVUsWUFBRSxBQUFPLEFBQUMsQUFBQztBQUNoQyxBQUFPLHdCQUFDLEFBQU8sQUFBQyxBQUNwQjtBQUFDLEFBQ0QsQUFBSSxtQkFBQyxBQUFDO0FBQ0YsQUFBTywwQkFBRyxBQUFJLEtBQUMsQUFBSyxNQUFDLEFBQUksS0FBQyxBQUFTLFVBQUMsaUJBQWMsQUFBQyxBQUFDLEFBQUM7QUFDckQsQUFBTSx1QkFBQyxBQUFHLElBQUMsQUFBa0QsQUFBQyxB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IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQge09wdGlvbnN9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQge3NldFVwTmF2YmFyfSBmcm9tICcuL25hdmJhcidcbmltcG9ydCB7c2V0VXBPcHRpb25zfSBmcm9tIFwiLi9vcHRpb25zXCI7XG5pbXBvcnQge3NldFVwU2VhcmNofSBmcm9tICcuL3NlYXJjaCdcbmltcG9ydCB7c2V0VXBUYWJzfSBmcm9tICcuL3RhYnMnXG5cbmltcG9ydCBkZWZhdWx0T3B0aW9ucyBmcm9tICcuL2RlZmF1bHRPcHRpb25zJ1xuaW1wb3J0IHtMb2dnZXJ9IGZyb20gJy4vdXRpbHMnXG5cblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignYXBwJyk7XG5sb2dnZXIubG9nKCdpbnNpZGUnKTtcblxuZnVuY3Rpb24gcHJvbWlzZU9wdGlvbnMoKTogUHJvbWlzZTxPcHRpb25zPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgnb3B0aW9ucycsIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGxldCBvcHRpb25zOiBPcHRpb25zO1xuICAgICAgICAgICAgaWYgKHJlc3VsdFsnb3B0aW9ucyddKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHJlc3VsdFsnb3B0aW9ucyddIGFzIE9wdGlvbnM7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZygndXNpbmcgb3B0aW9ucyBsb2FkZWQgZnJvbSBzdG9yYWdlJyk7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZygnb3B0aW9uczonLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKG9wdGlvbnMpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkZWZhdWx0T3B0aW9ucykpOyAgLy8gZGVlcCBjb3B5XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZygndXNpbmcgZGVmYXVsdCBvcHRpb25zIGFuZCBzYXZlIHRoZW0gaW50byBzdG9yYWdlJyk7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZygnb3B0aW9uczonLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeydvcHRpb25zJzogb3B0aW9uc30sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShvcHRpb25zKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pO1xufVxuXG5wcm9taXNlT3B0aW9ucygpLnRoZW4oZnVuY3Rpb24gKG9wdGlvbnM6IE9wdGlvbnMpIHtcbiAgICBzZXRUaW1lb3V0KHNldFVwTmF2YmFyLCAwKTtcbiAgICBzZXRUaW1lb3V0KHNldFVwT3B0aW9ucywgMCwgb3B0aW9ucyk7XG4gICAgc2V0VGltZW91dChzZXRVcFNlYXJjaCwgMCwgb3B0aW9ucy5zZWFyY2gpO1xuICAgIHNldFRpbWVvdXQoc2V0VXBUYWJzLCAwLCBvcHRpb25zLnRhYnMpO1xufSk7XG4iLCJpbXBvcnQge09wdGlvbnN9IGZyb20gXCIuL3R5cGVzXCI7XG5cblxubGV0IG9wdGlvbnM6IE9wdGlvbnMgPSB7XG4gICAgdGhlbWU6IHtcbiAgICAgICAgdGl0bGU6ICdOZXcgdGFiJyxcbiAgICAgICAgaGVhZGVyOiAnaGVsbG8gbWEgZHVkZScsXG4gICAgICAgIGJhY2tncm91bmQ6IHtcbiAgICAgICAgICAgIGRlZjogJ2NvbG9yJyxcbiAgICAgICAgICAgIGNvbG9yOiAnI2E4YThhOCcsXG4gICAgICAgICAgICBpbWFnZTogJycsXG4gICAgICAgICAgICB1cmw6ICdodHRwOi8vaS5pbWd1ci5jb20vdjU1OEg2OC5wbmcnLFxuICAgICAgICB9LFxuICAgICAgICB2aXNpYmlsaXR5OiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxMDAsXG4gICAgICAgICAgICByZXZlYWxPbkhvdmVyOiB0cnVlLFxuICAgICAgICB9XG4gICAgfSxcbiAgICBzZWFyY2g6IHtcbiAgICAgICAgZGVmOiAnZ29vZ2xlJyxcbiAgICAgICAgZW5naW5lczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdnb29nbGUnLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHA6Ly9nb29nbGUuY29tL3NlYXJjaD9xPScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpbWFnZXMnLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vd3d3Lmdvb2dsZS5jb20vaW1hZ2VzP3E9JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3RyYWt0JyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwOi8vdHJha3QudHYvc2VhcmNoP3E9JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3dpa2knLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93L2luZGV4LnBocD9zZWFyY2g9JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGxhYmVsSXNVcmw6IGZhbHNlLFxuICAgIH0sXG4gICAgdGFiczoge1xuICAgICAgICBkZWY6ICdyZWNlbnQnLFxuICAgICAgICBncmlkOiB7XG4gICAgICAgICAgICBjb2xzOiA1LFxuICAgICAgICAgICAgcm93czogNSxcbiAgICAgICAgfSxcbiAgICAgICAgZW50aXRpZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnRmF2JyxcbiAgICAgICAgICAgICAgICBzcmM6ICdib29rbWFyazpCb29rbWFya3MgQmFyJyxcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnVG9wJyxcbiAgICAgICAgICAgICAgICBzcmM6ICd0b3AnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnUmVjZW50JyxcbiAgICAgICAgICAgICAgICBzcmM6ICdyZWNlbnQnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBvcHRpb25zO1xuIiwiaW1wb3J0IHtvcGVuTGlua0Z1bmMsIExvZ2dlcn0gZnJvbSBcIi4vdXRpbHNcIjtcblxuXG5jb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCduYXZiYXInKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldFVwTmF2YmFyKCkge1xuICAgIHNldFRpbWVvdXQoc2V0VXBOYXZVcmxzLCAwKTtcbiAgICBzZXRUaW1lb3V0KHNldFVwQWRkb25zLCAwKTtcbn1cblxuZnVuY3Rpb24gc2V0VXBOYXZVcmxzKCkge1xuICAgIGxvZ2dlci5sb2coJ3NldHRpbmcgdXJscy4uLicpO1xuICAgICQoJyNoaXN0b3J5JykuY2xpY2sob3BlbkxpbmtGdW5jKCdjaHJvbWU6Ly9oaXN0b3J5LycpKTtcbiAgICAkKCcjYm9va21hcmtzJykuY2xpY2sob3BlbkxpbmtGdW5jKCdjaHJvbWU6Ly9ib29rbWFya3MvJykpO1xuICAgICQoJyNleHRlbnNpb25zJykuY2xpY2sob3BlbkxpbmtGdW5jKCdjaHJvbWU6Ly9leHRlbnNpb25zLycpKTtcbiAgICAkKCcjYWxsLWFwcHMnKS5jbGljayhvcGVuTGlua0Z1bmMoJ2Nocm9tZTovL2FwcHMvJykpO1xufVxuXG5cbmZ1bmN0aW9uIHNldFVwQWRkb25zKCkge1xuICAgIGxvZ2dlci5sb2coJ3NldHRpbmcgYWRkLW9ucy4uLicpO1xuICAgIGNvbnN0ICRzb3VyY2UgPSAkKFwiI2FwcC10ZW1wbGF0ZVwiKS5odG1sKCk7XG4gICAgY29uc3QgYXBwVGVtcGxhdGUgPSBIYW5kbGViYXJzLmNvbXBpbGUoJHNvdXJjZSk7XG5cbiAgICBjaHJvbWUubWFuYWdlbWVudC5nZXRBbGwoZnVuY3Rpb24gKGFkZG9ucykge1xuICAgICAgICBjb25zdCAkYXBwc19saXN0ID0gJCgnI2FwcHMnKTtcbiAgICAgICAgZm9yIChsZXQgYWRkb24gb2YgYWRkb25zKSB7XG4gICAgICAgICAgICBpZiAoYWRkb24udHlwZS5lbmRzV2l0aCgnX2FwcCcpKSB7XG4gICAgICAgICAgICAgICAgbGV0IGljb24gPSAnJztcbiAgICAgICAgICAgICAgICBpZiAoYWRkb24uaWNvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWNvbiA9IGFkZG9uLmljb25zW2FkZG9uLmljb25zLmxlbmd0aC0xXS51cmw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGFwcEh0bWwgPSBhcHBUZW1wbGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGFkZG9uLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGljb246IGljb24sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgJGNsaWNrYWJsZUFwcCA9ICQoYXBwSHRtbCkuY2xpY2soKCkgPT4gY2hyb21lLm1hbmFnZW1lbnQubGF1bmNoQXBwKGFkZG9uLmlkKSk7XG4gICAgICAgICAgICAgICAgJGFwcHNfbGlzdC5hcHBlbmQoJGNsaWNrYWJsZUFwcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbiIsImltcG9ydCB7QmFja2dyb3VuZCwgRW5naW5lLCBPcHRpb25zLCBTZWFyY2gsIFRoZW1lLCBWaXNpYmlsaXR5fSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQge3NldFVwRW5naW5lc30gZnJvbSBcIi4vc2VhcmNoXCI7XG5cblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignb3B0aW9ucycpO1xuXG5jb25zdCBmaWVsZFRlbXBsYXRlID0gSGFuZGxlYmFycy5jb21waWxlKCQoXCIjZmllbGQtdGVtcGxhdGVcIikuaHRtbCgpKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldFVwT3B0aW9ucyhvcHRpb25zOiBPcHRpb25zKSB7XG4gICAgc2V0QWN0aW9ucyhvcHRpb25zKTtcbiAgICBzZXRVcFRoZW1lKG9wdGlvbnMudGhlbWUpO1xuICAgIHNldFVwU2VhcmNoKG9wdGlvbnMuc2VhcmNoKTtcbn1cblxuZnVuY3Rpb24gZmFkZUluT3V0KCR0YXJnZXQ6IEpRdWVyeSwgaHRtbCwgZHVyYXRpb24gPSAxMDAwKSB7XG4gICAgJHRhcmdldFxuICAgICAgICAuaHRtbChodG1sKVxuICAgICAgICAuYWRkQ2xhc3MoJ3VrLWFuaW1hdGlvbi1zbGlkZS10b3Atc21hbGwnKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ3VrLWFuaW1hdGlvbi1zbGlkZS1ib3R0b20tc21hbGwgdWstYW5pbWF0aW9uLXJldmVyc2UnKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHRhcmdldFxuICAgICAgICAgICAgLnJlbW92ZSgndWstYW5pbWF0aW9uLXNsaWRlLXRvcC1zbWFsbCcpXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ3VrLWFuaW1hdGlvbi1zbGlkZS1ib3R0b20tc21hbGwgdWstYW5pbWF0aW9uLXJldmVyc2UnKTtcblxuICAgIH0sIGR1cmF0aW9uKVxufVxuXG5mdW5jdGlvbiBzZXRBY3Rpb25zKG9wdGlvbnMpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIHNhdmUgYW5kIHNldCBkZWZhdWx0IGJ1dHRvbnMuLi4nKTtcbiAgICBjb25zdCAkYWN0aW9uc0luZm8gPSAkKCcjYWN0aW9ucy1pbmZvJyk7XG5cbiAgICAkKCcjc2F2ZS1zZXR0aW5ncycpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMudGhlbWUuYmFja2dyb3VuZC5kZWYgIT0gJ2ltYWdlJylcbiAgICAgICAgICAgIG9wdGlvbnMudGhlbWUuYmFja2dyb3VuZC5pbWFnZSA9ICcnO1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeydvcHRpb25zJzogb3B0aW9uc30sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvZ2dlci5sb2coJ3NhdmVkJyk7XG4gICAgICAgICAgICBmYWRlSW5PdXQoJGFjdGlvbnNJbmZvLCAnc2F2ZWQnLCAxNTAwKVxuICAgICAgICB9KVxuICAgIH0pO1xuXG4gICAgJCgnI3NldC1kZWZhdWx0LW1vZGFsJykuZmluZCgnYnV0dG9uW25hbWU9XCJva1wiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuY2xlYXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9nZ2VyLmxvZygnY2xlYXJlZCBzdG9yYWdlJyk7XG4gICAgICAgICAgICAvLyB0b2RvOiBhcHBseSBkZWZhdWx0IG9wdGlvbnMgdy9vIHJlbG9hZGluZyAoYnV0IG5lZWQgdG8gZXhjbHVkZSBmcm9tIHJlbG9hZGluZyBldmVudCBsaXN0ZW5lcnMgYXBwbGllcnMpXG4gICAgICAgICAgICBjaHJvbWUudGFicy5nZXRDdXJyZW50KGZ1bmN0aW9uICh0YWIpIHtcbiAgICAgICAgICAgICAgICBjaHJvbWUudGFicy5yZWxvYWQodGFiLmlkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2V0VXBTZWFyY2gob3B0aW9uczogU2VhcmNoKSB7XG4gICAgY29uc3QgJGZpZWxkc0NvbnRhaW5lciA9ICQoJyNvcHQtc2VhcmNoLWZpZWxkcycpO1xuICAgIGNvbnN0ICRzZWFyY2hPbkxhYmVsID0gJCgnI29wdC1zZWFyY2gtbGFiZWxjbGljaycpO1xuXG4gICAgJHNlYXJjaE9uTGFiZWwucHJvcCgnY2hlY2tlZCcsIG9wdGlvbnMubGFiZWxJc1VybCk7XG5cbiAgICAkc2VhcmNoT25MYWJlbC5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnY2xpY2snKTtcbiAgICAgICAgb3B0aW9ucy5sYWJlbElzVXJsID0gJCh0aGlzKS5wcm9wKCdjaGVja2VkJyk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBhZGRGaWVsZCh7bmFtZSwgdXJsfSkge1xuICAgICAgICBsZXQgJGh0bWwgPSAkKGZpZWxkVGVtcGxhdGUoe25hbWU6IG5hbWUsIHNlY29uZDogdXJsLCBwbGFjZWhvbGRlcjogJ3VybC4uLid9KSk7XG4gICAgICAgICRodG1sLmZpbmQoJ2J1dHRvblt1ay1jbG9zZV0nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLnJlbW92ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgJGh0bWwuZmluZCgnaW5wdXQnKS5vbignaW5wdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygndWstZm9ybS1kYW5nZXInKVxuICAgICAgICB9KTtcbiAgICAgICAgJGZpZWxkc0NvbnRhaW5lci5hcHBlbmQoJGh0bWwpO1xuICAgIH1cblxuICAgIG9wdGlvbnMuZW5naW5lcy5mb3JFYWNoKGZ1bmN0aW9uIChlbmdpbmUpIHtcbiAgICAgICAgYWRkRmllbGQoZW5naW5lKVxuICAgIH0pO1xuXG4gICAgJCgnI29wdC1zZWFyY2gtYWRkJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBhZGRGaWVsZCh7bmFtZTogJycsIHVybDogJyd9KVxuICAgIH0pO1xuXG4gICAgJGZpZWxkc0NvbnRhaW5lclxuICAgICAgICAuZmluZChgaW5wdXRbbmFtZT1cImVuZ2luZXNcIl1bdmFsdWU9XCIke29wdGlvbnMuZGVmfVwiXWApXG4gICAgICAgIC5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG5cbiAgICAkKCcjb3B0LXNlYXJjaC1vaycpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgbmFtZXMgPSBuZXcgU2V0KCk7XG4gICAgICAgIGNvbnN0IGVuZ2luZXM6IEVuZ2luZVtdID0gW107XG4gICAgICAgIGxldCBvayA9IHRydWU7XG4gICAgICAgIGxldCBuZXdEZWZhdWx0ID0gJyc7XG5cbiAgICAgICAgJGZpZWxkc0NvbnRhaW5lci5maW5kKCdkaXYnKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnN0ICRuYW1lSW5wdXQgPSAkKHRoaXMpLmZpbmQoJ2lucHV0W25hbWU9Zmlyc3RdJyk7XG4gICAgICAgICAgICBjb25zdCAkdXJsSW5wdXQgPSAkKHRoaXMpLmZpbmQoJ2lucHV0W25hbWU9c2Vjb25kXScpO1xuICAgICAgICAgICAgY29uc3QgJHJhZGlvID0gJCh0aGlzKS5maW5kKCdpbnB1dFt0eXBlPXJhZGlvXScpO1xuXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gJG5hbWVJbnB1dC52YWwoKSBhcyBzdHJpbmc7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSAkdXJsSW5wdXQudmFsKCkgYXMgc3RyaW5nO1xuXG4gICAgICAgICAgICBpZiAobmFtZSA9PSAnJyB8fCBuYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgICAgICAkbmFtZUlucHV0LmFkZENsYXNzKCd1ay1mb3JtLWRhbmdlcicpO1xuICAgICAgICAgICAgICAgIG9rID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICghdXJsLm1hdGNoKC9eaHR0cHM/OlxcL1xcLy4rXFwuLitcXD8uKz0kL2kpKSB7XG4gICAgICAgICAgICAgICAgJHVybElucHV0LmFkZENsYXNzKCd1ay1mb3JtLWRhbmdlcicpO1xuICAgICAgICAgICAgICAgIG9rID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBuYW1lcy5hZGQobmFtZSk7XG4gICAgICAgICAgICAgICAgZW5naW5lcy5wdXNoKHtuYW1lOiBuYW1lLCB1cmw6IHVybH0pO1xuICAgICAgICAgICAgICAgIGlmICgkcmFkaW8ucHJvcCgnY2hlY2tlZCcpKVxuICAgICAgICAgICAgICAgICAgICBuZXdEZWZhdWx0ID0gbmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG9rKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnc2F2ZScpO1xuICAgICAgICAgICAgb3B0aW9ucy5kZWYgPSBuZXdEZWZhdWx0O1xuICAgICAgICAgICAgb3B0aW9ucy5lbmdpbmVzID0gZW5naW5lcztcbiAgICAgICAgICAgIHNldFVwRW5naW5lcyhvcHRpb25zKTtcbiAgICAgICAgICAgIFVJa2l0Lm1vZGFsKCQoJyNvcHQtc2VhcmNoLW1vZGFsJykpLmhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdyZWplY3QnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKG9wdGlvbnMpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzZXRVcFRoZW1lKHRoZW1lOiBUaGVtZSkge1xuICAgIGxvZ2dlci5sb2coJ3NldHRpbmcgdmlzaWJpbGl0eSBhbmQgYmFja2dyb3VuZC4uJyk7XG4gICAgdmlzaWJpbGl0eSh0aGVtZS52aXNpYmlsaXR5KTtcbiAgICBiYWNrZ3JvdW5kKHRoZW1lLmJhY2tncm91bmQpO1xuICAgIHRpdGxlKHRoZW1lKTtcbn1cblxuZnVuY3Rpb24gdGl0bGUodGhlbWU6IFRoZW1lKSB7XG4gICAgY29uc3QgJHRpdGxlSW5wdXQgPSAkKCcjdGl0bGUtaW5wdXQnKTtcblxuICAgICQoJ3RpdGxlJykudGV4dCh0aGVtZS50aXRsZSk7XG4gICAgJHRpdGxlSW5wdXQudmFsKHRoZW1lLnRpdGxlKTtcblxuICAgICR0aXRsZUlucHV0Lm9uKCdpbnB1dCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IHRpdGxlID0gJCh0aGlzKS52YWwoKSBhcyBzdHJpbmc7XG4gICAgICAgIHRoZW1lLnRpdGxlID0gdGl0bGU7XG4gICAgICAgICQoJ3RpdGxlJykudGV4dCh0aXRsZSk7XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gYmFja2dyb3VuZChvcHRpb25zOiBCYWNrZ3JvdW5kKSB7XG4gICAgY29uc3QgJGJvZHkgPSAkKCdib2R5Jyk7XG4gICAgY29uc3QgJGlucHV0cyA9ICQoJ3NlbGVjdFtuYW1lPWJhY2tncm91bmRdJyk7XG5cbiAgICBjb25zdCAkY29sb3JJbnB1dCA9ICQoJyNiZy1jb2xvci1pbnB1dCcpO1xuICAgIGNvbnN0ICRpbWFnZUlucHV0ID0gJCgnI2JnLWltYWdlLWlucHV0Jyk7XG4gICAgY29uc3QgJHVybElucHV0ID0gJCgnI2JnLXVybC1pbnB1dCcpO1xuXG4gICAgZnVuY3Rpb24gc2V0Q29sb3IoY29sb3IpIHtcbiAgICAgICAgJGJvZHlcbiAgICAgICAgICAgIC5jc3MoJ2JhY2tncm91bmQtY29sb3InLCBjb2xvcilcbiAgICAgICAgICAgIC5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCAnbm9uZScpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldEltYWdlKGltYWdlKSB7XG4gICAgICAgICRib2R5XG4gICAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgJycpXG4gICAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgYHVybChcIiR7aW1hZ2V9XCIpYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0QkcoKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmRlZiA9PSAnaW1hZ2UnICYmIG9wdGlvbnMuaW1hZ2UgIT0gJycpIHtcbiAgICAgICAgICAgIHNldEltYWdlKG9wdGlvbnMuaW1hZ2UpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5kZWYgPT0gJ3VybCcgJiYgb3B0aW9ucy51cmwgIT0gJycpIHtcbiAgICAgICAgICAgIHNldEltYWdlKG9wdGlvbnMudXJsKVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2V0Q29sb3Iob3B0aW9ucy5jb2xvcilcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNldCB1cCBvcHRpb25zIGN1cnJlbnQgdmFsdWVzXG4gICAgJGlucHV0cy52YWwob3B0aW9ucy5kZWYpLmNoYW5nZSgpO1xuICAgICRjb2xvcklucHV0LnZhbChvcHRpb25zLmNvbG9yKTtcbiAgICAkdXJsSW5wdXQudmFsKG9wdGlvbnMudXJsKTtcblxuICAgIC8vIHNldCB1cCBiZ1xuICAgIHNldEJHKCk7XG5cbiAgICAvLyBzZXQgdXAgbGlzdGVuZXJzXG4gICAgJGlucHV0cy5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICBvcHRpb25zLmRlZiA9ICQodGhpcykudmFsKCkgYXMgc3RyaW5nO1xuICAgICAgICBzZXRCRygpO1xuICAgIH0pO1xuXG4gICAgJGNvbG9ySW5wdXQuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IGNvbG9yID0gJCh0aGlzKS52YWwoKSBhcyBzdHJpbmc7XG4gICAgICAgIHNldENvbG9yKGNvbG9yKTtcbiAgICAgICAgb3B0aW9ucy5jb2xvciA9IGNvbG9yO1xuICAgIH0pO1xuXG4gICAgJGNvbG9ySW5wdXQuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAkaW5wdXRzLnZhbCgnY29sb3InKS5jaGFuZ2UoKTtcbiAgICB9KTtcblxuICAgICRpbWFnZUlucHV0LmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSAkKHRoaXMpLnByb3AoXCJmaWxlc1wiKVswXTtcbiAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZGVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxldCBpbWFnZVVybCA9IHJlYWRlci5yZXN1bHQ7XG4gICAgICAgICAgICBzZXRJbWFnZShpbWFnZVVybCk7XG4gICAgICAgICAgICBvcHRpb25zLmltYWdlID0gaW1hZ2VVcmw7XG4gICAgICAgICAgICAkaW5wdXRzLnZhbCgnaW1hZ2UnKS5jaGFuZ2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGZpbGUpXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICB9KTtcblxuICAgICR1cmxJbnB1dC5vbignaW5wdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IHVybCA9ICQodGhpcykudmFsKCkgYXMgc3RyaW5nO1xuICAgICAgICBpZiAodXJsLm1hdGNoKC9eaHR0cHM/Oi4qXFwuKHBuZ3xqcGd8anBlZykkLykpIHtcbiAgICAgICAgICAgIHNldEltYWdlKHVybCk7XG4gICAgICAgICAgICBvcHRpb25zLnVybCA9IHVybDtcbiAgICAgICAgICAgICRpbnB1dHMudmFsKCd1cmwnKS5jaGFuZ2UoKTtcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHZpc2liaWxpdHkob3B0aW9uczogVmlzaWJpbGl0eSkge1xuICAgIGNvbnN0ICRibG9jayA9ICQoJyNvcHQtdmlzaWJpbGl0eScpO1xuICAgIGNvbnN0ICRvcGFjaXR5ID0gJGJsb2NrLmZpbmQoJ2RpdicpLmVxKDApO1xuICAgIGNvbnN0ICRob3ZlciA9ICRibG9jay5maW5kKCdkaXYnKS5lcSgxKTtcbiAgICBjb25zdCAkb3BhY2l0eUlucHV0ID0gJG9wYWNpdHkuZmluZCgnaW5wdXQnKTtcbiAgICBjb25zdCAkaG92ZXJJbnB1dCA9ICRob3Zlci5maW5kKCdpbnB1dCcpO1xuXG4gICAgJG9wYWNpdHlJbnB1dC5vbignY2hhbmdlIG1vdXNlbW92ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgdmFsID0gJCh0aGlzKS52YWwoKSBhcyBudW1iZXI7XG4gICAgICAgICRvcGFjaXR5LmZpbmQoJ3NwYW4nKS5odG1sKGBPcGFjaXR5OiAke3ZhbH0lYCk7XG4gICAgICAgICQoJy5oaWRhYmxlJykuY3NzKCdvcGFjaXR5JywgdmFsIC8gMTAwKTtcbiAgICAgICAgb3B0aW9ucy5vcGFjaXR5ID0gdmFsO1xuICAgIH0pO1xuXG4gICAgJGhvdmVySW5wdXQub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgb3B0aW9ucy5yZXZlYWxPbkhvdmVyID0gJCh0aGlzKS5wcm9wKCdjaGVja2VkJyk7XG4gICAgfSk7XG5cbiAgICAkKCcuaGlkYWJsZScpLmhvdmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCRob3ZlcklucHV0LmlzKCc6Y2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICB9KTtcblxuICAgICRvcGFjaXR5SW5wdXQudmFsKG9wdGlvbnMub3BhY2l0eSkudHJpZ2dlcignY2hhbmdlJyk7XG4gICAgJGhvdmVySW5wdXQucHJvcCgnY2hlY2tlZCcsIG9wdGlvbnMucmV2ZWFsT25Ib3Zlcik7XG59XG4iLCJpbXBvcnQge0VuZ2luZSwgU2VhcmNofSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCIuL3V0aWxzXCI7XG5cblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignc2VhcmNoJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRVcFNlYXJjaChzZWFyY2hPcHRpb25zOiBTZWFyY2gpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIHNlYXJjaCBhbmQgc2VhcmNoIGVuZ2luZXMuLi4nKTtcbiAgICBjb25zdCAkc2VhcmNoSW5wdXQgPSAkKCcjc2VhcmNoJyk7XG4gICAgY29uc3QgJHNlYXJjaEJ1dHRvbiA9ICQoJyNzZWFyY2gtYnRuJyk7XG4gICAgc2V0VXBFbmdpbmVzKHNlYXJjaE9wdGlvbnMpO1xuXG4gICAgJHNlYXJjaElucHV0Lm9uKCdrZXlwcmVzcycsIGUgPT4ge1xuICAgICAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZG9TZWFyY2goKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzZWFyY2hCdXR0b24uY2xpY2soKCkgPT4ge1xuICAgICAgICBkb1NlYXJjaCgpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0VXBFbmdpbmVzKG9wdGlvbnM6IFNlYXJjaCk6IHZvaWQge1xuICAgIGNvbnN0ICRlbmdpbmVzRm9ybSA9ICQoJyNlbmdpbmVzJyk7XG4gICAgY29uc3QgJHNvdXJjZSA9ICQoXCIjZW5naW5lLXRlbXBsYXRlXCIpLmh0bWwoKTtcbiAgICBjb25zdCBlbmdpbmVUZW1wbGF0ZSA9IEhhbmRsZWJhcnMuY29tcGlsZSgkc291cmNlKTtcblxuICAgICRlbmdpbmVzRm9ybS5odG1sKCcnKTsgIC8vIGNsZWFyXG5cbiAgICBvcHRpb25zLmVuZ2luZXMuZm9yRWFjaChmdW5jdGlvbiAoZW5naW5lKSB7XG4gICAgICAgIGNvbnN0ICRlbmdpbmUgPSAkKGVuZ2luZVRlbXBsYXRlKHtcbiAgICAgICAgICAgIG5hbWU6IGVuZ2luZS5uYW1lLFxuICAgICAgICAgICAgdXJsOiBlbmdpbmUudXJsLFxuICAgICAgICAgICAgY2hlY2tlZDogZW5naW5lLm5hbWUgPT09IG9wdGlvbnMuZGVmLFxuICAgICAgICB9KSk7XG4gICAgICAgICRlbmdpbmUuZmluZCgnaW5wdXQnKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKCcjc2VhcmNoJykuZm9jdXMoKTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmxhYmVsSXNVcmwpXG4gICAgICAgICAgICAgICAgZG9TZWFyY2goJCh0aGlzKS5hdHRyKCdkYXRhLXVybCcpKTtcbiAgICAgICAgfSk7XG4gICAgICAgICRlbmdpbmVzRm9ybS5hcHBlbmQoJGVuZ2luZSlcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZG9TZWFyY2godXJsID0gJ2h0dHA6Ly9nb29nbGUuY29tL3NlYXJjaD9xPScpIHtcbiAgICBsZXQgcXVlcnkgPSAkKCcjc2VhcmNoJykudmFsKCk7XG4gICAgdXJsID0gJCgnI2VuZ2luZXMnKS5maW5kKCdpbnB1dFtuYW1lPWVuZ2luZV06Y2hlY2tlZCcpLmF0dHIoJ2RhdGEtdXJsJykgfHwgdXJsO1xuICAgIGlmIChxdWVyeSkge1xuICAgICAgICBjb25zdCBkZXN0VXJsID0gdXJsICsgZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5IGFzIHN0cmluZyk7XG4gICAgICAgIGNocm9tZS50YWJzLmdldEN1cnJlbnQoZnVuY3Rpb24gKHRhYikge1xuICAgICAgICAgICAgY2hyb21lLnRhYnMudXBkYXRlKHRhYi5pZCwge1xuICAgICAgICAgICAgICAgIHVybDogZGVzdFVybCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCJpbXBvcnQge1RhYiwgVGFic30gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7b3BlbkxpbmtGdW5jLCBMb2dnZXJ9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgQm9va21hcmtUcmVlTm9kZSA9IGNocm9tZS5ib29rbWFya3MuQm9va21hcmtUcmVlTm9kZTtcblxuXG5jb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCd0YWJzJyk7XG5cbmludGVyZmFjZSBUaXRsZVVybCB7XG4gICAgdGl0bGU6IHN0cmluZyxcbiAgICB1cmw6IHN0cmluZ1xufVxuXG5jb25zdCB0aWxlVGVtcGxhdGUgPSBIYW5kbGViYXJzLmNvbXBpbGUoJChcIiN0aWxlLXRlbXBsYXRlXCIpLmh0bWwoKSk7XG5jb25zdCBoZWFkZXJUZW1wbGF0ZSA9IEhhbmRsZWJhcnMuY29tcGlsZSgkKFwiI3RhYi10aXRsZS10ZW1wbGF0ZVwiKS5odG1sKCkpO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRVcFRhYnModGFiczogVGFicykge1xuICAgIGxvZ2dlci5sb2coJ3NldHRpbmcgdGFicy4uLicpO1xuICAgIGNvbnN0ICR0YWJzID0gJCgnI3RhYnMnKTtcbiAgICBjb25zdCAkaGVhZGVycyA9ICR0YWJzLmZpbmQoJ3VsJykuZXEoMCk7XG4gICAgY29uc3QgJGNvbnRlbnRzID0gJHRhYnMuZmluZCgndWwnKS5lcSgxKTtcblxuXG4gICAgZm9yIChsZXQgdGFiIG9mIHRhYnMuZW50aXRpZXMpIHtcbiAgICAgICAgY29uc3QgaGVhZGVyID0gaGVhZGVyVGVtcGxhdGUoe1xuICAgICAgICAgICAgbmFtZTogdGFiLm5hbWUsXG4gICAgICAgICAgICBhY3RpdmU6IHRhYi5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IHRhYnMuZGVmLnRvTG93ZXJDYXNlKCksXG4gICAgICAgIH0pO1xuICAgICAgICAkaGVhZGVycy5hcHBlbmQoaGVhZGVyKTtcbiAgICAgICAgY29uc3QgJGNvbnRlbnQgPSAkKCc8bGk+Jyk7XG4gICAgICAgICRjb250ZW50cy5hcHBlbmQoJGNvbnRlbnQpO1xuXG4gICAgICAgIGlmICh0YWIuc3JjID09PSAndG9wJykge1xuICAgICAgICAgICAgc2V0VXBUb3AoJGNvbnRlbnQsIHRhYnMuZ3JpZClcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0YWIuc3JjID09PSAncmVjZW50Jykge1xuICAgICAgICAgICAgc2V0VXBSZWNlbnQoJGNvbnRlbnQsIHRhYnMuZ3JpZClcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNldFVwQm9va21hcmtzKHRhYiwgJGNvbnRlbnQsIHRhYnMuZ3JpZCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFkZFRpbGUoJGNvbnRlbnQ6IEpRdWVyeSwgZGF0YTogVGl0bGVVcmwpIHtcbiAgICBjb25zdCAkdGlsZSA9ICQodGlsZVRlbXBsYXRlKHtcbiAgICAgICAgZmF2aWNvbjogYGNocm9tZTovL2Zhdmljb24vc2l6ZS8xNkAyeC8ke2RhdGEudXJsfWAsXG4gICAgICAgIHRpdGxlOiBkYXRhLnRpdGxlLFxuICAgICAgICB1cmw6IGRlY29kZVVSSUNvbXBvbmVudChkYXRhLnVybClcbiAgICB9KSk7XG5cbiAgICBpZiAoZGF0YS51cmwuc3RhcnRzV2l0aCgnY2hyb21lJykpIHtcbiAgICAgICAgJHRpbGUuY2xpY2sob3BlbkxpbmtGdW5jKGRhdGEudXJsKSk7XG4gICAgfVxuXG4gICAgJGNvbnRlbnQuYXBwZW5kKCR0aWxlKTtcbn1cblxuZnVuY3Rpb24gdHJhdmVyc2UodHJlZTogQm9va21hcmtUcmVlTm9kZSwgcGF0aDogc3RyaW5nW10pOiBCb29rbWFya1RyZWVOb2RlIHtcbiAgICBpZiAocGF0aC5sZW5ndGggPT09IDApXG4gICAgICAgIHJldHVybiB0cmVlO1xuICAgIGZvciAobGV0IGNoaWxkIG9mIHRyZWUuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGNoaWxkLnRpdGxlID09PSBwYXRoWzBdKSB7XG4gICAgICAgICAgICBwYXRoID0gcGF0aC5zbGljZSgxKTtcbiAgICAgICAgICAgIHJldHVybiB0cmF2ZXJzZShjaGlsZCwgcGF0aCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHNldFVwVG9wKCRjb250ZW50OiBKUXVlcnksIHtyb3dzLCBjb2xzfSkge1xuICAgIGNocm9tZS50b3BTaXRlcy5nZXQoZnVuY3Rpb24gKHVybHMpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1cmxzLmxlbmd0aCAmJiBpIDwgcm93cyAqIGNvbHM7IGkrKykge1xuICAgICAgICAgICAgYWRkVGlsZSgkY29udGVudCwgdXJsc1tpXSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2V0VXBSZWNlbnQoJGNvbnRlbnQ6IEpRdWVyeSwge3Jvd3MsIGNvbHN9KSB7XG4gICAgY2hyb21lLnNlc3Npb25zLmdldFJlY2VudGx5Q2xvc2VkKGZ1bmN0aW9uIChzZXNzaW9ucykge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlc3Npb25zLmxlbmd0aCAmJiBpIDwgcm93cyAqIGNvbHM7IGkrKykge1xuICAgICAgICAgICAgaWYgKHNlc3Npb25zW2ldLnRhYilcbiAgICAgICAgICAgICAgICBhZGRUaWxlKCRjb250ZW50LCBzZXNzaW9uc1tpXS50YWIgYXMgVGl0bGVVcmwpO1xuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gc2V0VXBCb29rbWFya3ModGFiOiBUYWIsICRjb250ZW50OiBKUXVlcnksIHtyb3dzLCBjb2xzfSkge1xuICAgIGlmICghdGFiLnNyYy5zdGFydHNXaXRoKCdib29rbWFyazonKSkgcmV0dXJuO1xuICAgIGNvbnN0IHBhdGggPSB0YWIuc3JjLnJlcGxhY2UoL15ib29rbWFyazovLCAnJykuc3BsaXQoJy8nKTtcbiAgICBjaHJvbWUuYm9va21hcmtzLmdldFRyZWUoZnVuY3Rpb24gKHRyZWUpIHtcbiAgICAgICAgY29uc3QgYm9va21hcmtUcmVlID0gdHJlZVswXTtcbiAgICAgICAgY29uc3QgZm9sZGVyID0gdHJhdmVyc2UoYm9va21hcmtUcmVlLCBwYXRoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3BhdGgnLCBwYXRoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2ZvbGRlcicsIGZvbGRlcik7XG4gICAgICAgIGlmIChmb2xkZXIpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZm9sZGVyLmNoaWxkcmVuLmxlbmd0aCAmJiBpIDwgcm93cyAqIGNvbHM7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJvb2ttYXJrID0gZm9sZGVyLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGlmICghYm9va21hcmsuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkVGlsZSgkY29udGVudCwgYm9va21hcmsgYXMgVGl0bGVVcmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pXG59XG4iLCJleHBvcnQgY2xhc3MgTG9nZ2VyIHtcbiAgICBwcml2YXRlIG5hbWU6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgfVxuICAgIGxvZyguLi5tZXNzYWdlOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLm5hbWUgKyAnOicsIC4uLm1lc3NhZ2UpO1xuICAgIH1cbiAgICBlcnJvciguLi5tZXNzYWdlOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMubmFtZSArICc6JywgLi4ubWVzc2FnZSk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3BlbkxpbmtGdW5jKHVybDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuY3RybEtleSB8fFxuICAgICAgICAgICAgZXZlbnQuc2hpZnRLZXkgfHxcbiAgICAgICAgICAgIGV2ZW50Lm1ldGFLZXkgfHwgIC8vIGNtZFxuICAgICAgICAgICAgKGV2ZW50LmJ1dHRvbiAmJiBldmVudC5idXR0b24gPT09IDEpXG4gICAgICAgICkge1xuICAgICAgICAgICAgY2hyb21lLnRhYnMuY3JlYXRlKHt1cmw6IHVybCwgYWN0aXZlOiBmYWxzZX0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY2hyb21lLnRhYnMuZ2V0Q3VycmVudChmdW5jdGlvbiAodGFiKSB7XG4gICAgICAgICAgICAgICAgY2hyb21lLnRhYnMudXBkYXRlKHRhYi5pZCwge3VybDogdXJsfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgbGV0IGNodW5rZWRTdG9yYWdlID0ge1xuICAgIHNldChpdGVtczogT2JqZWN0LCBjYWxsYmFjaz8pIHtcbiAgICAgICAgY29uc3Qgc3RvcmFnZU9iaiA9IHt9O1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gaXRlbXMpIHtcbiAgICAgICAgICAgIGlmICghaXRlbXMuaGFzT3duUHJvcGVydHkoa2V5KSkgY29udGludWU7XG4gICAgICAgICAgICBjb25zdCBvYmplY3RUb1N0b3JlID0gaXRlbXNba2V5XTtcbiAgICAgICAgICAgIGxldCBqc29uc3RyID0gSlNPTi5zdHJpbmdpZnkob2JqZWN0VG9TdG9yZSk7XG4gICAgICAgICAgICBsZXQgaSA9IDA7XG5cbiAgICAgICAgICAgIC8vIHNwbGl0IGpzb25zdHIgaW50byBjaHVua3MgYW5kIHN0b3JlIHRoZW0gaW4gYW4gb2JqZWN0IGluZGV4ZWQgYnkgYGtleV9pYFxuICAgICAgICAgICAgd2hpbGUgKGpzb25zdHIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0ga2V5ICsgXCJfXCIgKyBpKys7XG5cbiAgICAgICAgICAgICAgICAvLyBzaW5jZSB0aGUga2V5IHVzZXMgdXAgc29tZSBwZXItaXRlbSBxdW90YSwgc2VlIGhvdyBtdWNoIGlzIGxlZnQgZm9yIHRoZSB2YWx1ZVxuICAgICAgICAgICAgICAgIC8vIGFsc28gdHJpbSBvZmYgMiBmb3IgcXVvdGVzIGFkZGVkIGJ5IHN0b3JhZ2UtdGltZSBgc3RyaW5naWZ5YFxuICAgICAgICAgICAgICAgIC8vIGxldCB2YWx1ZUxlbmd0aCA9IGNocm9tZS5zdG9yYWdlLnN5bmMuUVVPVEFfQllURVNfUEVSX0lURU0gLSBpbmRleC5sZW5ndGggLSAyO1xuICAgICAgICAgICAgICAgIGxldCB2YWx1ZUxlbmd0aCA9IGNocm9tZS5zdG9yYWdlLnN5bmMuUVVPVEFfQllURVNfUEVSX0lURU0gLyAyO1xuICAgICAgICAgICAgICAgIC8vIGxldCB2YWx1ZUxlbmd0aCA9IDEwMDtcblxuICAgICAgICAgICAgICAgIC8vIHRyaW0gZG93biBzZWdtZW50IHNvIGl0IHdpbGwgYmUgc21hbGwgZW5vdWdoIGV2ZW4gd2hlbiBydW4gdGhyb3VnaCBgSlNPTi5zdHJpbmdpZnlgIGFnYWluIGF0IHN0b3JhZ2UgdGltZVxuICAgICAgICAgICAgICAgIGxldCBzZWdtZW50ID0ganNvbnN0ci5zdWJzdHIoMCwgdmFsdWVMZW5ndGgpO1xuICAgICAgICAgICAgICAgIC8vIHdoaWxlIChKU09OLnN0cmluZ2lmeShzZWdtZW50KS5sZW5ndGggPiB2YWx1ZUxlbmd0aClcbiAgICAgICAgICAgICAgICAvLyAgICAgc2VnbWVudCA9IGpzb25zdHIuc3Vic3RyKDAsIC0tdmFsdWVMZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgc3RvcmFnZU9ialtpbmRleF0gPSBzZWdtZW50O1xuICAgICAgICAgICAgICAgIGpzb25zdHIgPSBqc29uc3RyLnN1YnN0cih2YWx1ZUxlbmd0aCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0b3JhZ2VPYmpba2V5ICsgJ18gc2l6ZSddID0gaTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzdG9yZSBhbGwgdGhlIGNodW5rc1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldChzdG9yYWdlT2JqLCBjYWxsYmFjayk7XG4gICAgfSxcblxuICAgIGdldChrZXk6IHN0cmluZywgY2FsbGJhY2s6IChyZXN1bHQ6IGFueSkgPT4gYW55KSB7XG4gICAgICAgIGNvbnN0IHNpemVLZXkgPSBrZXkgKyAnXyBzaXplJztcblxuICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLmdldChzaXplS2V5LCBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0W3NpemVLZXldKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2NodW5rczonLCByZXN1bHRbc2l6ZUtleV0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlc3VsdFtzaXplS2V5XTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGtleXMucHVzaChrZXkgKyAnXycgKyBpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQoa2V5cywgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBhc3N1bWUgdGhhdCBrZXlzIGFyZSBwcmVzZW50XG4gICAgICAgICAgICAgICAgICAgIGxldCBqc29uU3RyID0ga2V5cy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcmV2ICsgcmVzdWx0W2N1cnJdO1xuICAgICAgICAgICAgICAgICAgICB9LCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHtba2V5XTogSlNPTi5wYXJzZShqc29uU3RyKX0pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh7fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVtb3ZlKGtleSwgY2FsbGJhY2spIHtcbiAgICAgICAgLy8gdG9kb1xuICAgIH1cbn07XG5cbiJdfQ==
