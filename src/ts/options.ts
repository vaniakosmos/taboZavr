import {Background, Engine, Options, Search, Theme, Visibility} from "./types";
import {Logger} from "./utils";
import {setUpEngines} from "./search";


const logger = new Logger('options');

const fieldTemplate = Handlebars.compile($("#field-template").html());

export function setUpOptions(options: Options) {
    setActions(options);
    setUpTheme(options.theme);
    setUpSearch(options.search);
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

function setActions(options) {
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

function setUpSearch(options: Search) {
    const $fieldsContainer = $('#opt-search-fields');
    const $searchOnLabel = $('#opt-search-labelclick');

    $searchOnLabel.prop('checked', options.labelIsUrl);

    $searchOnLabel.change(function () {
        console.log('click');
        options.labelIsUrl = $(this).prop('checked');
    });

    function addField({name, url}) {
        let $html = $(fieldTemplate({name: name, second: url, placeholder: 'url...'}));
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
        .find(`input[name="engines"][value="${options.def}"]`)
        .prop('checked', true);

    $('#opt-search-ok').click(function () {
        const names = new Set();
        const engines: Engine[] = [];
        let ok = true;
        let newDefault = '';

        $fieldsContainer.find('div').each(function () {
            const $nameInput = $(this).find('input[name=first]');
            const $urlInput = $(this).find('input[name=second]');
            const $radio = $(this).find('input[type=radio]');

            const name = $nameInput.val() as string;
            const url = $urlInput.val() as string;

            if (name == '' || names.has(name)) {
                $nameInput.addClass('uk-form-danger');
                ok = false;
            }
            else if (!url.match(/^https?:\/\/.+\..+\?.+=$/i)) {
                $urlInput.addClass('uk-form-danger');
                ok = false;
            }
            else {
                names.add(name);
                engines.push({name: name, url: url});
                if ($radio.prop('checked'))
                    newDefault = name;
            }
        });

        if (ok) {
            console.log('save');
            options.def = newDefault;
            options.engines = engines;
            setUpEngines(options);
            UIkit.modal($('#opt-search-modal')).hide();
        }
        else {
            console.log('reject');
        }

        console.log(options);
    });
}

function setUpTheme(theme: Theme) {
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
