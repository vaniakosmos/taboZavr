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
            image: ''
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
    const $inputs = $('input[name=background]');
    const $colorInput = $('#bg-color-input');
    const $imageInput = $('#bg-image-input');
    $inputs.each(function () {
        const self = $(this);
        console.log(self.val());
        if (self.val() == options.def) {
            self.prop('checked', true);
        }
        if (self.val() == 'color') {
            $('#bg-color-input').val(options.color);
        }
    });
    function setColor(color) {
        $body.css('background-color', color).css('background-image', 'none');
    }
    function setImage(image) {
        $body.css('background-color', '').css('background-image', `url("${image}")`);
    }
    if (options.def == 'image' && options.image != '') {
        setImage(options.image);
    } else {
        setColor(options.color);
    }
    $inputs.change(function () {
        const self = $(this);
        if (self.prop('checked')) {
            console.log('changed default:', self.val());
            options.def = self.val();
            if (self.val() == 'image' && options.image != '') {
                setImage($imageInput.val());
            } else {
                setColor($colorInput.val());
            }
        }
    });
    $colorInput.change(function () {
        let color = $(this).val();
        $body.css('background-color', color).css('background-image', 'none');
        options.color = color;
        options.def = 'color';
    });
    $imageInput.change(function () {
        const file = $(this).prop("files")[0];
        const reader = new FileReader();
        reader.onloadend = function () {
            let imageUrl = reader.result;
            $body.css('background-color', '').css('background-image', `url("${imageUrl}")`);
            options.image = imageUrl;
            options.def = 'image';
        };
        if (file) reader.readAsDataURL(file);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvYXBwLnRzIiwic3JjL3RzL2RlZmF1bHRPcHRpb25zLnRzIiwic3JjL3RzL25hdmJhci50cyIsInNyYy90cy9vcHRpb25zLnRzIiwic3JjL3RzL3NlYXJjaC50cyIsInNyYy90cy90YWJzLnRzIiwic3JjL3RzL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FDQ0EseUJBQW9DO0FBQ3BDLDBCQUF1QztBQUN2Qyx5QkFBb0M7QUFDcEMsdUJBQWdDO0FBRWhDLGlDQUE2QztBQUM3Qyx3QkFBOEI7QUFHOUIsTUFBTSxBQUFNLFNBQUcsSUFBSSxRQUFNLE9BQUMsQUFBSyxBQUFDLEFBQUM7QUFDakMsQUFBTSxPQUFDLEFBQUcsSUFBQyxBQUFRLEFBQUMsQUFBQztBQUVyQjtBQUNJLEFBQU0sZUFBSyxBQUFPLFFBQUMsVUFBVSxBQUFPO0FBQ2hDLEFBQU0sZUFBQyxBQUFPLFFBQUMsQUFBSyxNQUFDLEFBQUcsSUFBQyxBQUFTLFdBQUUsVUFBVSxBQUFNO0FBQ2hELGdCQUFJLEFBQWdCLEFBQUM7QUFDckIsQUFBRSxBQUFDLGdCQUFDLEFBQU0sT0FBQyxBQUFTLEFBQUMsQUFBQyxZQUFDLEFBQUM7QUFDcEIsQUFBTywwQkFBRyxBQUFNLE9BQUMsQUFBUyxBQUFZLEFBQUM7QUFDdkMsQUFBTSx1QkFBQyxBQUFHLElBQUMsQUFBbUMsQUFBQyxBQUFDO0FBQ2hELEFBQU0sdUJBQUMsQUFBRyxJQUFDLEFBQVUsWUFBRSxBQUFPLEFBQUMsQUFBQztBQUNoQyxBQUFPLHdCQUFDLEFBQU8sQUFBQyxBQUNwQjtBQUFDLEFBQ0QsQUFBSSxtQkFBQyxBQUFDO0FBQ0YsQUFBTywwQkFBRyxBQUFJLEtBQUMsQUFBSyxNQUFDLEFBQUksS0FBQyxBQUFTLFVBQUMsaUJBQWMsQUFBQyxBQUFDLEFBQUM7QUFDckQsQUFBTSx1QkFBQyxBQUFHLElBQUMsQUFBa0QsQUFBQyxB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QUFTLFdBQUUsQUFBTSxPQUFDLEFBQU8sQUFBQyxBQUFDLEFBQUM7QUFDeEMsc0JBQU0sQUFBSSxPQUFHLEFBQUUsQUFBQztBQUNoQixBQUFHLEFBQUMscUJBQUMsSUFBSSxBQUFDLElBQUcsQUFBQyxHQUFFLEFBQUMsSUFBRyxBQUFNLE9BQUMsQUFBTyxBQUFDLFVBQUUsQUFBQyxBQUFFLEtBQUUsQUFBQztBQUN2QyxBQUFJLHlCQUFDLEFBQUksS0FBQyxBQUFHLE1BQUcsQUFBRyxNQUFHLEFBQUMsQUFBQyxBQUFDLEFBQzdCO0FBQUM7QUFDRCxBQUFNLHVCQUFDLEFBQU8sUUFBQyxBQUFJLEtBQUMsQUFBRyxJQUFDLEFBQUksTUFBRSxVQUFVLEFBQU07QUFFMUMsd0JBQUksQUFBTyxlQUFRLEFBQU0sT0FBQyxVQUFVLEFBQUksTUFBRSxBQUFJO0FBQzFDLEFBQU0sK0JBQUMsQUFBSSxPQUFHLEFBQU0sT0FBQyxBQUFJLEFBQUMsQUFBQyxBQUMvQjtBQUFDLHFCQUZhLEFBQUksRUFFZixBQUFFLEFBQUMsQUFBQztBQUNQLEFBQVEsNkJBQUMsRUFBQyxDQUFDLEFBQUcsQUFBQyxNQUFFLEFBQUksS0FBQyxBQUFLLE1BQUMsQUFBTyxBQUFDLEFBQUMsQUFBQyxBQUFDLEFBQzNDO0FBQUMsQUFBQyxBQUNOO0FBQUMsQUFDRCxBQUFJLG1CQUFDLEFBQUM7QUFDRixBQUFRLHlCQUFDLEFBQUUsQUFBQyxBQUFDLEFBQ2pCO0FBQUMsQUFDTDtBQUFDLEFBQUMsQUFBQyxBQUNQO0FBQUM7QUFDRCxBQUFNLFdBQUMsQUFBRyxLQUFFLEFBQVEsVUFFcEIsQ0FBQyxBQUNKLEFBQUM7QUE1RDBCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7T3B0aW9uc30gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7c2V0VXBOYXZiYXJ9IGZyb20gJy4vbmF2YmFyJ1xuaW1wb3J0IHtzZXRVcE9wdGlvbnN9IGZyb20gXCIuL29wdGlvbnNcIjtcbmltcG9ydCB7c2V0VXBTZWFyY2h9IGZyb20gJy4vc2VhcmNoJ1xuaW1wb3J0IHtzZXRVcFRhYnN9IGZyb20gJy4vdGFicydcblxuaW1wb3J0IGRlZmF1bHRPcHRpb25zIGZyb20gJy4vZGVmYXVsdE9wdGlvbnMnXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSAnLi91dGlscydcblxuXG5jb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCdhcHAnKTtcbmxvZ2dlci5sb2coJ2luc2lkZScpO1xuXG5mdW5jdGlvbiBwcm9taXNlT3B0aW9ucygpOiBQcm9taXNlPE9wdGlvbnM+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCdvcHRpb25zJywgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgbGV0IG9wdGlvbnM6IE9wdGlvbnM7XG4gICAgICAgICAgICBpZiAocmVzdWx0WydvcHRpb25zJ10pIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gcmVzdWx0WydvcHRpb25zJ10gYXMgT3B0aW9ucztcbiAgICAgICAgICAgICAgICBsb2dnZXIubG9nKCd1c2luZyBvcHRpb25zIGxvYWRlZCBmcm9tIHN0b3JhZ2UnKTtcbiAgICAgICAgICAgICAgICBsb2dnZXIubG9nKCdvcHRpb25zOicsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUob3B0aW9ucylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGRlZmF1bHRPcHRpb25zKSk7ICAvLyBkZWVwIGNvcHlcbiAgICAgICAgICAgICAgICBsb2dnZXIubG9nKCd1c2luZyBkZWZhdWx0IG9wdGlvbnMgYW5kIHNhdmUgdGhlbSBpbnRvIHN0b3JhZ2UnKTtcbiAgICAgICAgICAgICAgICBsb2dnZXIubG9nKCdvcHRpb25zOicsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7J29wdGlvbnMnOiBvcHRpb25zfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG9wdGlvbnMpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSk7XG59XG5cbnByb21pc2VPcHRpb25zKCkudGhlbihmdW5jdGlvbiAob3B0aW9uczogT3B0aW9ucykge1xuICAgIHNldFRpbWVvdXQoc2V0VXBOYXZiYXIsIDApO1xuICAgIHNldFRpbWVvdXQoc2V0VXBPcHRpb25zLCAwLCBvcHRpb25zKTtcbiAgICBzZXRUaW1lb3V0KHNldFVwU2VhcmNoLCAwLCBvcHRpb25zLnNlYXJjaCk7XG4gICAgc2V0VGltZW91dChzZXRVcFRhYnMsIDAsIG9wdGlvbnMudGFicyk7XG59KTtcbiIsImltcG9ydCB7T3B0aW9uc30gZnJvbSBcIi4vdHlwZXNcIjtcblxuXG5sZXQgb3B0aW9uczogT3B0aW9ucyA9IHtcbiAgICB0aGVtZToge1xuICAgICAgICB0aXRsZTogJ05ldyB0YWInLFxuICAgICAgICBoZWFkZXI6ICdoZWxsbyBtYSBkdWRlJyxcbiAgICAgICAgYmFja2dyb3VuZDoge1xuICAgICAgICAgICAgZGVmOiAnY29sb3InLFxuICAgICAgICAgICAgY29sb3I6ICcjYThhOGE4JyxcbiAgICAgICAgICAgIGltYWdlOiAnJyxcbiAgICAgICAgfSxcbiAgICAgICAgdmlzaWJpbGl0eToge1xuICAgICAgICAgICAgb3BhY2l0eTogMTAwLFxuICAgICAgICAgICAgcmV2ZWFsT25Ib3ZlcjogdHJ1ZSxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2VhcmNoOiB7XG4gICAgICAgIGRlZjogJ2dvb2dsZScsXG4gICAgICAgIGVuZ2luZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ29vZ2xlJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwOi8vZ29vZ2xlLmNvbS9zZWFyY2g/cT0nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaW1hZ2VzJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL3d3dy5nb29nbGUuY29tL2ltYWdlcz9xPScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0cmFrdCcsXG4gICAgICAgICAgICAgICAgdXJsOiAnaHR0cDovL3RyYWt0LnR2L3NlYXJjaD9xPScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd3aWtpJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL2VuLndpa2lwZWRpYS5vcmcvdy9pbmRleC5waHA/c2VhcmNoPScsXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBsYWJlbElzVXJsOiBmYWxzZSxcbiAgICB9LFxuICAgIHRhYnM6IHtcbiAgICAgICAgZGVmOiAncmVjZW50JyxcbiAgICAgICAgZ3JpZDoge1xuICAgICAgICAgICAgY29sczogNSxcbiAgICAgICAgICAgIHJvd3M6IDUsXG4gICAgICAgIH0sXG4gICAgICAgIGVudGl0aWVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0ZhdicsXG4gICAgICAgICAgICAgICAgc3JjOiAnYm9va21hcms6Qm9va21hcmtzIEJhcicsXG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ1RvcCcsXG4gICAgICAgICAgICAgICAgc3JjOiAndG9wJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ1JlY2VudCcsXG4gICAgICAgICAgICAgICAgc3JjOiAncmVjZW50JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgb3B0aW9ucztcbiIsImltcG9ydCB7b3BlbkxpbmtGdW5jLCBMb2dnZXJ9IGZyb20gXCIuL3V0aWxzXCI7XG5cblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignbmF2YmFyJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRVcE5hdmJhcigpIHtcbiAgICBzZXRUaW1lb3V0KHNldFVwTmF2VXJscywgMCk7XG4gICAgc2V0VGltZW91dChzZXRVcEFkZG9ucywgMCk7XG59XG5cbmZ1bmN0aW9uIHNldFVwTmF2VXJscygpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIHVybHMuLi4nKTtcbiAgICAkKCcjaGlzdG9yeScpLmNsaWNrKG9wZW5MaW5rRnVuYygnY2hyb21lOi8vaGlzdG9yeS8nKSk7XG4gICAgJCgnI2Jvb2ttYXJrcycpLmNsaWNrKG9wZW5MaW5rRnVuYygnY2hyb21lOi8vYm9va21hcmtzLycpKTtcbiAgICAkKCcjZXh0ZW5zaW9ucycpLmNsaWNrKG9wZW5MaW5rRnVuYygnY2hyb21lOi8vZXh0ZW5zaW9ucy8nKSk7XG4gICAgJCgnI2FsbC1hcHBzJykuY2xpY2sob3BlbkxpbmtGdW5jKCdjaHJvbWU6Ly9hcHBzLycpKTtcbn1cblxuXG5mdW5jdGlvbiBzZXRVcEFkZG9ucygpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIGFkZC1vbnMuLi4nKTtcbiAgICBjb25zdCAkc291cmNlID0gJChcIiNhcHAtdGVtcGxhdGVcIikuaHRtbCgpO1xuICAgIGNvbnN0IGFwcFRlbXBsYXRlID0gSGFuZGxlYmFycy5jb21waWxlKCRzb3VyY2UpO1xuXG4gICAgY2hyb21lLm1hbmFnZW1lbnQuZ2V0QWxsKGZ1bmN0aW9uIChhZGRvbnMpIHtcbiAgICAgICAgY29uc3QgJGFwcHNfbGlzdCA9ICQoJyNhcHBzJyk7XG4gICAgICAgIGZvciAobGV0IGFkZG9uIG9mIGFkZG9ucykge1xuICAgICAgICAgICAgaWYgKGFkZG9uLnR5cGUuZW5kc1dpdGgoJ19hcHAnKSkge1xuICAgICAgICAgICAgICAgIGxldCBpY29uID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKGFkZG9uLmljb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGljb24gPSBhZGRvbi5pY29uc1thZGRvbi5pY29ucy5sZW5ndGgtMV0udXJsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBhcHBIdG1sID0gYXBwVGVtcGxhdGUoe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBhZGRvbi5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBpY29uOiBpY29uLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0ICRjbGlja2FibGVBcHAgPSAkKGFwcEh0bWwpLmNsaWNrKCgpID0+IGNocm9tZS5tYW5hZ2VtZW50LmxhdW5jaEFwcChhZGRvbi5pZCkpO1xuICAgICAgICAgICAgICAgICRhcHBzX2xpc3QuYXBwZW5kKCRjbGlja2FibGVBcHApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG4iLCJpbXBvcnQge0JhY2tncm91bmQsIE9wdGlvbnMsIFRoZW1lLCBWaXNpYmlsaXR5fSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCIuL3V0aWxzXCI7XG5cblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignb3B0aW9ucycpO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0VXBPcHRpb25zKG9wdGlvbnM6IE9wdGlvbnMpIHtcbiAgICBzZXRBY3Rpb25zKG9wdGlvbnMpO1xuICAgIHNldFVwVGhlbWUob3B0aW9ucy50aGVtZSlcbn1cblxuZnVuY3Rpb24gZmFkZUluT3V0KCR0YXJnZXQ6IEpRdWVyeSwgaHRtbCwgZHVyYXRpb24gPSAxMDAwKSB7XG4gICAgJHRhcmdldFxuICAgICAgICAuaHRtbChodG1sKVxuICAgICAgICAuYWRkQ2xhc3MoJ3VrLWFuaW1hdGlvbi1zbGlkZS10b3Atc21hbGwnKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ3VrLWFuaW1hdGlvbi1zbGlkZS1ib3R0b20tc21hbGwgdWstYW5pbWF0aW9uLXJldmVyc2UnKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHRhcmdldFxuICAgICAgICAgICAgLnJlbW92ZSgndWstYW5pbWF0aW9uLXNsaWRlLXRvcC1zbWFsbCcpXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ3VrLWFuaW1hdGlvbi1zbGlkZS1ib3R0b20tc21hbGwgdWstYW5pbWF0aW9uLXJldmVyc2UnKTtcblxuICAgIH0sIGR1cmF0aW9uKVxufVxuXG5mdW5jdGlvbiBzZXRBY3Rpb25zKG9wdGlvbnMpIHtcbiAgICBsb2dnZXIubG9nKCdzZXR0aW5nIHNhdmUgYW5kIHNldCBkZWZhdWx0IGJ1dHRvbnMuLi4nKTtcbiAgICBjb25zdCAkYWN0aW9uc0luZm8gPSAkKCcjYWN0aW9ucy1pbmZvJyk7XG5cbiAgICAkKCcjc2F2ZS1zZXR0aW5ncycpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMudGhlbWUuYmFja2dyb3VuZC5kZWYgIT0gJ2ltYWdlJylcbiAgICAgICAgICAgIG9wdGlvbnMudGhlbWUuYmFja2dyb3VuZC5pbWFnZSA9ICcnO1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeydvcHRpb25zJzogb3B0aW9uc30sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvZ2dlci5sb2coJ3NhdmVkJyk7XG4gICAgICAgICAgICBmYWRlSW5PdXQoJGFjdGlvbnNJbmZvLCAnc2F2ZWQnLCAxNTAwKVxuICAgICAgICB9KVxuICAgIH0pO1xuXG4gICAgJCgnI3NldC1kZWZhdWx0LW1vZGFsJykuZmluZCgnYnV0dG9uW25hbWU9XCJva1wiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuY2xlYXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9nZ2VyLmxvZygnY2xlYXJlZCBzdG9yYWdlJyk7XG4gICAgICAgICAgICAvLyB0b2RvOiBhcHBseSBkZWZhdWx0IG9wdGlvbnMgdy9vIHJlbG9hZGluZyAoYnV0IG5lZWQgdG8gZXhjbHVkZSBmcm9tIHJlbG9hZGluZyBldmVudCBsaXN0ZW5lcnMgYXBwbGllcnMpXG4gICAgICAgICAgICBjaHJvbWUudGFicy5nZXRDdXJyZW50KGZ1bmN0aW9uKHRhYikge1xuICAgICAgICAgICAgICAgIGNocm9tZS50YWJzLnJlbG9hZCh0YWIuaWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzZXRVcFRoZW1lKHRoZW1lOiBUaGVtZSkge1xuICAgIGxvZ2dlci5sb2coJ3NldHRpbmcgdmlzaWJpbGl0eSBhbmQgYmFja2dyb3VuZC4uJyk7XG4gICAgdmlzaWJpbGl0eSh0aGVtZS52aXNpYmlsaXR5KTtcbiAgICBiYWNrZ3JvdW5kKHRoZW1lLmJhY2tncm91bmQpXG59XG5cbmZ1bmN0aW9uIGJhY2tncm91bmQob3B0aW9uczogQmFja2dyb3VuZCkge1xuICAgIGNvbnN0ICRib2R5ID0gJCgnYm9keScpO1xuICAgIGNvbnN0ICRpbnB1dHMgPSAkKCdpbnB1dFtuYW1lPWJhY2tncm91bmRdJyk7XG5cbiAgICBjb25zdCAkY29sb3JJbnB1dCA9ICQoJyNiZy1jb2xvci1pbnB1dCcpO1xuICAgIGNvbnN0ICRpbWFnZUlucHV0ID0gJCgnI2JnLWltYWdlLWlucHV0Jyk7XG5cblxuICAgICRpbnB1dHMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSAkKHRoaXMpO1xuICAgICAgICBjb25zb2xlLmxvZyhzZWxmLnZhbCgpKTtcbiAgICAgICAgaWYgKHNlbGYudmFsKCkgPT0gb3B0aW9ucy5kZWYpIHtcbiAgICAgICAgICAgIHNlbGYucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZWxmLnZhbCgpID09ICdjb2xvcicpIHtcbiAgICAgICAgICAgICQoJyNiZy1jb2xvci1pbnB1dCcpLnZhbChvcHRpb25zLmNvbG9yKVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBzZXRDb2xvcihjb2xvcikge1xuICAgICAgICAkYm9keVxuICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIGNvbG9yKVxuICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1pbWFnZScsICdub25lJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0SW1hZ2UoaW1hZ2UpIHtcbiAgICAgICAgJGJvZHlcbiAgICAgICAgICAgIC5jc3MoJ2JhY2tncm91bmQtY29sb3InLCAnJylcbiAgICAgICAgICAgIC5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBgdXJsKFwiJHtpbWFnZX1cIilgKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5kZWYgPT0gJ2ltYWdlJyAmJiBvcHRpb25zLmltYWdlICE9ICcnKSB7XG4gICAgICAgIHNldEltYWdlKG9wdGlvbnMuaW1hZ2UpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBzZXRDb2xvcihvcHRpb25zLmNvbG9yKVxuICAgIH1cblxuICAgICRpbnB1dHMuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9ICQodGhpcyk7XG4gICAgICAgIGlmIChzZWxmLnByb3AoJ2NoZWNrZWQnKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2NoYW5nZWQgZGVmYXVsdDonLCBzZWxmLnZhbCgpKTtcbiAgICAgICAgICAgIG9wdGlvbnMuZGVmID0gc2VsZi52YWwoKSBhcyBzdHJpbmc7XG5cbiAgICAgICAgICAgIGlmIChzZWxmLnZhbCgpID09ICdpbWFnZScgJiYgb3B0aW9ucy5pbWFnZSAhPSAnJykge1xuICAgICAgICAgICAgICAgIHNldEltYWdlKCRpbWFnZUlucHV0LnZhbCgpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2V0Q29sb3IoJGNvbG9ySW5wdXQudmFsKCkpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgJGNvbG9ySW5wdXQuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IGNvbG9yID0gJCh0aGlzKS52YWwoKSBhcyBzdHJpbmc7XG4gICAgICAgICRib2R5XG4gICAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgY29sb3IpXG4gICAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgJ25vbmUnKTtcbiAgICAgICAgb3B0aW9ucy5jb2xvciA9IGNvbG9yO1xuICAgICAgICBvcHRpb25zLmRlZiA9ICdjb2xvcic7XG4gICAgfSk7XG5cbiAgICAkaW1hZ2VJbnB1dC5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBmaWxlID0gJCh0aGlzKS5wcm9wKFwiZmlsZXNcIilbMF07XG4gICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWRlbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsZXQgaW1hZ2VVcmwgPSByZWFkZXIucmVzdWx0O1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coaW1hZ2VVcmwpO1xuICAgICAgICAgICAgJGJvZHlcbiAgICAgICAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgJycpXG4gICAgICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1pbWFnZScsIGB1cmwoXCIke2ltYWdlVXJsfVwiKWApO1xuICAgICAgICAgICAgb3B0aW9ucy5pbWFnZSA9IGltYWdlVXJsO1xuICAgICAgICAgICAgb3B0aW9ucy5kZWYgPSAnaW1hZ2UnO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoZmlsZSlcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiB2aXNpYmlsaXR5KG9wdGlvbnM6IFZpc2liaWxpdHkpIHtcbiAgICBjb25zdCAkYmxvY2sgPSAkKCcjb3B0LXZpc2liaWxpdHknKTtcbiAgICBjb25zdCAkb3BhY2l0eSA9ICRibG9jay5maW5kKCdkaXYnKS5lcSgwKTtcbiAgICBjb25zdCAkaG92ZXIgPSAkYmxvY2suZmluZCgnZGl2JykuZXEoMSk7XG4gICAgY29uc3QgJG9wYWNpdHlJbnB1dCA9ICRvcGFjaXR5LmZpbmQoJ2lucHV0Jyk7XG4gICAgY29uc3QgJGhvdmVySW5wdXQgPSAkaG92ZXIuZmluZCgnaW5wdXQnKTtcblxuICAgICRvcGFjaXR5SW5wdXQub24oJ2NoYW5nZSBtb3VzZW1vdmUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9ICQodGhpcykudmFsKCkgYXMgbnVtYmVyO1xuICAgICAgICAkb3BhY2l0eS5maW5kKCdzcGFuJykuaHRtbChgT3BhY2l0eTogJHt2YWx9JWApO1xuICAgICAgICAkKCcuaGlkYWJsZScpLmNzcygnb3BhY2l0eScsIHZhbCAvIDEwMCk7XG4gICAgICAgIG9wdGlvbnMub3BhY2l0eSA9IHZhbDtcbiAgICB9KTtcblxuICAgICRob3ZlcklucHV0Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG9wdGlvbnMucmV2ZWFsT25Ib3ZlciA9ICQodGhpcykucHJvcCgnY2hlY2tlZCcpO1xuICAgIH0pO1xuXG4gICAgJCgnLmhpZGFibGUnKS5ob3ZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICgkaG92ZXJJbnB1dC5pcygnOmNoZWNrZWQnKSkge1xuICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygndmlzaWJsZScpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xuICAgICAgICB9XG4gICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XG4gICAgfSk7XG5cbiAgICAkb3BhY2l0eUlucHV0LnZhbChvcHRpb25zLm9wYWNpdHkpLnRyaWdnZXIoJ2NoYW5nZScpO1xuICAgICRob3ZlcklucHV0LnByb3AoJ2NoZWNrZWQnLCBvcHRpb25zLnJldmVhbE9uSG92ZXIpO1xufVxuIiwiaW1wb3J0IHtFbmdpbmUsIFNlYXJjaH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7TG9nZ2VyfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5cbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ3NlYXJjaCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0VXBTZWFyY2goc2VhcmNoT3B0aW9uczogU2VhcmNoKSB7XG4gICAgbG9nZ2VyLmxvZygnc2V0dGluZyBzZWFyY2ggYW5kIHNlYXJjaCBlbmdpbmVzLi4uJyk7XG4gICAgY29uc3QgJHNlYXJjaElucHV0ID0gJCgnI3NlYXJjaCcpO1xuICAgIGNvbnN0ICRzZWFyY2hCdXR0b24gPSAkKCcjc2VhcmNoLWJ0bicpO1xuICAgIGNvbnN0IGVuZ2luZXMgPSBzZWFyY2hPcHRpb25zLmVuZ2luZXM7XG4gICAgY29uc3QgJGVuZ2luZUlucHV0cyA9IHNldFVwRW5naW5lcyhlbmdpbmVzLCBzZWFyY2hPcHRpb25zLmRlZik7XG5cbiAgICBmdW5jdGlvbiBkb1NlYXJjaCh1cmwgPSAnaHR0cDovL2dvb2dsZS5jb20vc2VhcmNoP3E9Jykge1xuICAgICAgICBsZXQgcXVlcnkgPSAkc2VhcmNoSW5wdXQudmFsKCk7XG4gICAgICAgIGZvciAobGV0ICRlbmdpbmVJbnB1dCBvZiAkZW5naW5lSW5wdXRzKSB7XG4gICAgICAgICAgICBpZiAoJGVuZ2luZUlucHV0LnByb3AoJ2NoZWNrZWQnKSkge1xuICAgICAgICAgICAgICAgIHVybCA9ICRlbmdpbmVJbnB1dC5hdHRyKCdkYXRhLXVybCcpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChxdWVyeSkge1xuICAgICAgICAgICAgY29uc3QgZGVzdFVybCA9IHVybCArIGVuY29kZVVSSUNvbXBvbmVudChxdWVyeSBhcyBzdHJpbmcpO1xuICAgICAgICAgICAgY2hyb21lLnRhYnMuZ2V0Q3VycmVudChmdW5jdGlvbiAodGFiKSB7XG4gICAgICAgICAgICAgICAgY2hyb21lLnRhYnMudXBkYXRlKHRhYi5pZCwge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IGRlc3RVcmwsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICRlbmdpbmVJbnB1dHMuZm9yRWFjaChmdW5jdGlvbiAoJGVuZ2luZUlucHV0KSB7XG4gICAgICAgICRlbmdpbmVJbnB1dC5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2VhcmNoSW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgIGlmIChzZWFyY2hPcHRpb25zLmxhYmVsSXNVcmwpXG4gICAgICAgICAgICAgICAgZG9TZWFyY2goJGVuZ2luZUlucHV0LmF0dHIoJ2RhdGEtdXJsJykpO1xuICAgICAgICB9KVxuICAgIH0pO1xuXG4gICAgJHNlYXJjaElucHV0Lm9uKCdrZXlwcmVzcycsIGUgPT4ge1xuICAgICAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZG9TZWFyY2goKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzZWFyY2hCdXR0b24uY2xpY2soKCkgPT4ge1xuICAgICAgICBkb1NlYXJjaCgpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzZXRVcEVuZ2luZXMoZW5naW5lczogQXJyYXk8RW5naW5lPiwgZGVmOiBzdHJpbmcpOiBKUXVlcnlbXSB7XG4gICAgY29uc3QgJGVuZ2luZXNGb3JtID0gJCgnI2VuZ2luZXMnKTtcbiAgICBjb25zdCAkc291cmNlID0gJChcIiNlbmdpbmUtdGVtcGxhdGVcIikuaHRtbCgpO1xuICAgIGNvbnN0IGVuZ2luZVRlbXBsYXRlID0gSGFuZGxlYmFycy5jb21waWxlKCRzb3VyY2UpO1xuICAgIGNvbnN0ICRlbmdpbmVzID0gW107XG4gICAgZW5naW5lcy5mb3JFYWNoKGZ1bmN0aW9uIChlbmdpbmUpIHtcbiAgICAgICAgY29uc3QgJGVuZ2luZSA9ICQoZW5naW5lVGVtcGxhdGUoe1xuICAgICAgICAgICAgbmFtZTogZW5naW5lLm5hbWUsXG4gICAgICAgICAgICB1cmw6IGVuZ2luZS51cmwsXG4gICAgICAgICAgICBjaGVja2VkOiBlbmdpbmUubmFtZSA9PT0gZGVmLFxuICAgICAgICB9KSk7XG4gICAgICAgICRlbmdpbmVzLnB1c2goJGVuZ2luZS5maW5kKCdpbnB1dCcpKTtcbiAgICAgICAgJGVuZ2luZXNGb3JtLmFwcGVuZCgkZW5naW5lKVxuICAgIH0pO1xuICAgIHJldHVybiAkZW5naW5lcztcbn1cbiIsImltcG9ydCB7VGFiLCBUYWJzfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHtvcGVuTGlua0Z1bmMsIExvZ2dlcn0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCBCb29rbWFya1RyZWVOb2RlID0gY2hyb21lLmJvb2ttYXJrcy5Cb29rbWFya1RyZWVOb2RlO1xuXG5cbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ3RhYnMnKTtcblxuaW50ZXJmYWNlIFRpdGxlVXJsIHtcbiAgICB0aXRsZTogc3RyaW5nLFxuICAgIHVybDogc3RyaW5nXG59XG5cbmNvbnN0IHRpbGVUZW1wbGF0ZSA9IEhhbmRsZWJhcnMuY29tcGlsZSgkKFwiI3RpbGUtdGVtcGxhdGVcIikuaHRtbCgpKTtcbmNvbnN0IGhlYWRlclRlbXBsYXRlID0gSGFuZGxlYmFycy5jb21waWxlKCQoXCIjdGFiLXRpdGxlLXRlbXBsYXRlXCIpLmh0bWwoKSk7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFVwVGFicyh0YWJzOiBUYWJzKSB7XG4gICAgbG9nZ2VyLmxvZygnc2V0dGluZyB0YWJzLi4uJyk7XG4gICAgY29uc3QgJHRhYnMgPSAkKCcjdGFicycpO1xuICAgIGNvbnN0ICRoZWFkZXJzID0gJHRhYnMuZmluZCgndWwnKS5lcSgwKTtcbiAgICBjb25zdCAkY29udGVudHMgPSAkdGFicy5maW5kKCd1bCcpLmVxKDEpO1xuXG5cbiAgICBmb3IgKGxldCB0YWIgb2YgdGFicy5lbnRpdGllcykge1xuICAgICAgICBjb25zdCBoZWFkZXIgPSBoZWFkZXJUZW1wbGF0ZSh7XG4gICAgICAgICAgICBuYW1lOiB0YWIubmFtZSxcbiAgICAgICAgICAgIGFjdGl2ZTogdGFiLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gdGFicy5kZWYudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgfSk7XG4gICAgICAgICRoZWFkZXJzLmFwcGVuZChoZWFkZXIpO1xuICAgICAgICBjb25zdCAkY29udGVudCA9ICQoJzxsaT4nKTtcbiAgICAgICAgJGNvbnRlbnRzLmFwcGVuZCgkY29udGVudCk7XG5cbiAgICAgICAgaWYgKHRhYi5zcmMgPT09ICd0b3AnKSB7XG4gICAgICAgICAgICBzZXRVcFRvcCgkY29udGVudCwgdGFicy5ncmlkKVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRhYi5zcmMgPT09ICdyZWNlbnQnKSB7XG4gICAgICAgICAgICBzZXRVcFJlY2VudCgkY29udGVudCwgdGFicy5ncmlkKVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2V0VXBCb29rbWFya3ModGFiLCAkY29udGVudCwgdGFicy5ncmlkKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gYWRkVGlsZSgkY29udGVudDogSlF1ZXJ5LCBkYXRhOiBUaXRsZVVybCkge1xuICAgIGNvbnN0ICR0aWxlID0gJCh0aWxlVGVtcGxhdGUoe1xuICAgICAgICBmYXZpY29uOiBgY2hyb21lOi8vZmF2aWNvbi9zaXplLzE2QDJ4LyR7ZGF0YS51cmx9YCxcbiAgICAgICAgdGl0bGU6IGRhdGEudGl0bGUsXG4gICAgICAgIHVybDogZGVjb2RlVVJJQ29tcG9uZW50KGRhdGEudXJsKVxuICAgIH0pKTtcblxuICAgIGlmIChkYXRhLnVybC5zdGFydHNXaXRoKCdjaHJvbWUnKSkge1xuICAgICAgICAkdGlsZS5jbGljayhvcGVuTGlua0Z1bmMoZGF0YS51cmwpKTtcbiAgICB9XG5cbiAgICAkY29udGVudC5hcHBlbmQoJHRpbGUpO1xufVxuXG5mdW5jdGlvbiB0cmF2ZXJzZSh0cmVlOiBCb29rbWFya1RyZWVOb2RlLCBwYXRoOiBzdHJpbmdbXSk6IEJvb2ttYXJrVHJlZU5vZGUge1xuICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMClcbiAgICAgICAgcmV0dXJuIHRyZWU7XG4gICAgZm9yIChsZXQgY2hpbGQgb2YgdHJlZS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoY2hpbGQudGl0bGUgPT09IHBhdGhbMF0pIHtcbiAgICAgICAgICAgIHBhdGggPSBwYXRoLnNsaWNlKDEpO1xuICAgICAgICAgICAgcmV0dXJuIHRyYXZlcnNlKGNoaWxkLCBwYXRoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gc2V0VXBUb3AoJGNvbnRlbnQ6IEpRdWVyeSwge3Jvd3MsIGNvbHN9KSB7XG4gICAgY2hyb21lLnRvcFNpdGVzLmdldChmdW5jdGlvbiAodXJscykge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHVybHMubGVuZ3RoICYmIGkgPCByb3dzICogY29sczsgaSsrKSB7XG4gICAgICAgICAgICBhZGRUaWxlKCRjb250ZW50LCB1cmxzW2ldKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzZXRVcFJlY2VudCgkY29udGVudDogSlF1ZXJ5LCB7cm93cywgY29sc30pIHtcbiAgICBjaHJvbWUuc2Vzc2lvbnMuZ2V0UmVjZW50bHlDbG9zZWQoZnVuY3Rpb24gKHNlc3Npb25zKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2Vzc2lvbnMubGVuZ3RoICYmIGkgPCByb3dzICogY29sczsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoc2Vzc2lvbnNbaV0udGFiKVxuICAgICAgICAgICAgICAgIGFkZFRpbGUoJGNvbnRlbnQsIHNlc3Npb25zW2ldLnRhYiBhcyBUaXRsZVVybCk7XG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5mdW5jdGlvbiBzZXRVcEJvb2ttYXJrcyh0YWI6IFRhYiwgJGNvbnRlbnQ6IEpRdWVyeSwge3Jvd3MsIGNvbHN9KSB7XG4gICAgaWYgKCF0YWIuc3JjLnN0YXJ0c1dpdGgoJ2Jvb2ttYXJrOicpKSByZXR1cm47XG4gICAgY29uc3QgcGF0aCA9IHRhYi5zcmMucmVwbGFjZSgvXmJvb2ttYXJrOi8sICcnKS5zcGxpdCgnLycpO1xuICAgIGNocm9tZS5ib29rbWFya3MuZ2V0VHJlZShmdW5jdGlvbiAodHJlZSkge1xuICAgICAgICBjb25zdCBib29rbWFya1RyZWUgPSB0cmVlWzBdO1xuICAgICAgICBjb25zdCBmb2xkZXIgPSB0cmF2ZXJzZShib29rbWFya1RyZWUsIHBhdGgpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygncGF0aCcsIHBhdGgpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnZm9sZGVyJywgZm9sZGVyKTtcbiAgICAgICAgaWYgKGZvbGRlcikge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmb2xkZXIuY2hpbGRyZW4ubGVuZ3RoICYmIGkgPCByb3dzICogY29sczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYm9va21hcmsgPSBmb2xkZXIuY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgaWYgKCFib29rbWFyay5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBhZGRUaWxlKCRjb250ZW50LCBib29rbWFyayBhcyBUaXRsZVVybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSlcbn1cbiIsImV4cG9ydCBjbGFzcyBMb2dnZXIge1xuICAgIHByaXZhdGUgbmFtZTogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWUudG9VcHBlckNhc2UoKTtcbiAgICB9XG4gICAgbG9nKC4uLm1lc3NhZ2U6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMubmFtZSArICc6JywgLi4ubWVzc2FnZSk7XG4gICAgfVxuICAgIGVycm9yKC4uLm1lc3NhZ2U6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5uYW1lICsgJzonLCAuLi5tZXNzYWdlKTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvcGVuTGlua0Z1bmModXJsOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5jdHJsS2V5IHx8XG4gICAgICAgICAgICBldmVudC5zaGlmdEtleSB8fFxuICAgICAgICAgICAgZXZlbnQubWV0YUtleSB8fCAgLy8gY21kXG4gICAgICAgICAgICAoZXZlbnQuYnV0dG9uICYmIGV2ZW50LmJ1dHRvbiA9PT0gMSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjaHJvbWUudGFicy5jcmVhdGUoe3VybDogdXJsLCBhY3RpdmU6IGZhbHNlfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjaHJvbWUudGFicy5nZXRDdXJyZW50KGZ1bmN0aW9uICh0YWIpIHtcbiAgICAgICAgICAgICAgICBjaHJvbWUudGFicy51cGRhdGUodGFiLmlkLCB7dXJsOiB1cmx9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBsZXQgY2h1bmtlZFN0b3JhZ2UgPSB7XG4gICAgc2V0KGl0ZW1zOiBPYmplY3QsIGNhbGxiYWNrPykge1xuICAgICAgICBjb25zdCBzdG9yYWdlT2JqID0ge307XG4gICAgICAgIGZvciAobGV0IGtleSBpbiBpdGVtcykge1xuICAgICAgICAgICAgaWYgKCFpdGVtcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSBjb250aW51ZTtcbiAgICAgICAgICAgIGNvbnN0IG9iamVjdFRvU3RvcmUgPSBpdGVtc1trZXldO1xuICAgICAgICAgICAgbGV0IGpzb25zdHIgPSBKU09OLnN0cmluZ2lmeShvYmplY3RUb1N0b3JlKTtcbiAgICAgICAgICAgIGxldCBpID0gMDtcblxuICAgICAgICAgICAgLy8gc3BsaXQganNvbnN0ciBpbnRvIGNodW5rcyBhbmQgc3RvcmUgdGhlbSBpbiBhbiBvYmplY3QgaW5kZXhlZCBieSBga2V5X2lgXG4gICAgICAgICAgICB3aGlsZSAoanNvbnN0ci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBrZXkgKyBcIl9cIiArIGkrKztcblxuICAgICAgICAgICAgICAgIC8vIHNpbmNlIHRoZSBrZXkgdXNlcyB1cCBzb21lIHBlci1pdGVtIHF1b3RhLCBzZWUgaG93IG11Y2ggaXMgbGVmdCBmb3IgdGhlIHZhbHVlXG4gICAgICAgICAgICAgICAgLy8gYWxzbyB0cmltIG9mZiAyIGZvciBxdW90ZXMgYWRkZWQgYnkgc3RvcmFnZS10aW1lIGBzdHJpbmdpZnlgXG4gICAgICAgICAgICAgICAgLy8gbGV0IHZhbHVlTGVuZ3RoID0gY2hyb21lLnN0b3JhZ2Uuc3luYy5RVU9UQV9CWVRFU19QRVJfSVRFTSAtIGluZGV4Lmxlbmd0aCAtIDI7XG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlTGVuZ3RoID0gY2hyb21lLnN0b3JhZ2Uuc3luYy5RVU9UQV9CWVRFU19QRVJfSVRFTSAvIDI7XG4gICAgICAgICAgICAgICAgLy8gbGV0IHZhbHVlTGVuZ3RoID0gMTAwO1xuXG4gICAgICAgICAgICAgICAgLy8gdHJpbSBkb3duIHNlZ21lbnQgc28gaXQgd2lsbCBiZSBzbWFsbCBlbm91Z2ggZXZlbiB3aGVuIHJ1biB0aHJvdWdoIGBKU09OLnN0cmluZ2lmeWAgYWdhaW4gYXQgc3RvcmFnZSB0aW1lXG4gICAgICAgICAgICAgICAgbGV0IHNlZ21lbnQgPSBqc29uc3RyLnN1YnN0cigwLCB2YWx1ZUxlbmd0aCk7XG4gICAgICAgICAgICAgICAgLy8gd2hpbGUgKEpTT04uc3RyaW5naWZ5KHNlZ21lbnQpLmxlbmd0aCA+IHZhbHVlTGVuZ3RoKVxuICAgICAgICAgICAgICAgIC8vICAgICBzZWdtZW50ID0ganNvbnN0ci5zdWJzdHIoMCwgLS12YWx1ZUxlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICBzdG9yYWdlT2JqW2luZGV4XSA9IHNlZ21lbnQ7XG4gICAgICAgICAgICAgICAganNvbnN0ciA9IGpzb25zdHIuc3Vic3RyKHZhbHVlTGVuZ3RoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RvcmFnZU9ialtrZXkgKyAnXyBzaXplJ10gPSBpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHN0b3JlIGFsbCB0aGUgY2h1bmtzXG4gICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHN0b3JhZ2VPYmosIGNhbGxiYWNrKTtcbiAgICB9LFxuXG4gICAgZ2V0KGtleTogc3RyaW5nLCBjYWxsYmFjazogKHJlc3VsdDogYW55KSA9PiBhbnkpIHtcbiAgICAgICAgY29uc3Qgc2l6ZUtleSA9IGtleSArICdfIHNpemUnO1xuXG4gICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KHNpemVLZXksIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGlmIChyZXN1bHRbc2l6ZUtleV0pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnY2h1bmtzOicsIHJlc3VsdFtzaXplS2V5XSk7XG4gICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzdWx0W3NpemVLZXldOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAga2V5cy5wdXNoKGtleSArICdfJyArIGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLmdldChrZXlzLCBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFzc3VtZSB0aGF0IGtleXMgYXJlIHByZXNlbnRcbiAgICAgICAgICAgICAgICAgICAgbGV0IGpzb25TdHIgPSBrZXlzLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3Vycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByZXYgKyByZXN1bHRbY3Vycl07XG4gICAgICAgICAgICAgICAgICAgIH0sICcnKTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soe1trZXldOiBKU09OLnBhcnNlKGpzb25TdHIpfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHt9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICByZW1vdmUoa2V5LCBjYWxsYmFjaykge1xuICAgICAgICAvLyB0b2RvXG4gICAgfVxufTtcblxuIl19
