import {Engine, Search} from "./types";
import {Logger} from "./utils";


const logger = new Logger('search');

export function setUpSearch(searchOptions: Search) {
    logger.log('setting search and search engines...');
    const $searchInput = $('#search');
    const $searchButton = $('#search-btn');
    const $suggestions = $('#suggestions');
    const typingInterval = 333;
    let typingTimer;

    setUpEngines(searchOptions);

    $searchInput.on('keypress', e => {
        if (e.keyCode === 13) {
            e.preventDefault();
            doSearch();
        }
    });

    function setSuggestions(init: string, list: string[]) {
        $suggestions.html('');
        list.forEach(function (query) {
            const marked = init + '<b>' + query.substr(init.length) + '</b>';
            const $link = $('<a>').html(marked);
            $link.click(function () {
                if (searchOptions.labelIsUrl) {
                    $searchInput.val(query).trigger('input').focus();
                }
                else
                    doSearch(query);
            });
            $suggestions.append($link);
        })
    }

    $searchInput.on('input', function () {
        clearTimeout(typingTimer);
        let val = $(this).val() as string;
        if (val.length == 0)
            $suggestions.html('');
        else {
            typingTimer = setTimeout(finishedTyping, typingInterval, val);
        }
    });

    function finishedTyping(query) {
        $.get({
            dataType: "jsonp",
            url: 'https://suggestqueries.google.com/complete/search?output=firefox&q=' + encodeURIComponent(query),
            success: function (res) {
                setSuggestions(query, res[1]);
            }
        });
    }

    $searchInput.focusin(function () {
        $suggestions.css('display', 'block');
    });

    $searchInput.focusout(function () {
        if (!$suggestions.is(':hover')) {
            $suggestions.css('display', 'none');
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
                doSearch(null, $(this).attr('data-url'));
        });
        $enginesForm.append($engine)
    });
}

function doSearch(query?: string, url?: string) {
    query = query || $('#search').val() as string;
    url = $('#engines').find('input[name=engine]:checked').attr('data-url') ||
        'http://google.com/search?q=';
    if (query) {
        const destUrl = url + encodeURIComponent(query as string);
        chrome.tabs.getCurrent(function (tab) {
            chrome.tabs.update(tab.id, {
                url: destUrl,
            });
        });
    }
}
