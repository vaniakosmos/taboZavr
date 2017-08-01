import {Tab, Tabs} from "./types";
import {openLinkFunc, Logger} from "./utils";
import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;


const logger = new Logger('tabs');

interface TitleUrl {
    title: string,
    url: string
}

const tileTemplate = Handlebars.compile($("#tile-template").html());
const headerTemplate = Handlebars.compile($("#tab-title-template").html());


export function setUpTabs(tabs: Tabs) {
    logger.log('setting tabs...');
    const $tabs = $('#tabs');
    const $headers = $tabs.find('ul').eq(0);
    const $contents = $tabs.find('ul').eq(1);


    for (let tab of tabs.entities) {
        const header = headerTemplate({
            name: tab.name,
            active: tab.name.toLowerCase() === tabs.def.toLowerCase(),
        });
        $headers.append(header);
        const $content = $('<li>');
        $contents.append($content);

        if (tab.src === 'top') {
            setUpTop($content, tabs.grid)
        }
        else if (tab.src === 'recent') {
            setUpRecent($content, tabs.grid)
        }
        else {
            setUpBookmarks(tab, $content, tabs.grid);
        }
    }
}

function addTile($content: JQuery, data: TitleUrl) {
    const $tile = $(tileTemplate({
        favicon: `chrome://favicon/size/16@2x/${data.url}`,
        title: data.title,
        url: decodeURIComponent(data.url)
    }));

    if (data.url.startsWith('chrome')) {
        $tile.click(openLinkFunc(data.url));
    }

    $content.append($tile);
}

function traverse(tree: BookmarkTreeNode, path: string[]): BookmarkTreeNode {
    if (path.length === 0)
        return tree;
    for (let child of tree.children) {
        if (child.title === path[0]) {
            path = path.slice(1);
            return traverse(child, path);
        }
    }
    return null;
}

function setUpTop($content: JQuery, {rows, cols}) {
    chrome.topSites.get(function (urls) {
        for (let i = 0; i < urls.length && i < rows * cols; i++) {
            addTile($content, urls[i]);
        }
    });
}

function setUpRecent($content: JQuery, {rows, cols}) {
    chrome.sessions.getRecentlyClosed(function (sessions) {
        for (let i = 0; i < sessions.length && i < rows * cols; i++) {
            if (sessions[i].tab)
                addTile($content, sessions[i].tab as TitleUrl);
        }
    })
}

function setUpBookmarks(tab: Tab, $content: JQuery, {rows, cols}) {
    if (!tab.src.startsWith('bookmark:')) return;
    const path = tab.src.replace(/^bookmark:/, '').split('/');
    chrome.bookmarks.getTree(function (tree) {
        const bookmarkTree = tree[0];
        const folder = traverse(bookmarkTree, path);
        // console.log('path', path);
        // console.log('folder', folder);
        if (folder) {
            for (let i = 0; i < folder.children.length && i < rows * cols; i++) {
                const bookmark = folder.children[i];
                if (!bookmark.children) {
                    addTile($content, bookmark as TitleUrl);
                }
            }
        }
        else {
            // todo: remove from header
        }
    })
}
