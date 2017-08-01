import {Options, Theme, Visibility} from "./types";
import {Logger} from "./utils";


const logger = new Logger('options');

export function setUpOptions(options: Options) {
    setActions(options);
    setUpTheme(options.theme)
}

function setActions(options) {
    logger.log('setting save and set default buttons...');
    $('#save-settings').click(function () {
        chrome.storage.sync.set({'options': options}, function () {
            logger.log('saved');
        })
    });

    $('#set-default').click(function () {
        chrome.storage.sync.remove('options', function () {
            logger.log('removed options');
            // todo: apply default options
        });
    });
}

function setUpTheme(theme: Theme) {
    logger.log('setting visibility and background..');
    visibility(theme.visibility);
    // background(theme.background)
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
        else {
            $(this).removeClass('visible');
        }
    }, function () {
        $(this).removeClass('visible');
    });

    $opacityInput.val(options.opacity).trigger('change');
    $hoverInput.prop('checked', options.revealOnHover);
}
