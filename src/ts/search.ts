import {Engine, Search} from "./types";
import {Logger} from "./utils";


const logger = new Logger('search');

export function setUpSearch(searchOptions: Search) {
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

export function setUpEngines(options: Search): void {
    const $enginesForm = $('#engines');
    const $source = $("#engine-template").html();
    const engineTemplate = Handlebars.compile($source);

    $enginesForm.html('');  // clear

    options.engines.forEach(function (engine) {
        const $engine = $(engineTemplate({
            name: engine.name,
            url: engine.url,
            checked: engine.name === options.def,
        }));
        $engine.find('input').click(function () {
            $('#search').focus();
            if (options.labelIsUrl)
                doSearch($(this).attr('data-url'));
        });
        $enginesForm.append($engine)
    });
}

function doSearch(url = 'http://google.com/search?q=') {
    let query = $('#search').val();
    url = $('#engines').find('input[name=engine]:checked').attr('data-url') || url;
    if (query) {
        const destUrl = url + encodeURIComponent(query as string);
        chrome.tabs.getCurrent(function (tab) {
            chrome.tabs.update(tab.id, {
                url: destUrl,
            });
        });
    }
}
