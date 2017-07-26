import {Theme} from "./types";
import {Logger} from './utils'

const logger = new Logger('ui');

export default {
    applyTheme(theme: Theme) {
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
}

