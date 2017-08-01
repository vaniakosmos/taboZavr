import {Engine, Search} from "./types";
import {Logger} from "./utils";


const logger = new Logger('search');

export function setUpSearch(searchOptions: Search) {
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
            const destUrl = url + encodeURIComponent(query as string);
            chrome.tabs.getCurrent(function (tab) {
                chrome.tabs.update(tab.id, {
                    url: destUrl,
                });
            });
        }
    }

    $engineInputs.forEach(function ($engineInput) {
        $engineInput.click(function () {
            $searchInput.focus();
            if (searchOptions.labelIsUrl)
                doSearch($engineInput.attr('data-url'));
        })
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

function setUpEngines(engines: Array<Engine>, def: string): JQuery[] {
    const $enginesForm = $('#engines');
    const $source = $("#engine-template").html();
    const engineTemplate = Handlebars.compile($source);
    const $engines = [];
    engines.forEach(function (engine) {
        const $engine = $(engineTemplate({
            name: engine.name,
            url: engine.url,
            checked: engine.name === def,
        }));
        $engines.push($engine.find('input'));
        $enginesForm.append($engine)
    });
    return $engines;
}
