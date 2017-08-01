import {openLinkFunc, Logger} from "./utils";


const logger = new Logger('navbar');

export function setUpNavbar() {
    setTimeout(setUpNavUrls, 0);
    setTimeout(setUpAddons, 0);
}

function setUpNavUrls() {
    logger.log('setting urls...');
    $('#history').click(openLinkFunc('chrome://history/'));
    $('#bookmarks').click(openLinkFunc('chrome://bookmarks/'));
    $('#extensions').click(openLinkFunc('chrome://extensions/'));
    $('#all-apps').click(openLinkFunc('chrome://apps/'));
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
