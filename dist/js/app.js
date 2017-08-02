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
const logger = new utils_1.Logger('options');
function setUpOptions(options) {
    setActions(options);
    setUpTheme(options.theme);
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
        } else {
            $(this).removeClass('visible');
        }
    }, function () {
        $(this).removeClass('visible');
    });
    $opacityInput.val(options.opacity).trigger('change');
    $hoverInput.prop('checked', options.revealOnHover);
}

},{"./utils":7}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const logger = new utils_1.Logger('search');
function setUpSearch(searchOptions) {
    logger.log('setting search and search engines...');
    const $searchInput = $('#search');
    const $searchButton = $('#search-btn');
    const engines = searchOptions.engines;
    const $engineInputs = setUpEngines(engines, searchOptions.def);
    function doSearch(url = 'http://google.com/search?q=') {
        let query = $searchInput.val();
        for (let $engineInput of $engineInputs) {
            if ($engineInput.prop('checked')) {
                url = $engineInput.attr('data-url');
                break;
            }
        }
        if (query) {
            const destUrl = url + encodeURIComponent(query);
            chrome.tabs.getCurrent(function (tab) {
                chrome.tabs.update(tab.id, {
                    url: destUrl
                });
            });
        }
    }
    $engineInputs.forEach(function ($engineInput) {
        $engineInput.click(function () {
            $searchInput.focus();
            if (searchOptions.labelIsUrl) doSearch($engineInput.attr('data-url'));
        });
    });
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
function setUpEngines(engines, def) {
    const $enginesForm = $('#engines');
    const $source = $("#engine-template").html();
    const engineTemplate = Handlebars.compile($source);
    const $engines = [];
    engines.forEach(function (engine) {
        const $engine = $(engineTemplate({
            name: engine.name,
            url: engine.url,
            checked: engine.name === def
        }));
        $engines.push($engine.find('input'));
        $enginesForm.append($engine);
    });
    return $engines;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvYXBwLnRzIiwic3JjL3RzL2RlZmF1bHRPcHRpb25zLnRzIiwic3JjL3RzL25hdmJhci50cyIsInNyYy90cy9vcHRpb25zLnRzIiwic3JjL3RzL3NlYXJjaC50cyIsInNyYy90cy90YWJzLnRzIiwic3JjL3RzL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FDQ0EseUJBQW9DO0FBQ3BDLDBCQUF1QztBQUN2Qyx5QkFBb0M7QUFDcEMsdUJBQWdDO0FBRWhDLGlDQUE2QztBQUM3Qyx3QkFBOEI7QUFHOUIsTUFBTSxBQUFNLFNBQUcsSUFBSSxRQUFNLE9BQUMsQUFBSyxBQUFDLEFBQUM7QUFDakMsQUFBTSxPQUFDLEFBQUcsSUFBQyxBQUFRLEFBQUMsQUFBQztBQUVyQjtBQUNJLEFBQU0sZUFBSyxBQUFPLFFBQUMsVUFBVSxBQUFPO0FBQ2hDLEFBQU0sZUFBQyxBQUFPLFFBQUMsQUFBSyxNQUFDLEFBQUcsSUFBQyxBQUFTLFdBQUUsVUFBVSxBQUFNO0FBQ2hELGdCQUFJLEFBQWdCLEFBQUM7QUFDckIsQUFBRSxBQUFDLGdCQUFDLEFBQU0sT0FBQyxBQUFTLEFBQUMsQUFBQyxZQUFDLEFBQUM7QUFDcEIsQUFBTywwQkFBRyxBQUFNLE9BQUMsQUFBUyxBQUFZLEFBQUM7QUFDdkMsQUFBTSx1QkFBQyxBQUFHLElBQUMsQUFBbUMsQUFBQyxBQUFDO0FBQ2hELEFBQU0sdUJBQUMsQUFBRyxJQUFDLEFBQVUsWUFBRSxBQUFPLEFBQUMsQUFBQztBQUNoQyxBQUFPLHdCQUFDLEFBQU8sQUFBQyxBQUNwQjtBQUFDLEFBQ0QsQUFBSSxtQkFBQyxBQUFDO0FBQ0YsQUFBTywwQkFBRyxBQUFJLEtBQUMsQUFBSyxNQUFDLEFBQUksS0FBQyxBQUFTLFVBQUMsaUJBQWMsQUFBQyxBQUFDLEFBQUM7QUFDckQsQUFBTSx1QkFBQyxBQUFHLElBQUMsQUFBa0QsQUFBQyxB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SSxtQkFBQyxBQUFDO0FBQ0YsQUFBUSx5QkFBQyxBQUFFLEFBQUMsQUFBQyxBQUNqQjtBQUFDLEFBQ0w7QUFBQyxBQUFDLEFBQUMsQUFDUDtBQUFDO0FBQ0QsQUFBTSxXQUFDLEFBQUcsS0FBRSxBQUFRLFVBRXBCLENBQUMsQUFDSixBQUFDO0FBNUQwQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQge09wdGlvbnN9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQge3NldFVwTmF2YmFyfSBmcm9tICcuL25hdmJhcidcbmltcG9ydCB7c2V0VXBPcHRpb25zfSBmcm9tIFwiLi9vcHRpb25zXCI7XG5pbXBvcnQge3NldFVwU2VhcmNofSBmcm9tICcuL3NlYXJjaCdcbmltcG9ydCB7c2V0VXBUYWJzfSBmcm9tICcuL3RhYnMnXG5cbmltcG9ydCBkZWZhdWx0T3B0aW9ucyBmcm9tICcuL2RlZmF1bHRPcHRpb25zJ1xuaW1wb3J0IHtMb2dnZXJ9IGZyb20gJy4vdXRpbHMnXG5cblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignYXBwJyk7XG5sb2dnZXIubG9nKCdpbnNpZGUnKTtcblxuZnVuY3Rpb24gcHJvbWlzZU9wdGlvbnMoKTogUHJvbWlzZTxPcHRpb25zPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgnb3B0aW9ucycsIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGxldCBvcHRpb25zOiBPcHRpb25zO1xuICAgICAgICAgICAgaWYgKHJlc3VsdFsnb3B0aW9ucyddKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHJlc3VsdFsnb3B0aW9ucyddIGFzIE9wdGlvbnM7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZygndXNpbmcgb3B0aW9ucyBsb2FkZWQgZnJvbSBzdG9yYWdlJyk7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZygnb3B0aW9uczonLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKG9wdGlvbnMpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkZWZhdWx0T3B0aW9ucykpOyAgLy8gZGVlcCBjb3B5XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZygndXNpbmcgZGVmYXVsdCBvcHRpb25zIGFuZCBzYXZlIHRoZW0gaW50byBzdG9yYWdlJyk7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZygnb3B0aW9uczonLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeydvcHRpb25zJzogb3B0aW9uc30sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShvcHRpb25zKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pO1xufVxuXG5wcm9taXNlT3B0aW9ucygpLnRoZW4oZnVuY3Rpb24gKG9wdGlvbnM6IE9wdGlvbnMpIHtcbiAgICBzZXRUaW1lb3V0KHNldFVwTmF2YmFyLCAwKTtcbiAgICBzZXRUaW1lb3V0KHNldFVwT3B0aW9ucywgMCwgb3B0aW9ucyk7XG4gICAgc2V0VGltZW91dChzZXRVcFNlYXJjaCwgMCwgb3B0aW9ucy5zZWFyY2gpO1xuICAgIHNldFRpbWVvdXQoc2V0VXBUYWJzLCAwLCBvcHRpb25zLnRhYnMpO1xufSk7XG4iLCJpbXBvcnQge09wdGlvbnN9IGZyb20gXCIuL3R5cGVzXCI7XG5cblxubGV0IG9wdGlvbnM6IE9wdGlvbnMgPSB7XG4gICAgdGhlbWU6IHtcbiAgICAgICAgdGl0bGU6ICdOZXcgdGFiJyxcbiAgICAgICAgaGVhZGVyOiAnaGVsbG8gbWEgZHVkZScsXG4gICAgICAgIGJhY2tncm91bmQ6IHtcbiAgICAgICAgICAgIGRlZjogJ2NvbG9yJyxcbiAgICAgICAgICAgIGNvbG9yOiAnI2E4YThhOCcsXG4gICAgICAgICAgICBpbWFnZTogJycsXG4gICAgICAgICAgICB1cmw6ICdodHRwOi8vaS5pbWd1ci5jb20vdjU1OEg2OC5wbmcnLFxuICAgICAgICB9LFxuICAgICAgICB2aXNpYmlsaXR5OiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxMDAsXG4gICAgICAgICAgICByZXZlYWxPbkhvdmVyOiB0cnVlLFxuICAgICAgICB9XG4gICAgfSxcbiAgICBzZWFyY2g6IHtcbiAgICAgICAgZGVmOiAnZ29vZ2xlJyxcbiAgICAgICAgZW5naW5lczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdnb29nbGUnLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHA6Ly9nb29nbGUuY29tL3NlYXJjaD9xPScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpbWFnZXMnLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vd3d3Lmdvb2dsZS5jb20vaW1hZ2VzP3E9JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3RyYWt0JyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwOi8vdHJha3QudHYvc2VhcmNoP3E9JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3dpa2knLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93L2luZGV4LnBocD9zZWFyY2g9JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGxhYmVsSXNVcmw6IGZhbHNlLFxuICAgIH0sXG4gICAgdGFiczoge1xuICAgICAgICBkZWY6ICdyZWNlbnQnLFxuICAgICAgICBncmlkOiB7XG4gICAgICAgICAgICBjb2xzOiA1LFxuICAgICAgICAgICAgcm93czogNSxcbiAgICAgICAgfSxcbiAgICAgICAgZW50aXRpZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnRmF2JyxcbiAgICAgICAgICAgICAgICBzcmM6ICdib29rbWFyazpCb29rbWFya3MgQmFyJyxcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnVG9wJyxcbiAgICAgICAgICAgICAgICBzcmM6ICd0b3AnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnUmVjZW50JyxcbiAgICAgICAgICAgICAgICBzcmM6ICdyZWNlbnQnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBvcHRpb25zO1xuIiwiaW1wb3J0IHtvcGVuTGlua0Z1bmMsIExvZ2dlcn0gZnJvbSBcIi4vdXRpbHNcIjtcblxuXG5jb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCduYXZiYXInKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldFVwTmF2YmFyKCkge1xuICAgIHNldFRpbWVvdXQoc2V0VXBOYXZVcmxzLCAwKTtcbiAgICBzZXRUaW1lb3V0KHNldFVwQWRkb25zLCAwKTtcbn1cblxuZnVuY3Rpb24gc2V0VXBOYXZVcmxzKCkge1xuICAgIGxvZ2dlci5sb2coJ3NldHRpbmcgdXJscy4uLicpO1xuICAgICQoJyNoaXN0b3J5JykuY2xpY2sob3BlbkxpbmtGdW5jKCdjaHJvbWU6Ly9oaXN0b3J5LycpKTtcbiAgICAkKCcjYm9va21hcmtzJykuY2xpY2sob3BlbkxpbmtGdW5jKCdjaHJvbWU6Ly9ib29rbWFya3MvJykpO1xuICAgICQoJyNleHRlbnNpb25zJykuY2xpY2sob3BlbkxpbmtGdW5jKCdjaHJvbWU6Ly9leHRlbnNpb25zLycpKTtcbiAgICAkKCcjYWxsLWFwcHMnKS5jbGljayhvcGVuTGlua0Z1bmMoJ2Nocm9tZTovL2FwcHMvJykpO1xufVxuXG5cbmZ1bmN0aW9uIHNldFVwQWRkb25zKCkge1xuICAgIGxvZ2dlci5sb2coJ3NldHRpbmcgYWRkLW9ucy4uLicpO1xuICAgIGNvbnN0ICRzb3VyY2UgPSAkKFwiI2FwcC10ZW1wbGF0ZVwiKS5odG1sKCk7XG4gICAgY29uc3QgYXBwVGVtcGxhdGUgPSBIYW5kbGViYXJzLmNvbXBpbGUoJHNvdXJjZSk7XG5cbiAgICBjaHJvbWUubWFuYWdlbWVudC5nZXRBbGwoZnVuY3Rpb24gKGFkZG9ucykge1xuICAgICAgICBjb25zdCAkYXBwc19saXN0ID0gJCgnI2FwcHMnKTtcbiAgICAgICAgZm9yIChsZXQgYWRkb24gb2YgYWRkb25zKSB7XG4gICAgICAgICAgICBpZiAoYWRkb24udHlwZS5lbmRzV2l0aCgnX2FwcCcpKSB7XG4gICAgICAgICAgICAgICAgbGV0IGljb24gPSAnJztcbiAgICAgICAgICAgICAgICBpZiAoYWRkb24uaWNvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWNvbiA9IGFkZG9uLmljb25zW2FkZG9uLmljb25zLmxlbmd0aC0xXS51cmw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGFwcEh0bWwgPSBhcHBUZW1wbGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGFkZG9uLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGljb246IGljb24sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgJGNsaWNrYWJsZUFwcCA9ICQoYXBwSHRtbCkuY2xpY2soKCkgPT4gY2hyb21lLm1hbmFnZW1lbnQubGF1bmNoQXBwKGFkZG9uLmlkKSk7XG4gICAgICAgICAgICAgICAgJGFwcHNfbGlzdC5hcHBlbmQoJGNsaWNrYWJsZUFwcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbiIsImltcG9ydCB7QmFja2dyb3VuZCwgT3B0aW9ucywgVGhlbWUsIFZpc2liaWxpdHl9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcIi4vdXRpbHNcIjtcblxuXG5jb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCdvcHRpb25zJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRVcE9wdGlvbnMob3B0aW9uczogT3B0aW9ucykge1xuICAgIHNldEFjdGlvbnMob3B0aW9ucyk7XG4gICAgc2V0VXBUaGVtZShvcHRpb25zLnRoZW1lKVxufVxuXG5mdW5jdGlvbiBmYWRlSW5PdXQoJHRhcmdldDogSlF1ZXJ5LCBodG1sLCBkdXJhdGlvbiA9IDEwMDApIHtcbiAgICAkdGFyZ2V0XG4gICAgICAgIC5odG1sKGh0bWwpXG4gICAgICAgIC5hZGRDbGFzcygndWstYW5pbWF0aW9uLXNsaWRlLXRvcC1zbWFsbCcpXG4gICAgICAgIC5yZW1vdmVDbGFzcygndWstYW5pbWF0aW9uLXNsaWRlLWJvdHRvbS1zbWFsbCB1ay1hbmltYXRpb24tcmV2ZXJzZScpO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAkdGFyZ2V0XG4gICAgICAgICAgICAucmVtb3ZlKCd1ay1hbmltYXRpb24tc2xpZGUtdG9wLXNtYWxsJylcbiAgICAgICAgICAgIC5hZGRDbGFzcygndWstYW5pbWF0aW9uLXNsaWRlLWJvdHRvbS1zbWFsbCB1ay1hbmltYXRpb24tcmV2ZXJzZScpO1xuXG4gICAgfSwgZHVyYXRpb24pXG59XG5cbmZ1bmN0aW9uIHNldEFjdGlvbnMob3B0aW9ucykge1xuICAgIGxvZ2dlci5sb2coJ3NldHRpbmcgc2F2ZSBhbmQgc2V0IGRlZmF1bHQgYnV0dG9ucy4uLicpO1xuICAgIGNvbnN0ICRhY3Rpb25zSW5mbyA9ICQoJyNhY3Rpb25zLWluZm8nKTtcblxuICAgICQoJyNzYXZlLXNldHRpbmdzJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAob3B0aW9ucy50aGVtZS5iYWNrZ3JvdW5kLmRlZiAhPSAnaW1hZ2UnKVxuICAgICAgICAgICAgb3B0aW9ucy50aGVtZS5iYWNrZ3JvdW5kLmltYWdlID0gJyc7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7J29wdGlvbnMnOiBvcHRpb25zfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9nZ2VyLmxvZygnc2F2ZWQnKTtcbiAgICAgICAgICAgIGZhZGVJbk91dCgkYWN0aW9uc0luZm8sICdzYXZlZCcsIDE1MDApXG4gICAgICAgIH0pXG4gICAgfSk7XG5cbiAgICAkKCcjc2V0LWRlZmF1bHQtbW9kYWwnKS5maW5kKCdidXR0b25bbmFtZT1cIm9rXCJdJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5jbGVhcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsb2dnZXIubG9nKCdjbGVhcmVkIHN0b3JhZ2UnKTtcbiAgICAgICAgICAgIC8vIHRvZG86IGFwcGx5IGRlZmF1bHQgb3B0aW9ucyB3L28gcmVsb2FkaW5nIChidXQgbmVlZCB0byBleGNsdWRlIGZyb20gcmVsb2FkaW5nIGV2ZW50IGxpc3RlbmVycyBhcHBsaWVycylcbiAgICAgICAgICAgIGNocm9tZS50YWJzLmdldEN1cnJlbnQoZnVuY3Rpb24gKHRhYikge1xuICAgICAgICAgICAgICAgIGNocm9tZS50YWJzLnJlbG9hZCh0YWIuaWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzZXRVcFRoZW1lKHRoZW1lOiBUaGVtZSkge1xuICAgIGxvZ2dlci5sb2coJ3NldHRpbmcgdmlzaWJpbGl0eSBhbmQgYmFja2dyb3VuZC4uJyk7XG4gICAgdmlzaWJpbGl0eSh0aGVtZS52aXNpYmlsaXR5KTtcbiAgICBiYWNrZ3JvdW5kKHRoZW1lLmJhY2tncm91bmQpO1xuICAgIHRpdGxlKHRoZW1lKTtcbn1cblxuZnVuY3Rpb24gdGl0bGUodGhlbWU6IFRoZW1lKSB7XG4gICAgY29uc3QgJHRpdGxlSW5wdXQgPSAkKCcjdGl0bGUtaW5wdXQnKTtcblxuICAgICQoJ3RpdGxlJykudGV4dCh0aGVtZS50aXRsZSk7XG4gICAgJHRpdGxlSW5wdXQudmFsKHRoZW1lLnRpdGxlKTtcblxuICAgICR0aXRsZUlucHV0Lm9uKCdpbnB1dCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IHRpdGxlID0gJCh0aGlzKS52YWwoKSBhcyBzdHJpbmc7XG4gICAgICAgIHRoZW1lLnRpdGxlID0gdGl0bGU7XG4gICAgICAgICQoJ3RpdGxlJykudGV4dCh0aXRsZSk7XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gYmFja2dyb3VuZChvcHRpb25zOiBCYWNrZ3JvdW5kKSB7XG4gICAgY29uc3QgJGJvZHkgPSAkKCdib2R5Jyk7XG4gICAgY29uc3QgJGlucHV0cyA9ICQoJ3NlbGVjdFtuYW1lPWJhY2tncm91bmRdJyk7XG5cbiAgICBjb25zdCAkY29sb3JJbnB1dCA9ICQoJyNiZy1jb2xvci1pbnB1dCcpO1xuICAgIGNvbnN0ICRpbWFnZUlucHV0ID0gJCgnI2JnLWltYWdlLWlucHV0Jyk7XG4gICAgY29uc3QgJHVybElucHV0ID0gJCgnI2JnLXVybC1pbnB1dCcpO1xuXG4gICAgZnVuY3Rpb24gc2V0Q29sb3IoY29sb3IpIHtcbiAgICAgICAgJGJvZHlcbiAgICAgICAgICAgIC5jc3MoJ2JhY2tncm91bmQtY29sb3InLCBjb2xvcilcbiAgICAgICAgICAgIC5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCAnbm9uZScpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldEltYWdlKGltYWdlKSB7XG4gICAgICAgICRib2R5XG4gICAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgJycpXG4gICAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgYHVybChcIiR7aW1hZ2V9XCIpYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0QkcoKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmRlZiA9PSAnaW1hZ2UnICYmIG9wdGlvbnMuaW1hZ2UgIT0gJycpIHtcbiAgICAgICAgICAgIHNldEltYWdlKG9wdGlvbnMuaW1hZ2UpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5kZWYgPT0gJ3VybCcgJiYgb3B0aW9ucy51cmwgIT0gJycpIHtcbiAgICAgICAgICAgIHNldEltYWdlKG9wdGlvbnMudXJsKVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2V0Q29sb3Iob3B0aW9ucy5jb2xvcilcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNldCB1cCBvcHRpb25zIGN1cnJlbnQgdmFsdWVzXG4gICAgJGlucHV0cy52YWwob3B0aW9ucy5kZWYpLmNoYW5nZSgpO1xuICAgICRjb2xvcklucHV0LnZhbChvcHRpb25zLmNvbG9yKTtcbiAgICAkdXJsSW5wdXQudmFsKG9wdGlvbnMudXJsKTtcblxuICAgIC8vIHNldCB1cCBiZ1xuICAgIHNldEJHKCk7XG5cbiAgICAvLyBzZXQgdXAgbGlzdGVuZXJzXG4gICAgJGlucHV0cy5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICBvcHRpb25zLmRlZiA9ICQodGhpcykudmFsKCkgYXMgc3RyaW5nO1xuICAgICAgICBzZXRCRygpO1xuICAgIH0pO1xuXG4gICAgJGNvbG9ySW5wdXQuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IGNvbG9yID0gJCh0aGlzKS52YWwoKSBhcyBzdHJpbmc7XG4gICAgICAgIHNldENvbG9yKGNvbG9yKTtcbiAgICAgICAgb3B0aW9ucy5jb2xvciA9IGNvbG9yO1xuICAgIH0pO1xuXG4gICAgJGNvbG9ySW5wdXQuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAkaW5wdXRzLnZhbCgnY29sb3InKS5jaGFuZ2UoKTtcbiAgICB9KTtcblxuICAgICRpbWFnZUlucHV0LmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSAkKHRoaXMpLnByb3AoXCJmaWxlc1wiKVswXTtcbiAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZGVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxldCBpbWFnZVVybCA9IHJlYWRlci5yZXN1bHQ7XG4gICAgICAgICAgICBzZXRJbWFnZShpbWFnZVVybCk7XG4gICAgICAgICAgICBvcHRpb25zLmltYWdlID0gaW1hZ2VVcmw7XG4gICAgICAgICAgICAkaW5wdXRzLnZhbCgnaW1hZ2UnKS5jaGFuZ2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGZpbGUpXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICB9KTtcblxuICAgICR1cmxJbnB1dC5vbignaW5wdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IHVybCA9ICQodGhpcykudmFsKCkgYXMgc3RyaW5nO1xuICAgICAgICBpZiAodXJsLm1hdGNoKC9eaHR0cHM/Oi4qXFwuKHBuZ3xqcGd8anBlZykkLykpIHtcbiAgICAgICAgICAgIHNldEltYWdlKHVybCk7XG4gICAgICAgICAgICBvcHRpb25zLnVybCA9IHVybDtcbiAgICAgICAgICAgICRpbnB1dHMudmFsKCd1cmwnKS5jaGFuZ2UoKTtcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHZpc2liaWxpdHkob3B0aW9uczogVmlzaWJpbGl0eSkge1xuICAgIGNvbnN0ICRibG9jayA9ICQoJyNvcHQtdmlzaWJpbGl0eScpO1xuICAgIGNvbnN0ICRvcGFjaXR5ID0gJGJsb2NrLmZpbmQoJ2RpdicpLmVxKDApO1xuICAgIGNvbnN0ICRob3ZlciA9ICRibG9jay5maW5kKCdkaXYnKS5lcSgxKTtcbiAgICBjb25zdCAkb3BhY2l0eUlucHV0ID0gJG9wYWNpdHkuZmluZCgnaW5wdXQnKTtcbiAgICBjb25zdCAkaG92ZXJJbnB1dCA9ICRob3Zlci5maW5kKCdpbnB1dCcpO1xuXG4gICAgJG9wYWNpdHlJbnB1dC5vbignY2hhbmdlIG1vdXNlbW92ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgdmFsID0gJCh0aGlzKS52YWwoKSBhcyBudW1iZXI7XG4gICAgICAgICRvcGFjaXR5LmZpbmQoJ3NwYW4nKS5odG1sKGBPcGFjaXR5OiAke3ZhbH0lYCk7XG4gICAgICAgICQoJy5oaWRhYmxlJykuY3NzKCdvcGFjaXR5JywgdmFsIC8gMTAwKTtcbiAgICAgICAgb3B0aW9ucy5vcGFjaXR5ID0gdmFsO1xuICAgIH0pO1xuXG4gICAgJGhvdmVySW5wdXQub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgb3B0aW9ucy5yZXZlYWxPbkhvdmVyID0gJCh0aGlzKS5wcm9wKCdjaGVja2VkJyk7XG4gICAgfSk7XG5cbiAgICAkKCcuaGlkYWJsZScpLmhvdmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCRob3ZlcklucHV0LmlzKCc6Y2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICB9KTtcblxuICAgICRvcGFjaXR5SW5wdXQudmFsKG9wdGlvbnMub3BhY2l0eSkudHJpZ2dlcignY2hhbmdlJyk7XG4gICAgJGhvdmVySW5wdXQucHJvcCgnY2hlY2tlZCcsIG9wdGlvbnMucmV2ZWFsT25Ib3Zlcik7XG59XG4iLCJpbXBvcnQge0VuZ2luZSwgU2VhcmNofSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCIuL3V0aWxzXCI7XG5cblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignc2VhcmNoJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRVcFNlYXJjaChzZWFyY2hPcHRpb25zOiBTZWFyY2gpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIHNlYXJjaCBhbmQgc2VhcmNoIGVuZ2luZXMuLi4nKTtcbiAgICBjb25zdCAkc2VhcmNoSW5wdXQgPSAkKCcjc2VhcmNoJyk7XG4gICAgY29uc3QgJHNlYXJjaEJ1dHRvbiA9ICQoJyNzZWFyY2gtYnRuJyk7XG4gICAgY29uc3QgZW5naW5lcyA9IHNlYXJjaE9wdGlvbnMuZW5naW5lcztcbiAgICBjb25zdCAkZW5naW5lSW5wdXRzID0gc2V0VXBFbmdpbmVzKGVuZ2luZXMsIHNlYXJjaE9wdGlvbnMuZGVmKTtcblxuICAgIGZ1bmN0aW9uIGRvU2VhcmNoKHVybCA9ICdodHRwOi8vZ29vZ2xlLmNvbS9zZWFyY2g/cT0nKSB7XG4gICAgICAgIGxldCBxdWVyeSA9ICRzZWFyY2hJbnB1dC52YWwoKTtcbiAgICAgICAgZm9yIChsZXQgJGVuZ2luZUlucHV0IG9mICRlbmdpbmVJbnB1dHMpIHtcbiAgICAgICAgICAgIGlmICgkZW5naW5lSW5wdXQucHJvcCgnY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAgICAgdXJsID0gJGVuZ2luZUlucHV0LmF0dHIoJ2RhdGEtdXJsJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHF1ZXJ5KSB7XG4gICAgICAgICAgICBjb25zdCBkZXN0VXJsID0gdXJsICsgZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5IGFzIHN0cmluZyk7XG4gICAgICAgICAgICBjaHJvbWUudGFicy5nZXRDdXJyZW50KGZ1bmN0aW9uICh0YWIpIHtcbiAgICAgICAgICAgICAgICBjaHJvbWUudGFicy51cGRhdGUodGFiLmlkLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogZGVzdFVybCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgJGVuZ2luZUlucHV0cy5mb3JFYWNoKGZ1bmN0aW9uICgkZW5naW5lSW5wdXQpIHtcbiAgICAgICAgJGVuZ2luZUlucHV0LmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzZWFyY2hJbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgaWYgKHNlYXJjaE9wdGlvbnMubGFiZWxJc1VybClcbiAgICAgICAgICAgICAgICBkb1NlYXJjaCgkZW5naW5lSW5wdXQuYXR0cignZGF0YS11cmwnKSk7XG4gICAgICAgIH0pXG4gICAgfSk7XG5cbiAgICAkc2VhcmNoSW5wdXQub24oJ2tleXByZXNzJywgZSA9PiB7XG4gICAgICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBkb1NlYXJjaCgpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHNlYXJjaEJ1dHRvbi5jbGljaygoKSA9PiB7XG4gICAgICAgIGRvU2VhcmNoKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNldFVwRW5naW5lcyhlbmdpbmVzOiBBcnJheTxFbmdpbmU+LCBkZWY6IHN0cmluZyk6IEpRdWVyeVtdIHtcbiAgICBjb25zdCAkZW5naW5lc0Zvcm0gPSAkKCcjZW5naW5lcycpO1xuICAgIGNvbnN0ICRzb3VyY2UgPSAkKFwiI2VuZ2luZS10ZW1wbGF0ZVwiKS5odG1sKCk7XG4gICAgY29uc3QgZW5naW5lVGVtcGxhdGUgPSBIYW5kbGViYXJzLmNvbXBpbGUoJHNvdXJjZSk7XG4gICAgY29uc3QgJGVuZ2luZXMgPSBbXTtcbiAgICBlbmdpbmVzLmZvckVhY2goZnVuY3Rpb24gKGVuZ2luZSkge1xuICAgICAgICBjb25zdCAkZW5naW5lID0gJChlbmdpbmVUZW1wbGF0ZSh7XG4gICAgICAgICAgICBuYW1lOiBlbmdpbmUubmFtZSxcbiAgICAgICAgICAgIHVybDogZW5naW5lLnVybCxcbiAgICAgICAgICAgIGNoZWNrZWQ6IGVuZ2luZS5uYW1lID09PSBkZWYsXG4gICAgICAgIH0pKTtcbiAgICAgICAgJGVuZ2luZXMucHVzaCgkZW5naW5lLmZpbmQoJ2lucHV0JykpO1xuICAgICAgICAkZW5naW5lc0Zvcm0uYXBwZW5kKCRlbmdpbmUpXG4gICAgfSk7XG4gICAgcmV0dXJuICRlbmdpbmVzO1xufVxuIiwiaW1wb3J0IHtUYWIsIFRhYnN9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQge29wZW5MaW5rRnVuYywgTG9nZ2VyfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IEJvb2ttYXJrVHJlZU5vZGUgPSBjaHJvbWUuYm9va21hcmtzLkJvb2ttYXJrVHJlZU5vZGU7XG5cblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcigndGFicycpO1xuXG5pbnRlcmZhY2UgVGl0bGVVcmwge1xuICAgIHRpdGxlOiBzdHJpbmcsXG4gICAgdXJsOiBzdHJpbmdcbn1cblxuY29uc3QgdGlsZVRlbXBsYXRlID0gSGFuZGxlYmFycy5jb21waWxlKCQoXCIjdGlsZS10ZW1wbGF0ZVwiKS5odG1sKCkpO1xuY29uc3QgaGVhZGVyVGVtcGxhdGUgPSBIYW5kbGViYXJzLmNvbXBpbGUoJChcIiN0YWItdGl0bGUtdGVtcGxhdGVcIikuaHRtbCgpKTtcblxuXG5leHBvcnQgZnVuY3Rpb24gc2V0VXBUYWJzKHRhYnM6IFRhYnMpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIHRhYnMuLi4nKTtcbiAgICBjb25zdCAkdGFicyA9ICQoJyN0YWJzJyk7XG4gICAgY29uc3QgJGhlYWRlcnMgPSAkdGFicy5maW5kKCd1bCcpLmVxKDApO1xuICAgIGNvbnN0ICRjb250ZW50cyA9ICR0YWJzLmZpbmQoJ3VsJykuZXEoMSk7XG5cblxuICAgIGZvciAobGV0IHRhYiBvZiB0YWJzLmVudGl0aWVzKSB7XG4gICAgICAgIGNvbnN0IGhlYWRlciA9IGhlYWRlclRlbXBsYXRlKHtcbiAgICAgICAgICAgIG5hbWU6IHRhYi5uYW1lLFxuICAgICAgICAgICAgYWN0aXZlOiB0YWIubmFtZS50b0xvd2VyQ2FzZSgpID09PSB0YWJzLmRlZi50b0xvd2VyQ2FzZSgpLFxuICAgICAgICB9KTtcbiAgICAgICAgJGhlYWRlcnMuYXBwZW5kKGhlYWRlcik7XG4gICAgICAgIGNvbnN0ICRjb250ZW50ID0gJCgnPGxpPicpO1xuICAgICAgICAkY29udGVudHMuYXBwZW5kKCRjb250ZW50KTtcblxuICAgICAgICBpZiAodGFiLnNyYyA9PT0gJ3RvcCcpIHtcbiAgICAgICAgICAgIHNldFVwVG9wKCRjb250ZW50LCB0YWJzLmdyaWQpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGFiLnNyYyA9PT0gJ3JlY2VudCcpIHtcbiAgICAgICAgICAgIHNldFVwUmVjZW50KCRjb250ZW50LCB0YWJzLmdyaWQpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzZXRVcEJvb2ttYXJrcyh0YWIsICRjb250ZW50LCB0YWJzLmdyaWQpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhZGRUaWxlKCRjb250ZW50OiBKUXVlcnksIGRhdGE6IFRpdGxlVXJsKSB7XG4gICAgY29uc3QgJHRpbGUgPSAkKHRpbGVUZW1wbGF0ZSh7XG4gICAgICAgIGZhdmljb246IGBjaHJvbWU6Ly9mYXZpY29uL3NpemUvMTZAMngvJHtkYXRhLnVybH1gLFxuICAgICAgICB0aXRsZTogZGF0YS50aXRsZSxcbiAgICAgICAgdXJsOiBkZWNvZGVVUklDb21wb25lbnQoZGF0YS51cmwpXG4gICAgfSkpO1xuXG4gICAgaWYgKGRhdGEudXJsLnN0YXJ0c1dpdGgoJ2Nocm9tZScpKSB7XG4gICAgICAgICR0aWxlLmNsaWNrKG9wZW5MaW5rRnVuYyhkYXRhLnVybCkpO1xuICAgIH1cblxuICAgICRjb250ZW50LmFwcGVuZCgkdGlsZSk7XG59XG5cbmZ1bmN0aW9uIHRyYXZlcnNlKHRyZWU6IEJvb2ttYXJrVHJlZU5vZGUsIHBhdGg6IHN0cmluZ1tdKTogQm9va21hcmtUcmVlTm9kZSB7XG4gICAgaWYgKHBhdGgubGVuZ3RoID09PSAwKVxuICAgICAgICByZXR1cm4gdHJlZTtcbiAgICBmb3IgKGxldCBjaGlsZCBvZiB0cmVlLmNoaWxkcmVuKSB7XG4gICAgICAgIGlmIChjaGlsZC50aXRsZSA9PT0gcGF0aFswXSkge1xuICAgICAgICAgICAgcGF0aCA9IHBhdGguc2xpY2UoMSk7XG4gICAgICAgICAgICByZXR1cm4gdHJhdmVyc2UoY2hpbGQsIHBhdGgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBzZXRVcFRvcCgkY29udGVudDogSlF1ZXJ5LCB7cm93cywgY29sc30pIHtcbiAgICBjaHJvbWUudG9wU2l0ZXMuZ2V0KGZ1bmN0aW9uICh1cmxzKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdXJscy5sZW5ndGggJiYgaSA8IHJvd3MgKiBjb2xzOyBpKyspIHtcbiAgICAgICAgICAgIGFkZFRpbGUoJGNvbnRlbnQsIHVybHNbaV0pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNldFVwUmVjZW50KCRjb250ZW50OiBKUXVlcnksIHtyb3dzLCBjb2xzfSkge1xuICAgIGNocm9tZS5zZXNzaW9ucy5nZXRSZWNlbnRseUNsb3NlZChmdW5jdGlvbiAoc2Vzc2lvbnMpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZXNzaW9ucy5sZW5ndGggJiYgaSA8IHJvd3MgKiBjb2xzOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChzZXNzaW9uc1tpXS50YWIpXG4gICAgICAgICAgICAgICAgYWRkVGlsZSgkY29udGVudCwgc2Vzc2lvbnNbaV0udGFiIGFzIFRpdGxlVXJsKTtcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHNldFVwQm9va21hcmtzKHRhYjogVGFiLCAkY29udGVudDogSlF1ZXJ5LCB7cm93cywgY29sc30pIHtcbiAgICBpZiAoIXRhYi5zcmMuc3RhcnRzV2l0aCgnYm9va21hcms6JykpIHJldHVybjtcbiAgICBjb25zdCBwYXRoID0gdGFiLnNyYy5yZXBsYWNlKC9eYm9va21hcms6LywgJycpLnNwbGl0KCcvJyk7XG4gICAgY2hyb21lLmJvb2ttYXJrcy5nZXRUcmVlKGZ1bmN0aW9uICh0cmVlKSB7XG4gICAgICAgIGNvbnN0IGJvb2ttYXJrVHJlZSA9IHRyZWVbMF07XG4gICAgICAgIGNvbnN0IGZvbGRlciA9IHRyYXZlcnNlKGJvb2ttYXJrVHJlZSwgcGF0aCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdwYXRoJywgcGF0aCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdmb2xkZXInLCBmb2xkZXIpO1xuICAgICAgICBpZiAoZm9sZGVyKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZvbGRlci5jaGlsZHJlbi5sZW5ndGggJiYgaSA8IHJvd3MgKiBjb2xzOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBib29rbWFyayA9IGZvbGRlci5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICBpZiAoIWJvb2ttYXJrLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZFRpbGUoJGNvbnRlbnQsIGJvb2ttYXJrIGFzIFRpdGxlVXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KVxufVxuIiwiZXhwb3J0IGNsYXNzIExvZ2dlciB7XG4gICAgcHJpdmF0ZSBuYW1lOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgIH1cbiAgICBsb2coLi4ubWVzc2FnZTogYW55W10pOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5uYW1lICsgJzonLCAuLi5tZXNzYWdlKTtcbiAgICB9XG4gICAgZXJyb3IoLi4ubWVzc2FnZTogYW55W10pOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS5lcnJvcih0aGlzLm5hbWUgKyAnOicsIC4uLm1lc3NhZ2UpO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9wZW5MaW5rRnVuYyh1cmw6IHN0cmluZykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmN0cmxLZXkgfHxcbiAgICAgICAgICAgIGV2ZW50LnNoaWZ0S2V5IHx8XG4gICAgICAgICAgICBldmVudC5tZXRhS2V5IHx8ICAvLyBjbWRcbiAgICAgICAgICAgIChldmVudC5idXR0b24gJiYgZXZlbnQuYnV0dG9uID09PSAxKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGNocm9tZS50YWJzLmNyZWF0ZSh7dXJsOiB1cmwsIGFjdGl2ZTogZmFsc2V9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNocm9tZS50YWJzLmdldEN1cnJlbnQoZnVuY3Rpb24gKHRhYikge1xuICAgICAgICAgICAgICAgIGNocm9tZS50YWJzLnVwZGF0ZSh0YWIuaWQsIHt1cmw6IHVybH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGxldCBjaHVua2VkU3RvcmFnZSA9IHtcbiAgICBzZXQoaXRlbXM6IE9iamVjdCwgY2FsbGJhY2s/KSB7XG4gICAgICAgIGNvbnN0IHN0b3JhZ2VPYmogPSB7fTtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIGl0ZW1zKSB7XG4gICAgICAgICAgICBpZiAoIWl0ZW1zLmhhc093blByb3BlcnR5KGtleSkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29uc3Qgb2JqZWN0VG9TdG9yZSA9IGl0ZW1zW2tleV07XG4gICAgICAgICAgICBsZXQganNvbnN0ciA9IEpTT04uc3RyaW5naWZ5KG9iamVjdFRvU3RvcmUpO1xuICAgICAgICAgICAgbGV0IGkgPSAwO1xuXG4gICAgICAgICAgICAvLyBzcGxpdCBqc29uc3RyIGludG8gY2h1bmtzIGFuZCBzdG9yZSB0aGVtIGluIGFuIG9iamVjdCBpbmRleGVkIGJ5IGBrZXlfaWBcbiAgICAgICAgICAgIHdoaWxlIChqc29uc3RyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGtleSArIFwiX1wiICsgaSsrO1xuXG4gICAgICAgICAgICAgICAgLy8gc2luY2UgdGhlIGtleSB1c2VzIHVwIHNvbWUgcGVyLWl0ZW0gcXVvdGEsIHNlZSBob3cgbXVjaCBpcyBsZWZ0IGZvciB0aGUgdmFsdWVcbiAgICAgICAgICAgICAgICAvLyBhbHNvIHRyaW0gb2ZmIDIgZm9yIHF1b3RlcyBhZGRlZCBieSBzdG9yYWdlLXRpbWUgYHN0cmluZ2lmeWBcbiAgICAgICAgICAgICAgICAvLyBsZXQgdmFsdWVMZW5ndGggPSBjaHJvbWUuc3RvcmFnZS5zeW5jLlFVT1RBX0JZVEVTX1BFUl9JVEVNIC0gaW5kZXgubGVuZ3RoIC0gMjtcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWVMZW5ndGggPSBjaHJvbWUuc3RvcmFnZS5zeW5jLlFVT1RBX0JZVEVTX1BFUl9JVEVNIC8gMjtcbiAgICAgICAgICAgICAgICAvLyBsZXQgdmFsdWVMZW5ndGggPSAxMDA7XG5cbiAgICAgICAgICAgICAgICAvLyB0cmltIGRvd24gc2VnbWVudCBzbyBpdCB3aWxsIGJlIHNtYWxsIGVub3VnaCBldmVuIHdoZW4gcnVuIHRocm91Z2ggYEpTT04uc3RyaW5naWZ5YCBhZ2FpbiBhdCBzdG9yYWdlIHRpbWVcbiAgICAgICAgICAgICAgICBsZXQgc2VnbWVudCA9IGpzb25zdHIuc3Vic3RyKDAsIHZhbHVlTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAvLyB3aGlsZSAoSlNPTi5zdHJpbmdpZnkoc2VnbWVudCkubGVuZ3RoID4gdmFsdWVMZW5ndGgpXG4gICAgICAgICAgICAgICAgLy8gICAgIHNlZ21lbnQgPSBqc29uc3RyLnN1YnN0cigwLCAtLXZhbHVlTGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgIHN0b3JhZ2VPYmpbaW5kZXhdID0gc2VnbWVudDtcbiAgICAgICAgICAgICAgICBqc29uc3RyID0ganNvbnN0ci5zdWJzdHIodmFsdWVMZW5ndGgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdG9yYWdlT2JqW2tleSArICdfIHNpemUnXSA9IGk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc3RvcmUgYWxsIHRoZSBjaHVua3NcbiAgICAgICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5zZXQoc3RvcmFnZU9iaiwgY2FsbGJhY2spO1xuICAgIH0sXG5cbiAgICBnZXQoa2V5OiBzdHJpbmcsIGNhbGxiYWNrOiAocmVzdWx0OiBhbnkpID0+IGFueSkge1xuICAgICAgICBjb25zdCBzaXplS2V5ID0ga2V5ICsgJ18gc2l6ZSc7XG5cbiAgICAgICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQoc2l6ZUtleSwgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgaWYgKHJlc3VsdFtzaXplS2V5XSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjaHVua3M6JywgcmVzdWx0W3NpemVLZXldKTtcbiAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXN1bHRbc2l6ZUtleV07IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBrZXlzLnB1c2goa2V5ICsgJ18nICsgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KGtleXMsIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYXNzdW1lIHRoYXQga2V5cyBhcmUgcHJlc2VudFxuICAgICAgICAgICAgICAgICAgICBsZXQganNvblN0ciA9IGtleXMucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJldiArIHJlc3VsdFtjdXJyXTtcbiAgICAgICAgICAgICAgICAgICAgfSwgJycpO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh7W2tleV06IEpTT04ucGFyc2UoanNvblN0cil9KTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soe30pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHJlbW92ZShrZXksIGNhbGxiYWNrKSB7XG4gICAgICAgIC8vIHRvZG9cbiAgICB9XG59O1xuXG4iXX0=
