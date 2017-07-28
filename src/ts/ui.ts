import {Theme} from "./types";
import {Logger} from './utils'
import Tab = chrome.tabs.Tab;
import ChromeSetting = chrome.types.ChromeSetting;

const logger = new Logger('ui');

export function applyTheme(theme: Theme) {
    // title
    document.title = theme.title;

    // header
    const $title = $("#title");
    const header = theme.header;
    if (header.hide) {
        $title.hide();
    }
    else {
        $title
            .html(header.value)
            .css('font-size', header.size);
    }

    if (theme.isImage) {
        // image
    }
    else {
        // background
        $('body').css('background', theme.background);
    }

    // accent
    $('.accent').css('background', theme.accent);
}

export function setUpNavUrls() {
    $('#history').click(linker('chrome://history/'));
    $('#bookmarks').click(linker('chrome://bookmarks/'));
    $('#extensions').click(linker('chrome://extensions/'));
    $('#all-apps').click(linker('chrome://apps/'));
    setUpAddons();
}

function linker(url: string) {
    return function (event) {
        if (event.ctrlKey ||
            event.shiftKey ||
            event.metaKey ||  // cmd
            (event.button && event.button === 1)
        ) {
            chrome.tabs.create({url: url, active: false});
        }
        else {
            chrome.tabs.getCurrent(function (tab) {
                chrome.tabs.update(tab.id, {url: url});
            })
        }
    }
}

const source = $("#app-template").html();
const appTempalte = Handlebars.compile(source);

function setUpAddons() {
    chrome.management.getAll(function (addons) {
        const $app_list = $('#apps');

        function add_addon($target: JQuery,
                           addon: chrome.management.ExtensionInfo,
                           callback) {
            let icon = '';
            if (addon.icons) {
                icon = addon.icons[addon.icons.length-1].url;
            }
            $target.append(
                $(appTempalte({
                    name: addon.name,
                    icon: icon,
                })).click(callback)
            );
        }

        // todo: show icon instead of addons name
        for (let addon of addons) {
            console.log(addon.name);
            console.log(addon.icons);
            if (addon.type.endsWith('_app')) {
                let icon = '';
                if (addon.icons) {
                    icon = addon.icons[addon.icons.length-1].url;
                }
                $app_list.append(
                    $(appTempalte({
                        name: addon.name,
                        icon: icon,
                    })).click(() => chrome.management.launchApp(addon.id))
                );
            }
        }
    });
}
