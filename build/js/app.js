define("utils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function default_1(word) {
        return word.toUpperCase();
    }
    exports.default = default_1;
});
define("app", ["require", "exports", "utils"], function (require, exports, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var body2 = $('body');
    console.log('worked or not?');
    body2.append(utils_1.default('not kek but hurma'));
    body2.addClass('lel');
});
//# sourceMappingURL=app.js.map