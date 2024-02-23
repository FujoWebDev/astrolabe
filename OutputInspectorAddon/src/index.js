"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withContentChangeHandler = exports.CHANNEL_NAME = void 0;
var core_1 = require("@tiptap/core");
var parser_html_1 = require("prettier/parser-html");
var standalone_1 = require("prettier/standalone");
var addons_1 = require("@storybook/addons");
var sanitizeJson = function (json) {
    var _a;
    return __assign(__assign({}, json), { content: (_a = json.content) === null || _a === void 0 ? void 0 : _a.map(function (item) {
            if (!item.attrs || !("src" in item.attrs)) {
                return item;
            }
            return __assign(__assign({}, item), { attrs: __assign(__assign({}, item.attrs), { 
                    // If we have data:image attributes, these are going to be very long, which makes codemirror not have a good time
                    src: item.attrs.src.substring(0, 1000) }) });
        }) });
};
var formatHtml = function (json, extensions) {
    var html = (0, core_1.generateHTML)(json, extensions);
    return standalone_1.default
        .format(html
        // linebreaks preceeded by text (that is not a closing tag) should break
        // on their own line
        .replaceAll(/[^>]<br( \/)?>/g, "\n<br />\n")
        // linebreaks followed by text (that is not an opening tag) should move
        // the text to the following line
        .replaceAll(/<br( \/)?>[^<]/g, "<br />\n"), {
        parser: "html",
        plugins: [parser_html_1.default],
    })
        .trim();
};
exports.CHANNEL_NAME = "CONTENT_UPDATED_CHANNEL";
// export const withContentChangeHandler =
//   (extensions: Extensions) => (json: JSONContent) => {
//     const sanitizedJson = sanitizeJson(json);
//     console.log("in", addons.getChannel());
//     addons.getChannel().emit(CHANNEL_NAME, {
//       json: sanitizedJson,
//       html: formatHtml(sanitizedJson, extensions),
//     });
//   };
var withContentChangeHandler = function (extensions) {
    return function (storyFn, context) {
        var emit = (0, addons_1.useChannel)({});
        context.args.onContentChange = function (json) {
            var sanitizedJson = sanitizeJson(json);
            emit(exports.CHANNEL_NAME, {
                json: sanitizedJson,
                html: formatHtml(sanitizedJson, extensions),
            });
        };
        return storyFn(context);
    };
};
exports.withContentChangeHandler = withContentChangeHandler;
