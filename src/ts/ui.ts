import {Theme} from "./types";
import {openLinkFunc, Logger} from './utils'
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
    $('#history').click(openLinkFunc('chrome://history/'));
    $('#bookmarks').click(openLinkFunc('chrome://bookmarks/'));
    $('#extensions').click(openLinkFunc('chrome://extensions/'));
    $('#all-apps').click(openLinkFunc('chrome://apps/'));
    setUpAddons();
}


function setUpAddons() {
    const $source = $("#app-template").html();
    const appTemplate = Handlebars.compile($source);

    chrome.management.getAll(function (addons) {
        const $apps_list = $('#apps');
        for (let addon of addons) {
            if (addon.type.endsWith('_app')) {
                let icon = '';
                if (addon.icons) {
                    icon = addon.icons[addon.icons.length-1].url;
                }
                const appHtml = appTemplate({
                    name: addon.name,
                    icon: icon,
                });
                const $clickableApp = $(appHtml).click(() => chrome.management.launchApp(addon.id));
                $apps_list.append($clickableApp);
            }
        }
    });
}
