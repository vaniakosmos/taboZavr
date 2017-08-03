import {Background, Engine, Options, Search, Tab, Theme, Visibility} from "./types";
import {Logger} from "./utils";
import {setUpEngines} from "./search";
import {setUpTabs} from "./tabs";


const logger = new Logger('options');

const fieldTemplate = Handlebars.compile($("#field-template").html());

export function setUpOptions(options: Options) {
    actions(options);
    themeOptions(options.theme);
    searchOptions(options);
    tabsOptions(options);
}

function fadeInOut($target: JQuery, html, duration = 1000) {
    $target
        .html(html)
        .addClass('uk-animation-slide-top-small')
        .removeClass('uk-animation-slide-bottom-small uk-animation-reverse');
    setTimeout(function () {
        $target
            .remove('uk-animation-slide-top-small')
            .addClass('uk-animation-slide-bottom-small uk-animation-reverse');

    }, duration)
}

function actions(options) {
    logger.log('setting save and set default buttons...');
    const $actionsInfo = $('#actions-info');

    $('#save-settings').click(function () {
        if (options.theme.background.def != 'image')
            options.theme.background.image = '';
        chrome.storage.local.set({'options': options}, function () {
            logger.log('saved');
            fadeInOut($actionsInfo, 'saved', 1500)
        })
    });

    $('#set-default-modal').find('button[name="ok"]').click(function () {
        chrome.storage.local.clear(function () {
            logger.log('cleared storage');
            // todo: apply default options w/o reloading (but need to exclude from reloading event listeners appliers)
            chrome.tabs.getCurrent(function (tab) {
                chrome.tabs.reload(tab.id);
            });
        });
    });
}

function searchOptions(allOptions: Options) {
    const options = allOptions.search;
    const $fieldsContainer = $('#opt-search-fields');
    const $searchOnLabel = $('#opt-search-labelclick');
    const $error = $('#opt-search-error');

    $searchOnLabel.prop('checked', options.labelIsUrl);

    $searchOnLabel.change(function () {
        options.labelIsUrl = $(this).prop('checked');
    });

    function addField({name, url}) {
        let $html = $(fieldTemplate({name: name, second: url, placeholder: 'url...', radioName: 'default-engine'}));
        $html.find('button[uk-close]').click(function () {
            $(this).parent().remove();
        });
        $html.find('input').on('input', function () {
             $(this).removeClass('uk-form-danger')
        });
        $fieldsContainer.append($html);
    }

    options.engines.forEach(function (engine) {
        addField(engine)
    });

    $('#opt-search-add').click(function () {
        addField({name: '', url: ''})
    });

    $fieldsContainer
        .find(`input[name="default-engine"][value="${options.def}"]`)
        .prop('checked', true);

    $('#opt-search-save').click(function () {
        const names = new Set();
        const engines: Engine[] = [];
        let error = 0;
        let newDefault = null;

        $fieldsContainer.find('div').each(function () {
            const $nameInput = $(this).find('input[name=first]');
            const $urlInput = $(this).find('input[name=second]');
            const $radio = $(this).find('input[type=radio]');

            const name = $nameInput.val() as string;
            const url = $urlInput.val() as string;

            if (name == '' || names.has(name)) {
                $nameInput.addClass('uk-form-danger');
                error = 1;
            }
            else if (!url.match(/^https?:\/\/.+\..+\?.+=$/i)) {
                $urlInput.addClass('uk-form-danger');
                error = 2;
            }
            else {
                names.add(name);
                engines.push({name: name, url: url});
                if ($radio.prop('checked'))
                    newDefault = name;
            }
        });

        if (newDefault == null && error == 0)
            error = 3;

        switch (error) {
            case 1:
                $error.text('name must be unique and not empty');
                break;
            case 2:
                $error.text('invalid url');
                break;
            case 3:
                $error.text('specify default search engine (check radio button)');
                break;
        }

        if (error == 0) {
            options.def = newDefault;
            options.engines = engines;
            chrome.storage.local.set({'options': allOptions}, function () {
                UIkit.modal($('#opt-search-modal')).hide();
                setUpEngines(options);
            });
        }
    });
}


function tabsOptions(allOptions: Options) {
    const options = allOptions.tabs;
    const $fieldsContainer = $('#opt-tabs-fields');
    const $sizeInputs = $('#opt-tabs-size').find('input');
    const $error = $('#opt-tabs-error');

    function addField({name, src}) {
        let $html = $(fieldTemplate({name: name, second: src, placeholder: 'source...', radioName: 'default-tab'}));
        $html.find('button[uk-close]').click(function () {
            $(this).parent().remove();
        });
        $html.find('input').on('input', function () {
            $(this).removeClass('uk-form-danger')
        });
        $fieldsContainer.append($html);
    }

    $sizeInputs.eq(0).val(options.grid.cols);
    $sizeInputs.eq(1).val(options.grid.rows);
    $sizeInputs.on('input', function () {
        $(this).removeClass('uk-form-danger');
    });

    options.entities.forEach(function (tab) {
        addField(tab)
    });

    $('#opt-tabs-add').click(function () {
        addField({name: '', src: ''})
    });

    $fieldsContainer
        .find(`input[name="default-tab"][value="${options.def}"]`)
        .prop('checked', true);

    $('#opt-tabs-save').click(function () {
        const names = new Set();
        const tabs: Tab[] = [];
        let error = 0;
        let newDefault = null;

        $fieldsContainer.find('div').each(function () {
            const $nameInput = $(this).find('input[name=first]');
            const $srcInput = $(this).find('input[name=second]');
            const $radio = $(this).find('input[type=radio]');

            const name = $nameInput.val() as string;
            const src = $srcInput.val() as string;

            if (name == '' || names.has(name)) {
                $nameInput.addClass('uk-form-danger');
                error = 1;
            }
            else if (src != 'recent' &&
                src != 'top' &&
                !src.match(/^bookmark:[^\/]+(\/[^\/]+)*$/i)) {
                $srcInput.addClass('uk-form-danger');
                error = 2;
            }
            else {
                names.add(name);
                tabs.push({name: name, src: src});
                if ($radio.prop('checked'))
                    newDefault = name;
            }
        });

        if (newDefault == null && error == 0)
            error = 3;

        $sizeInputs.each(function () {
            let num = $(this).val() as number;
            console.log(typeof num);
            console.log(num);
            if (num < 2 || num > 10) {
                error = 4;
                $(this).addClass('uk-form-danger');
            }
        });


        switch (error) {
            case 1:
                $error.text('name must be unique and not empty');
                break;
            case 2:
                $error.text('invalid source');
                break;
            case 3:
                $error.text('specify default tab (check radio button)');
                break;
            case 4:
                $error.text('cols and rows must in range [2, 10]');
                break;
        }

        if (error == 0) {
            options.def = newDefault;
            options.entities = tabs;
            options.grid = {
                cols: $sizeInputs.eq(0).val() as number,
                rows: $sizeInputs.eq(1).val() as number,
            };
            chrome.storage.local.set({'options': allOptions}, function () {
                UIkit.modal($('#opt-tabs-modal')).hide();
                setUpTabs(options);
            });
        }
    });
}

function themeOptions(theme: Theme) {
    logger.log('setting visibility and background..');
    visibility(theme.visibility);
    background(theme.background);
    title(theme);
}

function title(theme: Theme) {
    const $titleInput = $('#title-input');

    $('title').text(theme.title);
    $titleInput.val(theme.title);

    $titleInput.on('input', function () {
        let title = $(this).val() as string;
        theme.title = title;
        $('title').text(title);
    })
}

function background(options: Background) {
    const $body = $('body');
    const $inputs = $('select[name=background]');

    const $colorInput = $('#bg-color-input');
    const $imageInput = $('#bg-image-input');
    const $urlInput = $('#bg-url-input');

    function setColor(color) {
        $body
            .css('background-color', color)
            .css('background-image', 'none');
    }

    function setImage(image) {
        $body
            .css('background-color', '')
            .css('background-image', `url("${image}")`);
    }

    function setBG() {
        if (options.def == 'image' && options.image != '') {
            setImage(options.image)
        }
        else if (options.def == 'url' && options.url != '') {
            setImage(options.url)
        }
        else {
            setColor(options.color)
        }
    }

    // set up options current values
    $inputs.val(options.def).change();
    $colorInput.val(options.color);
    $urlInput.val(options.url);

    // set up bg
    setBG();

    // set up listeners
    $inputs.change(function () {
        options.def = $(this).val() as string;
        setBG();
    });

    $colorInput.change(function () {
        let color = $(this).val() as string;
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
        if (file)
            reader.readAsDataURL(file);
    });

    $urlInput.on('input', function () {
        const url = $(this).val() as string;
        if (url.match(/^https?:.*\.(png|jpg|jpeg)$/)) {
            setImage(url);
            options.url = url;
            $inputs.val('url').change();
        }
    })
}

function visibility(options: Visibility) {
    const $block = $('#opt-visibility');
    const $opacity = $block.find('div').eq(0);
    const $hover = $block.find('div').eq(1);
    const $opacityInput = $opacity.find('input');
    const $hoverInput = $hover.find('input');

    $opacityInput.on('change mousemove', function () {
        const val = $(this).val() as number;
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
        }
    }, function () {
        $(this).removeClass('visible');
    });

    $opacityInput.val(options.opacity).trigger('change');
    $hoverInput.prop('checked', options.revealOnHover);
}
