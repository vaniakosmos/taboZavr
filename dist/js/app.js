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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvYXBwLnRzIiwic3JjL3RzL2RlZmF1bHRPcHRpb25zLnRzIiwic3JjL3RzL25hdmJhci50cyIsInNyYy90cy9vcHRpb25zLnRzIiwic3JjL3RzL3NlYXJjaC50cyIsInNyYy90cy90YWJzLnRzIiwic3JjL3RzL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FDQ0EseUJBQW9DO0FBQ3BDLDBCQUF1QztBQUN2Qyx5QkFBb0M7QUFDcEMsdUJBQWdDO0FBRWhDLGlDQUE2QztBQUM3Qyx3QkFBOEI7QUFHOUIsTUFBTSxBQUFNLFNBQUcsSUFBSSxRQUFNLE9BQUMsQUFBSyxBQUFDLEFBQUM7QUFDakMsQUFBTSxPQUFDLEFBQUcsSUFBQyxBQUFRLEFBQUMsQUFBQztBQUVyQjtBQUNJLEFBQU0sZUFBSyxBQUFPLFFBQUMsVUFBVSxBQUFPO0FBQ2hDLEFBQU0sZUFBQyxBQUFPLFFBQUMsQUFBSyxNQUFDLEFBQUcsSUFBQyxBQUFTLFdBQUUsVUFBVSxBQUFNO0FBQ2hELGdCQUFJLEFBQWdCLEFBQUM7QUFDckIsQUFBRSxBQUFDLGdCQUFDLEFBQU0sT0FBQyxBQUFTLEFBQUMsQUFBQyxZQUFDLEFBQUM7QUFDcEIsQUFBTywwQkFBRyxBQUFNLE9BQUMsQUFBUyxBQUFZLEFBQUM7QUFDdkMsQUFBTSx1QkFBQyxBQUFHLElBQUMsQUFBbUMsQUFBQyxBQUFDO0FBQ2hELEFBQU0sdUJBQUMsQUFBRyxJQUFDLEFBQVUsWUFBRSxBQUFPLEFBQUMsQUFBQztBQUNoQyxBQUFPLHdCQUFDLEFBQU8sQUFBQyxBQUNwQjtBQUFDLEFBQ0QsQUFBSSxtQkFBQyxBQUFDO0FBQ0YsQUFBTywwQkFBRyxBQUFJLEtBQUMsQUFBSyxNQUFDLEFBQUksS0FBQyxBQUFTLFVBQUMsaUJBQWMsQUFBQyxBQUFDLEFBQUM7QUFDckQsQUFBTSx1QkFBQyxBQUFHLElBQUMsQUFBa0QsQUFBQyxB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QUFDLEdBQUUsQUFBQyxJQUFHLEFBQU0sT0FBQyxBQUFPLEFBQUMsVUFBRSxBQUFDLEFBQUUsS0FBRSxBQUFDO0FBQ3ZDLEFBQUkseUJBQUMsQUFBSSxLQUFDLEFBQUcsTUFBRyxBQUFHLE1BQUcsQUFBQyxBQUFDLEFBQUMsQUFDN0I7QUFBQztBQUNELEFBQU0sdUJBQUMsQUFBTyxRQUFDLEFBQUksS0FBQyxBQUFHLElBQUMsQUFBSSxNQUFFLFVBQVUsQUFBTTtBQUUxQyx3QkFBSSxBQUFPLGVBQVEsQUFBTSxPQUFDLFVBQVUsQUFBSSxNQUFFLEFBQUk7QUFDMUMsQUFBTSwrQkFBQyxBQUFJLE9BQUcsQUFBTSxPQUFDLEFBQUksQUFBQyxBQUFDLEFBQy9CO0FBQUMscUJBRmEsQUFBSSxFQUVmLEFBQUUsQUFBQyxBQUFDO0FBQ1AsQUFBUSw2QkFBQyxFQUFDLENBQUMsQUFBRyxBQUFDLE1BQUUsQUFBSSxLQUFDLEFBQUssTUFBQyxBQUFPLEFBQUMsQUFBQyxBQUFDLEFBQUMsQUFDM0M7QUFBQyxBQUFDLEFBQ047QUFBQyxBQUNELEFBQUksbUJBQUMsQUFBQztBQUNGLEFBQVEseUJBQUMsQUFBRSxBQUFDLEFBQUMsQUFDakI7QUFBQyxBQUNMO0FBQUMsQUFBQyxBQUFDLEFBQ1A7QUFBQztBQUNELEFBQU0sV0FBQyxBQUFHLEtBQUUsQUFBUSxVQUVwQixDQUFDLEFBQ0osQUFBQztBQTVEMEIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IHtPcHRpb25zfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHtzZXRVcE5hdmJhcn0gZnJvbSAnLi9uYXZiYXInXG5pbXBvcnQge3NldFVwT3B0aW9uc30gZnJvbSBcIi4vb3B0aW9uc1wiO1xuaW1wb3J0IHtzZXRVcFNlYXJjaH0gZnJvbSAnLi9zZWFyY2gnXG5pbXBvcnQge3NldFVwVGFic30gZnJvbSAnLi90YWJzJ1xuXG5pbXBvcnQgZGVmYXVsdE9wdGlvbnMgZnJvbSAnLi9kZWZhdWx0T3B0aW9ucydcbmltcG9ydCB7TG9nZ2VyfSBmcm9tICcuL3V0aWxzJ1xuXG5cbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ2FwcCcpO1xubG9nZ2VyLmxvZygnaW5zaWRlJyk7XG5cbmZ1bmN0aW9uIHByb21pc2VPcHRpb25zKCk6IFByb21pc2U8T3B0aW9ucz4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoJ29wdGlvbnMnLCBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBsZXQgb3B0aW9uczogT3B0aW9ucztcbiAgICAgICAgICAgIGlmIChyZXN1bHRbJ29wdGlvbnMnXSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSByZXN1bHRbJ29wdGlvbnMnXSBhcyBPcHRpb25zO1xuICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coJ3VzaW5nIG9wdGlvbnMgbG9hZGVkIGZyb20gc3RvcmFnZScpO1xuICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coJ29wdGlvbnM6Jywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShvcHRpb25zKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGVmYXVsdE9wdGlvbnMpKTsgIC8vIGRlZXAgY29weVxuICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coJ3VzaW5nIGRlZmF1bHQgb3B0aW9ucyBhbmQgc2F2ZSB0aGVtIGludG8gc3RvcmFnZScpO1xuICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coJ29wdGlvbnM6Jywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsnb3B0aW9ucyc6IG9wdGlvbnN9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUob3B0aW9ucylcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KTtcbn1cblxucHJvbWlzZU9wdGlvbnMoKS50aGVuKGZ1bmN0aW9uIChvcHRpb25zOiBPcHRpb25zKSB7XG4gICAgc2V0VGltZW91dChzZXRVcE5hdmJhciwgMCk7XG4gICAgc2V0VGltZW91dChzZXRVcE9wdGlvbnMsIDAsIG9wdGlvbnMpO1xuICAgIHNldFRpbWVvdXQoc2V0VXBTZWFyY2gsIDAsIG9wdGlvbnMuc2VhcmNoKTtcbiAgICBzZXRUaW1lb3V0KHNldFVwVGFicywgMCwgb3B0aW9ucy50YWJzKTtcbn0pO1xuIiwiaW1wb3J0IHtPcHRpb25zfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5cbmxldCBvcHRpb25zOiBPcHRpb25zID0ge1xuICAgIHRoZW1lOiB7XG4gICAgICAgIHRpdGxlOiAnTmV3IHRhYicsXG4gICAgICAgIGhlYWRlcjogJ2hlbGxvIG1hIGR1ZGUnLFxuICAgICAgICBiYWNrZ3JvdW5kOiB7XG4gICAgICAgICAgICBkZWY6ICdjb2xvcicsXG4gICAgICAgICAgICBjb2xvcjogJyNhOGE4YTgnLFxuICAgICAgICAgICAgaW1hZ2U6ICcnLFxuICAgICAgICAgICAgdXJsOiAnaHR0cDovL2kuaW1ndXIuY29tL3Y1NThINjgucG5nJyxcbiAgICAgICAgfSxcbiAgICAgICAgdmlzaWJpbGl0eToge1xuICAgICAgICAgICAgb3BhY2l0eTogMTAwLFxuICAgICAgICAgICAgcmV2ZWFsT25Ib3ZlcjogdHJ1ZSxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2VhcmNoOiB7XG4gICAgICAgIGRlZjogJ2dvb2dsZScsXG4gICAgICAgIGVuZ2luZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ29vZ2xlJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwOi8vZ29vZ2xlLmNvbS9zZWFyY2g/cT0nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaW1hZ2VzJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL3d3dy5nb29nbGUuY29tL2ltYWdlcz9xPScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0cmFrdCcsXG4gICAgICAgICAgICAgICAgdXJsOiAnaHR0cDovL3RyYWt0LnR2L3NlYXJjaD9xPScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd3aWtpJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL2VuLndpa2lwZWRpYS5vcmcvdy9pbmRleC5waHA/c2VhcmNoPScsXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBsYWJlbElzVXJsOiBmYWxzZSxcbiAgICB9LFxuICAgIHRhYnM6IHtcbiAgICAgICAgZGVmOiAncmVjZW50JyxcbiAgICAgICAgZ3JpZDoge1xuICAgICAgICAgICAgY29sczogNSxcbiAgICAgICAgICAgIHJvd3M6IDUsXG4gICAgICAgIH0sXG4gICAgICAgIGVudGl0aWVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0ZhdicsXG4gICAgICAgICAgICAgICAgc3JjOiAnYm9va21hcms6Qm9va21hcmtzIEJhcicsXG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ1RvcCcsXG4gICAgICAgICAgICAgICAgc3JjOiAndG9wJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ1JlY2VudCcsXG4gICAgICAgICAgICAgICAgc3JjOiAncmVjZW50JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgb3B0aW9ucztcbiIsImltcG9ydCB7b3BlbkxpbmtGdW5jLCBMb2dnZXJ9IGZyb20gXCIuL3V0aWxzXCI7XG5cblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignbmF2YmFyJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRVcE5hdmJhcigpIHtcbiAgICBzZXRUaW1lb3V0KHNldFVwTmF2VXJscywgMCk7XG4gICAgc2V0VGltZW91dChzZXRVcEFkZG9ucywgMCk7XG59XG5cbmZ1bmN0aW9uIHNldFVwTmF2VXJscygpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIHVybHMuLi4nKTtcbiAgICAkKCcjaGlzdG9yeScpLmNsaWNrKG9wZW5MaW5rRnVuYygnY2hyb21lOi8vaGlzdG9yeS8nKSk7XG4gICAgJCgnI2Jvb2ttYXJrcycpLmNsaWNrKG9wZW5MaW5rRnVuYygnY2hyb21lOi8vYm9va21hcmtzLycpKTtcbiAgICAkKCcjZXh0ZW5zaW9ucycpLmNsaWNrKG9wZW5MaW5rRnVuYygnY2hyb21lOi8vZXh0ZW5zaW9ucy8nKSk7XG4gICAgJCgnI2FsbC1hcHBzJykuY2xpY2sob3BlbkxpbmtGdW5jKCdjaHJvbWU6Ly9hcHBzLycpKTtcbn1cblxuXG5mdW5jdGlvbiBzZXRVcEFkZG9ucygpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIGFkZC1vbnMuLi4nKTtcbiAgICBjb25zdCAkc291cmNlID0gJChcIiNhcHAtdGVtcGxhdGVcIikuaHRtbCgpO1xuICAgIGNvbnN0IGFwcFRlbXBsYXRlID0gSGFuZGxlYmFycy5jb21waWxlKCRzb3VyY2UpO1xuXG4gICAgY2hyb21lLm1hbmFnZW1lbnQuZ2V0QWxsKGZ1bmN0aW9uIChhZGRvbnMpIHtcbiAgICAgICAgY29uc3QgJGFwcHNfbGlzdCA9ICQoJyNhcHBzJyk7XG4gICAgICAgIGZvciAobGV0IGFkZG9uIG9mIGFkZG9ucykge1xuICAgICAgICAgICAgaWYgKGFkZG9uLnR5cGUuZW5kc1dpdGgoJ19hcHAnKSkge1xuICAgICAgICAgICAgICAgIGxldCBpY29uID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKGFkZG9uLmljb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGljb24gPSBhZGRvbi5pY29uc1thZGRvbi5pY29ucy5sZW5ndGgtMV0udXJsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBhcHBIdG1sID0gYXBwVGVtcGxhdGUoe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBhZGRvbi5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBpY29uOiBpY29uLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0ICRjbGlja2FibGVBcHAgPSAkKGFwcEh0bWwpLmNsaWNrKCgpID0+IGNocm9tZS5tYW5hZ2VtZW50LmxhdW5jaEFwcChhZGRvbi5pZCkpO1xuICAgICAgICAgICAgICAgICRhcHBzX2xpc3QuYXBwZW5kKCRjbGlja2FibGVBcHApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG4iLCJpbXBvcnQge0JhY2tncm91bmQsIE9wdGlvbnMsIFRoZW1lLCBWaXNpYmlsaXR5fSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCIuL3V0aWxzXCI7XG5cblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignb3B0aW9ucycpO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0VXBPcHRpb25zKG9wdGlvbnM6IE9wdGlvbnMpIHtcbiAgICBzZXRBY3Rpb25zKG9wdGlvbnMpO1xuICAgIHNldFVwVGhlbWUob3B0aW9ucy50aGVtZSlcbn1cblxuZnVuY3Rpb24gZmFkZUluT3V0KCR0YXJnZXQ6IEpRdWVyeSwgaHRtbCwgZHVyYXRpb24gPSAxMDAwKSB7XG4gICAgJHRhcmdldFxuICAgICAgICAuaHRtbChodG1sKVxuICAgICAgICAuYWRkQ2xhc3MoJ3VrLWFuaW1hdGlvbi1zbGlkZS10b3Atc21hbGwnKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ3VrLWFuaW1hdGlvbi1zbGlkZS1ib3R0b20tc21hbGwgdWstYW5pbWF0aW9uLXJldmVyc2UnKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHRhcmdldFxuICAgICAgICAgICAgLnJlbW92ZSgndWstYW5pbWF0aW9uLXNsaWRlLXRvcC1zbWFsbCcpXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ3VrLWFuaW1hdGlvbi1zbGlkZS1ib3R0b20tc21hbGwgdWstYW5pbWF0aW9uLXJldmVyc2UnKTtcblxuICAgIH0sIGR1cmF0aW9uKVxufVxuXG5mdW5jdGlvbiBzZXRBY3Rpb25zKG9wdGlvbnMpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIHNhdmUgYW5kIHNldCBkZWZhdWx0IGJ1dHRvbnMuLi4nKTtcbiAgICBjb25zdCAkYWN0aW9uc0luZm8gPSAkKCcjYWN0aW9ucy1pbmZvJyk7XG5cbiAgICAkKCcjc2F2ZS1zZXR0aW5ncycpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMudGhlbWUuYmFja2dyb3VuZC5kZWYgIT0gJ2ltYWdlJylcbiAgICAgICAgICAgIG9wdGlvbnMudGhlbWUuYmFja2dyb3VuZC5pbWFnZSA9ICcnO1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeydvcHRpb25zJzogb3B0aW9uc30sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvZ2dlci5sb2coJ3NhdmVkJyk7XG4gICAgICAgICAgICBmYWRlSW5PdXQoJGFjdGlvbnNJbmZvLCAnc2F2ZWQnLCAxNTAwKVxuICAgICAgICB9KVxuICAgIH0pO1xuXG4gICAgJCgnI3NldC1kZWZhdWx0LW1vZGFsJykuZmluZCgnYnV0dG9uW25hbWU9XCJva1wiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuY2xlYXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9nZ2VyLmxvZygnY2xlYXJlZCBzdG9yYWdlJyk7XG4gICAgICAgICAgICAvLyB0b2RvOiBhcHBseSBkZWZhdWx0IG9wdGlvbnMgdy9vIHJlbG9hZGluZyAoYnV0IG5lZWQgdG8gZXhjbHVkZSBmcm9tIHJlbG9hZGluZyBldmVudCBsaXN0ZW5lcnMgYXBwbGllcnMpXG4gICAgICAgICAgICBjaHJvbWUudGFicy5nZXRDdXJyZW50KGZ1bmN0aW9uICh0YWIpIHtcbiAgICAgICAgICAgICAgICBjaHJvbWUudGFicy5yZWxvYWQodGFiLmlkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2V0VXBUaGVtZSh0aGVtZTogVGhlbWUpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIHZpc2liaWxpdHkgYW5kIGJhY2tncm91bmQuLicpO1xuICAgIHZpc2liaWxpdHkodGhlbWUudmlzaWJpbGl0eSk7XG4gICAgYmFja2dyb3VuZCh0aGVtZS5iYWNrZ3JvdW5kKVxufVxuXG5mdW5jdGlvbiBiYWNrZ3JvdW5kKG9wdGlvbnM6IEJhY2tncm91bmQpIHtcbiAgICBjb25zdCAkYm9keSA9ICQoJ2JvZHknKTtcbiAgICBjb25zdCAkaW5wdXRzID0gJCgnc2VsZWN0W25hbWU9YmFja2dyb3VuZF0nKTtcblxuICAgIGNvbnN0ICRjb2xvcklucHV0ID0gJCgnI2JnLWNvbG9yLWlucHV0Jyk7XG4gICAgY29uc3QgJGltYWdlSW5wdXQgPSAkKCcjYmctaW1hZ2UtaW5wdXQnKTtcbiAgICBjb25zdCAkdXJsSW5wdXQgPSAkKCcjYmctdXJsLWlucHV0Jyk7XG5cbiAgICBmdW5jdGlvbiBzZXRDb2xvcihjb2xvcikge1xuICAgICAgICAkYm9keVxuICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIGNvbG9yKVxuICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1pbWFnZScsICdub25lJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0SW1hZ2UoaW1hZ2UpIHtcbiAgICAgICAgJGJvZHlcbiAgICAgICAgICAgIC5jc3MoJ2JhY2tncm91bmQtY29sb3InLCAnJylcbiAgICAgICAgICAgIC5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBgdXJsKFwiJHtpbWFnZX1cIilgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRCRygpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuZGVmID09ICdpbWFnZScgJiYgb3B0aW9ucy5pbWFnZSAhPSAnJykge1xuICAgICAgICAgICAgc2V0SW1hZ2Uob3B0aW9ucy5pbWFnZSlcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLmRlZiA9PSAndXJsJyAmJiBvcHRpb25zLnVybCAhPSAnJykge1xuICAgICAgICAgICAgc2V0SW1hZ2Uob3B0aW9ucy51cmwpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzZXRDb2xvcihvcHRpb25zLmNvbG9yKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gc2V0IHVwIG9wdGlvbnMgY3VycmVudCB2YWx1ZXNcbiAgICAkaW5wdXRzLnZhbChvcHRpb25zLmRlZikuY2hhbmdlKCk7XG4gICAgJGNvbG9ySW5wdXQudmFsKG9wdGlvbnMuY29sb3IpO1xuICAgICR1cmxJbnB1dC52YWwob3B0aW9ucy51cmwpO1xuXG4gICAgLy8gc2V0IHVwIGJnXG4gICAgc2V0QkcoKTtcblxuICAgIC8vIHNldCB1cCBsaXN0ZW5lcnNcbiAgICAkaW5wdXRzLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIG9wdGlvbnMuZGVmID0gJCh0aGlzKS52YWwoKSBhcyBzdHJpbmc7XG4gICAgICAgIHNldEJHKCk7XG4gICAgfSk7XG5cbiAgICAkY29sb3JJbnB1dC5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgY29sb3IgPSAkKHRoaXMpLnZhbCgpIGFzIHN0cmluZztcbiAgICAgICAgc2V0Q29sb3IoY29sb3IpO1xuICAgICAgICBvcHRpb25zLmNvbG9yID0gY29sb3I7XG4gICAgfSk7XG5cbiAgICAkY29sb3JJbnB1dC5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICRpbnB1dHMudmFsKCdjb2xvcicpLmNoYW5nZSgpO1xuICAgIH0pO1xuXG4gICAgJGltYWdlSW5wdXQuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgZmlsZSA9ICQodGhpcykucHJvcChcImZpbGVzXCIpWzBdO1xuICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkZW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbGV0IGltYWdlVXJsID0gcmVhZGVyLnJlc3VsdDtcbiAgICAgICAgICAgIHNldEltYWdlKGltYWdlVXJsKTtcbiAgICAgICAgICAgIG9wdGlvbnMuaW1hZ2UgPSBpbWFnZVVybDtcbiAgICAgICAgICAgICRpbnB1dHMudmFsKCdpbWFnZScpLmNoYW5nZSgpO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoZmlsZSlcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgIH0pO1xuXG4gICAgJHVybElucHV0Lm9uKCdpbnB1dCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgdXJsID0gJCh0aGlzKS52YWwoKSBhcyBzdHJpbmc7XG4gICAgICAgIGlmICh1cmwubWF0Y2goL15odHRwcz86LipcXC4ocG5nfGpwZ3xqcGVnKSQvKSkge1xuICAgICAgICAgICAgc2V0SW1hZ2UodXJsKTtcbiAgICAgICAgICAgIG9wdGlvbnMudXJsID0gdXJsO1xuICAgICAgICAgICAgJGlucHV0cy52YWwoJ3VybCcpLmNoYW5nZSgpO1xuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gdmlzaWJpbGl0eShvcHRpb25zOiBWaXNpYmlsaXR5KSB7XG4gICAgY29uc3QgJGJsb2NrID0gJCgnI29wdC12aXNpYmlsaXR5Jyk7XG4gICAgY29uc3QgJG9wYWNpdHkgPSAkYmxvY2suZmluZCgnZGl2JykuZXEoMCk7XG4gICAgY29uc3QgJGhvdmVyID0gJGJsb2NrLmZpbmQoJ2RpdicpLmVxKDEpO1xuICAgIGNvbnN0ICRvcGFjaXR5SW5wdXQgPSAkb3BhY2l0eS5maW5kKCdpbnB1dCcpO1xuICAgIGNvbnN0ICRob3ZlcklucHV0ID0gJGhvdmVyLmZpbmQoJ2lucHV0Jyk7XG5cbiAgICAkb3BhY2l0eUlucHV0Lm9uKCdjaGFuZ2UgbW91c2Vtb3ZlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCB2YWwgPSAkKHRoaXMpLnZhbCgpIGFzIG51bWJlcjtcbiAgICAgICAgJG9wYWNpdHkuZmluZCgnc3BhbicpLmh0bWwoYE9wYWNpdHk6ICR7dmFsfSVgKTtcbiAgICAgICAgJCgnLmhpZGFibGUnKS5jc3MoJ29wYWNpdHknLCB2YWwgLyAxMDApO1xuICAgICAgICBvcHRpb25zLm9wYWNpdHkgPSB2YWw7XG4gICAgfSk7XG5cbiAgICAkaG92ZXJJbnB1dC5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBvcHRpb25zLnJldmVhbE9uSG92ZXIgPSAkKHRoaXMpLnByb3AoJ2NoZWNrZWQnKTtcbiAgICB9KTtcblxuICAgICQoJy5oaWRhYmxlJykuaG92ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJGhvdmVySW5wdXQuaXMoJzpjaGVja2VkJykpIHtcbiAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xuICAgIH0pO1xuXG4gICAgJG9wYWNpdHlJbnB1dC52YWwob3B0aW9ucy5vcGFjaXR5KS50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICAkaG92ZXJJbnB1dC5wcm9wKCdjaGVja2VkJywgb3B0aW9ucy5yZXZlYWxPbkhvdmVyKTtcbn1cbiIsImltcG9ydCB7RW5naW5lLCBTZWFyY2h9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcIi4vdXRpbHNcIjtcblxuXG5jb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCdzZWFyY2gnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldFVwU2VhcmNoKHNlYXJjaE9wdGlvbnM6IFNlYXJjaCkge1xuICAgIGxvZ2dlci5sb2coJ3NldHRpbmcgc2VhcmNoIGFuZCBzZWFyY2ggZW5naW5lcy4uLicpO1xuICAgIGNvbnN0ICRzZWFyY2hJbnB1dCA9ICQoJyNzZWFyY2gnKTtcbiAgICBjb25zdCAkc2VhcmNoQnV0dG9uID0gJCgnI3NlYXJjaC1idG4nKTtcbiAgICBjb25zdCBlbmdpbmVzID0gc2VhcmNoT3B0aW9ucy5lbmdpbmVzO1xuICAgIGNvbnN0ICRlbmdpbmVJbnB1dHMgPSBzZXRVcEVuZ2luZXMoZW5naW5lcywgc2VhcmNoT3B0aW9ucy5kZWYpO1xuXG4gICAgZnVuY3Rpb24gZG9TZWFyY2godXJsID0gJ2h0dHA6Ly9nb29nbGUuY29tL3NlYXJjaD9xPScpIHtcbiAgICAgICAgbGV0IHF1ZXJ5ID0gJHNlYXJjaElucHV0LnZhbCgpO1xuICAgICAgICBmb3IgKGxldCAkZW5naW5lSW5wdXQgb2YgJGVuZ2luZUlucHV0cykge1xuICAgICAgICAgICAgaWYgKCRlbmdpbmVJbnB1dC5wcm9wKCdjaGVja2VkJykpIHtcbiAgICAgICAgICAgICAgICB1cmwgPSAkZW5naW5lSW5wdXQuYXR0cignZGF0YS11cmwnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocXVlcnkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlc3RVcmwgPSB1cmwgKyBlbmNvZGVVUklDb21wb25lbnQocXVlcnkgYXMgc3RyaW5nKTtcbiAgICAgICAgICAgIGNocm9tZS50YWJzLmdldEN1cnJlbnQoZnVuY3Rpb24gKHRhYikge1xuICAgICAgICAgICAgICAgIGNocm9tZS50YWJzLnVwZGF0ZSh0YWIuaWQsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBkZXN0VXJsLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAkZW5naW5lSW5wdXRzLmZvckVhY2goZnVuY3Rpb24gKCRlbmdpbmVJbnB1dCkge1xuICAgICAgICAkZW5naW5lSW5wdXQuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNlYXJjaElucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICBpZiAoc2VhcmNoT3B0aW9ucy5sYWJlbElzVXJsKVxuICAgICAgICAgICAgICAgIGRvU2VhcmNoKCRlbmdpbmVJbnB1dC5hdHRyKCdkYXRhLXVybCcpKTtcbiAgICAgICAgfSlcbiAgICB9KTtcblxuICAgICRzZWFyY2hJbnB1dC5vbigna2V5cHJlc3MnLCBlID0+IHtcbiAgICAgICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGRvU2VhcmNoKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc2VhcmNoQnV0dG9uLmNsaWNrKCgpID0+IHtcbiAgICAgICAgZG9TZWFyY2goKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2V0VXBFbmdpbmVzKGVuZ2luZXM6IEFycmF5PEVuZ2luZT4sIGRlZjogc3RyaW5nKTogSlF1ZXJ5W10ge1xuICAgIGNvbnN0ICRlbmdpbmVzRm9ybSA9ICQoJyNlbmdpbmVzJyk7XG4gICAgY29uc3QgJHNvdXJjZSA9ICQoXCIjZW5naW5lLXRlbXBsYXRlXCIpLmh0bWwoKTtcbiAgICBjb25zdCBlbmdpbmVUZW1wbGF0ZSA9IEhhbmRsZWJhcnMuY29tcGlsZSgkc291cmNlKTtcbiAgICBjb25zdCAkZW5naW5lcyA9IFtdO1xuICAgIGVuZ2luZXMuZm9yRWFjaChmdW5jdGlvbiAoZW5naW5lKSB7XG4gICAgICAgIGNvbnN0ICRlbmdpbmUgPSAkKGVuZ2luZVRlbXBsYXRlKHtcbiAgICAgICAgICAgIG5hbWU6IGVuZ2luZS5uYW1lLFxuICAgICAgICAgICAgdXJsOiBlbmdpbmUudXJsLFxuICAgICAgICAgICAgY2hlY2tlZDogZW5naW5lLm5hbWUgPT09IGRlZixcbiAgICAgICAgfSkpO1xuICAgICAgICAkZW5naW5lcy5wdXNoKCRlbmdpbmUuZmluZCgnaW5wdXQnKSk7XG4gICAgICAgICRlbmdpbmVzRm9ybS5hcHBlbmQoJGVuZ2luZSlcbiAgICB9KTtcbiAgICByZXR1cm4gJGVuZ2luZXM7XG59XG4iLCJpbXBvcnQge1RhYiwgVGFic30gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7b3BlbkxpbmtGdW5jLCBMb2dnZXJ9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgQm9va21hcmtUcmVlTm9kZSA9IGNocm9tZS5ib29rbWFya3MuQm9va21hcmtUcmVlTm9kZTtcblxuXG5jb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCd0YWJzJyk7XG5cbmludGVyZmFjZSBUaXRsZVVybCB7XG4gICAgdGl0bGU6IHN0cmluZyxcbiAgICB1cmw6IHN0cmluZ1xufVxuXG5jb25zdCB0aWxlVGVtcGxhdGUgPSBIYW5kbGViYXJzLmNvbXBpbGUoJChcIiN0aWxlLXRlbXBsYXRlXCIpLmh0bWwoKSk7XG5jb25zdCBoZWFkZXJUZW1wbGF0ZSA9IEhhbmRsZWJhcnMuY29tcGlsZSgkKFwiI3RhYi10aXRsZS10ZW1wbGF0ZVwiKS5odG1sKCkpO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRVcFRhYnModGFiczogVGFicykge1xuICAgIGxvZ2dlci5sb2coJ3NldHRpbmcgdGFicy4uLicpO1xuICAgIGNvbnN0ICR0YWJzID0gJCgnI3RhYnMnKTtcbiAgICBjb25zdCAkaGVhZGVycyA9ICR0YWJzLmZpbmQoJ3VsJykuZXEoMCk7XG4gICAgY29uc3QgJGNvbnRlbnRzID0gJHRhYnMuZmluZCgndWwnKS5lcSgxKTtcblxuXG4gICAgZm9yIChsZXQgdGFiIG9mIHRhYnMuZW50aXRpZXMpIHtcbiAgICAgICAgY29uc3QgaGVhZGVyID0gaGVhZGVyVGVtcGxhdGUoe1xuICAgICAgICAgICAgbmFtZTogdGFiLm5hbWUsXG4gICAgICAgICAgICBhY3RpdmU6IHRhYi5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IHRhYnMuZGVmLnRvTG93ZXJDYXNlKCksXG4gICAgICAgIH0pO1xuICAgICAgICAkaGVhZGVycy5hcHBlbmQoaGVhZGVyKTtcbiAgICAgICAgY29uc3QgJGNvbnRlbnQgPSAkKCc8bGk+Jyk7XG4gICAgICAgICRjb250ZW50cy5hcHBlbmQoJGNvbnRlbnQpO1xuXG4gICAgICAgIGlmICh0YWIuc3JjID09PSAndG9wJykge1xuICAgICAgICAgICAgc2V0VXBUb3AoJGNvbnRlbnQsIHRhYnMuZ3JpZClcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0YWIuc3JjID09PSAncmVjZW50Jykge1xuICAgICAgICAgICAgc2V0VXBSZWNlbnQoJGNvbnRlbnQsIHRhYnMuZ3JpZClcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNldFVwQm9va21hcmtzKHRhYiwgJGNvbnRlbnQsIHRhYnMuZ3JpZCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFkZFRpbGUoJGNvbnRlbnQ6IEpRdWVyeSwgZGF0YTogVGl0bGVVcmwpIHtcbiAgICBjb25zdCAkdGlsZSA9ICQodGlsZVRlbXBsYXRlKHtcbiAgICAgICAgZmF2aWNvbjogYGNocm9tZTovL2Zhdmljb24vc2l6ZS8xNkAyeC8ke2RhdGEudXJsfWAsXG4gICAgICAgIHRpdGxlOiBkYXRhLnRpdGxlLFxuICAgICAgICB1cmw6IGRlY29kZVVSSUNvbXBvbmVudChkYXRhLnVybClcbiAgICB9KSk7XG5cbiAgICBpZiAoZGF0YS51cmwuc3RhcnRzV2l0aCgnY2hyb21lJykpIHtcbiAgICAgICAgJHRpbGUuY2xpY2sob3BlbkxpbmtGdW5jKGRhdGEudXJsKSk7XG4gICAgfVxuXG4gICAgJGNvbnRlbnQuYXBwZW5kKCR0aWxlKTtcbn1cblxuZnVuY3Rpb24gdHJhdmVyc2UodHJlZTogQm9va21hcmtUcmVlTm9kZSwgcGF0aDogc3RyaW5nW10pOiBCb29rbWFya1RyZWVOb2RlIHtcbiAgICBpZiAocGF0aC5sZW5ndGggPT09IDApXG4gICAgICAgIHJldHVybiB0cmVlO1xuICAgIGZvciAobGV0IGNoaWxkIG9mIHRyZWUuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGNoaWxkLnRpdGxlID09PSBwYXRoWzBdKSB7XG4gICAgICAgICAgICBwYXRoID0gcGF0aC5zbGljZSgxKTtcbiAgICAgICAgICAgIHJldHVybiB0cmF2ZXJzZShjaGlsZCwgcGF0aCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHNldFVwVG9wKCRjb250ZW50OiBKUXVlcnksIHtyb3dzLCBjb2xzfSkge1xuICAgIGNocm9tZS50b3BTaXRlcy5nZXQoZnVuY3Rpb24gKHVybHMpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1cmxzLmxlbmd0aCAmJiBpIDwgcm93cyAqIGNvbHM7IGkrKykge1xuICAgICAgICAgICAgYWRkVGlsZSgkY29udGVudCwgdXJsc1tpXSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2V0VXBSZWNlbnQoJGNvbnRlbnQ6IEpRdWVyeSwge3Jvd3MsIGNvbHN9KSB7XG4gICAgY2hyb21lLnNlc3Npb25zLmdldFJlY2VudGx5Q2xvc2VkKGZ1bmN0aW9uIChzZXNzaW9ucykge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlc3Npb25zLmxlbmd0aCAmJiBpIDwgcm93cyAqIGNvbHM7IGkrKykge1xuICAgICAgICAgICAgaWYgKHNlc3Npb25zW2ldLnRhYilcbiAgICAgICAgICAgICAgICBhZGRUaWxlKCRjb250ZW50LCBzZXNzaW9uc1tpXS50YWIgYXMgVGl0bGVVcmwpO1xuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gc2V0VXBCb29rbWFya3ModGFiOiBUYWIsICRjb250ZW50OiBKUXVlcnksIHtyb3dzLCBjb2xzfSkge1xuICAgIGlmICghdGFiLnNyYy5zdGFydHNXaXRoKCdib29rbWFyazonKSkgcmV0dXJuO1xuICAgIGNvbnN0IHBhdGggPSB0YWIuc3JjLnJlcGxhY2UoL15ib29rbWFyazovLCAnJykuc3BsaXQoJy8nKTtcbiAgICBjaHJvbWUuYm9va21hcmtzLmdldFRyZWUoZnVuY3Rpb24gKHRyZWUpIHtcbiAgICAgICAgY29uc3QgYm9va21hcmtUcmVlID0gdHJlZVswXTtcbiAgICAgICAgY29uc3QgZm9sZGVyID0gdHJhdmVyc2UoYm9va21hcmtUcmVlLCBwYXRoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3BhdGgnLCBwYXRoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2ZvbGRlcicsIGZvbGRlcik7XG4gICAgICAgIGlmIChmb2xkZXIpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZm9sZGVyLmNoaWxkcmVuLmxlbmd0aCAmJiBpIDwgcm93cyAqIGNvbHM7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJvb2ttYXJrID0gZm9sZGVyLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGlmICghYm9va21hcmsuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkVGlsZSgkY29udGVudCwgYm9va21hcmsgYXMgVGl0bGVVcmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pXG59XG4iLCJleHBvcnQgY2xhc3MgTG9nZ2VyIHtcbiAgICBwcml2YXRlIG5hbWU6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgfVxuICAgIGxvZyguLi5tZXNzYWdlOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLm5hbWUgKyAnOicsIC4uLm1lc3NhZ2UpO1xuICAgIH1cbiAgICBlcnJvciguLi5tZXNzYWdlOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMubmFtZSArICc6JywgLi4ubWVzc2FnZSk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3BlbkxpbmtGdW5jKHVybDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuY3RybEtleSB8fFxuICAgICAgICAgICAgZXZlbnQuc2hpZnRLZXkgfHxcbiAgICAgICAgICAgIGV2ZW50Lm1ldGFLZXkgfHwgIC8vIGNtZFxuICAgICAgICAgICAgKGV2ZW50LmJ1dHRvbiAmJiBldmVudC5idXR0b24gPT09IDEpXG4gICAgICAgICkge1xuICAgICAgICAgICAgY2hyb21lLnRhYnMuY3JlYXRlKHt1cmw6IHVybCwgYWN0aXZlOiBmYWxzZX0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY2hyb21lLnRhYnMuZ2V0Q3VycmVudChmdW5jdGlvbiAodGFiKSB7XG4gICAgICAgICAgICAgICAgY2hyb21lLnRhYnMudXBkYXRlKHRhYi5pZCwge3VybDogdXJsfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgbGV0IGNodW5rZWRTdG9yYWdlID0ge1xuICAgIHNldChpdGVtczogT2JqZWN0LCBjYWxsYmFjaz8pIHtcbiAgICAgICAgY29uc3Qgc3RvcmFnZU9iaiA9IHt9O1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gaXRlbXMpIHtcbiAgICAgICAgICAgIGlmICghaXRlbXMuaGFzT3duUHJvcGVydHkoa2V5KSkgY29udGludWU7XG4gICAgICAgICAgICBjb25zdCBvYmplY3RUb1N0b3JlID0gaXRlbXNba2V5XTtcbiAgICAgICAgICAgIGxldCBqc29uc3RyID0gSlNPTi5zdHJpbmdpZnkob2JqZWN0VG9TdG9yZSk7XG4gICAgICAgICAgICBsZXQgaSA9IDA7XG5cbiAgICAgICAgICAgIC8vIHNwbGl0IGpzb25zdHIgaW50byBjaHVua3MgYW5kIHN0b3JlIHRoZW0gaW4gYW4gb2JqZWN0IGluZGV4ZWQgYnkgYGtleV9pYFxuICAgICAgICAgICAgd2hpbGUgKGpzb25zdHIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0ga2V5ICsgXCJfXCIgKyBpKys7XG5cbiAgICAgICAgICAgICAgICAvLyBzaW5jZSB0aGUga2V5IHVzZXMgdXAgc29tZSBwZXItaXRlbSBxdW90YSwgc2VlIGhvdyBtdWNoIGlzIGxlZnQgZm9yIHRoZSB2YWx1ZVxuICAgICAgICAgICAgICAgIC8vIGFsc28gdHJpbSBvZmYgMiBmb3IgcXVvdGVzIGFkZGVkIGJ5IHN0b3JhZ2UtdGltZSBgc3RyaW5naWZ5YFxuICAgICAgICAgICAgICAgIC8vIGxldCB2YWx1ZUxlbmd0aCA9IGNocm9tZS5zdG9yYWdlLnN5bmMuUVVPVEFfQllURVNfUEVSX0lURU0gLSBpbmRleC5sZW5ndGggLSAyO1xuICAgICAgICAgICAgICAgIGxldCB2YWx1ZUxlbmd0aCA9IGNocm9tZS5zdG9yYWdlLnN5bmMuUVVPVEFfQllURVNfUEVSX0lURU0gLyAyO1xuICAgICAgICAgICAgICAgIC8vIGxldCB2YWx1ZUxlbmd0aCA9IDEwMDtcblxuICAgICAgICAgICAgICAgIC8vIHRyaW0gZG93biBzZWdtZW50IHNvIGl0IHdpbGwgYmUgc21hbGwgZW5vdWdoIGV2ZW4gd2hlbiBydW4gdGhyb3VnaCBgSlNPTi5zdHJpbmdpZnlgIGFnYWluIGF0IHN0b3JhZ2UgdGltZVxuICAgICAgICAgICAgICAgIGxldCBzZWdtZW50ID0ganNvbnN0ci5zdWJzdHIoMCwgdmFsdWVMZW5ndGgpO1xuICAgICAgICAgICAgICAgIC8vIHdoaWxlIChKU09OLnN0cmluZ2lmeShzZWdtZW50KS5sZW5ndGggPiB2YWx1ZUxlbmd0aClcbiAgICAgICAgICAgICAgICAvLyAgICAgc2VnbWVudCA9IGpzb25zdHIuc3Vic3RyKDAsIC0tdmFsdWVMZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgc3RvcmFnZU9ialtpbmRleF0gPSBzZWdtZW50O1xuICAgICAgICAgICAgICAgIGpzb25zdHIgPSBqc29uc3RyLnN1YnN0cih2YWx1ZUxlbmd0aCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0b3JhZ2VPYmpba2V5ICsgJ18gc2l6ZSddID0gaTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzdG9yZSBhbGwgdGhlIGNodW5rc1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldChzdG9yYWdlT2JqLCBjYWxsYmFjayk7XG4gICAgfSxcblxuICAgIGdldChrZXk6IHN0cmluZywgY2FsbGJhY2s6IChyZXN1bHQ6IGFueSkgPT4gYW55KSB7XG4gICAgICAgIGNvbnN0IHNpemVLZXkgPSBrZXkgKyAnXyBzaXplJztcblxuICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLmdldChzaXplS2V5LCBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0W3NpemVLZXldKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2NodW5rczonLCByZXN1bHRbc2l6ZUtleV0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlc3VsdFtzaXplS2V5XTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGtleXMucHVzaChrZXkgKyAnXycgKyBpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQoa2V5cywgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBhc3N1bWUgdGhhdCBrZXlzIGFyZSBwcmVzZW50XG4gICAgICAgICAgICAgICAgICAgIGxldCBqc29uU3RyID0ga2V5cy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcmV2ICsgcmVzdWx0W2N1cnJdO1xuICAgICAgICAgICAgICAgICAgICB9LCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHtba2V5XTogSlNPTi5wYXJzZShqc29uU3RyKX0pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh7fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVtb3ZlKGtleSwgY2FsbGJhY2spIHtcbiAgICAgICAgLy8gdG9kb1xuICAgIH1cbn07XG5cbiJdfQ==
